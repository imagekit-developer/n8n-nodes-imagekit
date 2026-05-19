import type {
	ICredentialDataDecryptedObject,
	ICredentialsDecrypted,
	ICredentialTestFunctions,
	IDataObject,
	IHookFunctions,
	INodeCredentialTestResult,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { createHmac } from 'crypto';
import { verifyImagekitSignature } from './verifySignature';

/** Single trigger node for every ImageKit webhook event. Sits next to
 *  Imagekit.node.ts so n8n's picker groups them under one "Imagekit"
 *  panel (Actions + Triggers) — same convention as Slack/SlackTrigger.
 *  See https://imagekit.io/docs/webhooks for payload structure. */
export class ImagekitTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ImageKit Trigger',
		name: 'imagekitTrigger',
		icon: { light: 'file:imagekit.light.svg', dark: 'file:imagekit.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description:
			'Triggers on ImageKit webhook events (file lifecycle, transformations, video processing).',
		eventTriggerDescription: 'Waiting for an ImageKit webhook delivery',
		defaults: { name: 'ImageKit Trigger' },
		// Surfaces the trigger as an AI tool so agents can subscribe to ImageKit
		// webhook events programmatically (matches the n8n strict-lint default).
		usableAsTool: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'imagekitWebhookApi',
				required: false,
				// Locally-defined HMAC sanity check; see methods.credentialTest below.
				// n8n's credential-test-required lint rule requires every node-level
				// usage of a credential to declare either an HTTP test or a testedBy
				// reference, since webhook signing secrets can't be remotely validated.
				testedBy: 'imagekitWebhookSecretTest',
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'imagekit-webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [
					'file.created',
					'file.updated',
					'file.deleted',
					'file-version.created',
					'file-version.deleted',
					'upload.pre-transform.success',
					'upload.pre-transform.error',
					'upload.post-transform.success',
					'upload.post-transform.error',
					'video.transformation.accepted',
					'video.transformation.ready',
					'video.transformation.error',
				],
				description:
					'Which event types this trigger should fire on. ImageKit fans every configured event out to the same URL, so unselected events are 200-acked but no workflow run is started.',
				options: [
					{
						name: 'File Created',
						value: 'file.created',
					},
					{
						name: 'File Deleted',
						value: 'file.deleted',
					},
					{
						name: 'File Updated',
						value: 'file.updated',
					},
					{
						name: 'File Version Created',
						value: 'file-version.created',
					},
					{
						name: 'File Version Deleted',
						value: 'file-version.deleted',
					},
					{
						name: 'Post-Transformation Error',
						value: 'upload.post-transform.error',
					},
					{
						name: 'Post-Transformation Success',
						value: 'upload.post-transform.success',
					},
					{
						name: 'Pre-Transformation Error',
						value: 'upload.pre-transform.error',
					},
					{
						name: 'Pre-Transformation Success',
						value: 'upload.pre-transform.success',
					},
					{
						name: 'Video Transformation Accepted',
						value: 'video.transformation.accepted',
					},
					{
						name: 'Video Transformation Error',
						value: 'video.transformation.error',
					},
					{
						name: 'Video Transformation Ready',
						value: 'video.transformation.ready',
					},
				],
			},
			{
				displayName: 'Verify Signature',
				name: 'verifySignature',
				type: 'boolean',
				default: true,
				description:
					'Whether to validate the x-ik-signature header against the webhook signing secret stored in the ImageKit Webhook credential. Strongly recommended; disable only for local debugging.',
			},
			{
				displayName:
					'Signature verification is disabled. Any caller who discovers this webhook URL can trigger this workflow with arbitrary payloads. Re-enable verification (and connect an ImageKit Webhook credential) before going to production.',
				name: 'verifySignatureDisabledNotice',
				type: 'notice',
				default: '',
				displayOptions: { show: { verifySignature: [false] } },
			},
			{
				displayName: 'Tolerance (Seconds)',
				name: 'toleranceSeconds',
				type: 'number',
				default: 300,
				typeOptions: { minValue: 0 },
				displayOptions: { show: { verifySignature: [true] } },
				description:
					'Maximum allowed difference between the timestamp in the x-ik-signature header and the current time. Helps mitigate replay attacks.',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				// ImageKit has no programmatic webhook registration API.
				// The URL must be configured manually in the ImageKit dashboard.
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				// No API to call — the user copies the webhook URL shown in n8n
				// and pastes it into the ImageKit dashboard under Settings > Webhooks.
				// Surface a hint in the execution log so the requirement is discoverable
				// at activation time, not just buried in the README.
				const webhookUrl = this.getNodeWebhookUrl('default');
				this.logger.info(
					`[ImagekitTrigger] No public webhook registration API. Add this URL in the ImageKit dashboard (Settings > Webhooks): ${webhookUrl}`,
				);
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				// No API to call — the user removes the URL from the ImageKit dashboard manually.
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const events = this.getNodeParameter('events') as string[];
		const verify = this.getNodeParameter('verifySignature') as boolean;
		const toleranceSeconds = this.getNodeParameter('toleranceSeconds', 300) as number;
		const headers = this.getHeaderData() as IDataObject;
		const body = this.getBodyData() as IDataObject;
		const eventType = (body.type as string | undefined) ?? '';

		if (verify) {
			const credentials = await this.getCredentials('imagekitWebhookApi');
			const secret = (credentials?.secret as string | undefined) ?? '';
			// n8n's express layer preserves the raw text on req.rawBody; we need
			// it because re-stringifying the parsed body would change byte
			// ordering and break the HMAC.
			const req = this.getRequestObject() as unknown as { rawBody?: Buffer | string };
			const result = verifyImagekitSignature(
				req.rawBody,
				headers['x-ik-signature'] as string | string[] | undefined,
				secret,
				{ toleranceMs: toleranceSeconds * 1000 },
			);
			if (!result.valid) {
				const res = this.getResponseObject();
				res.status(401).json({ error: 'invalid-signature', reason: result.reason });
				return { noWebhookResponse: true };
			}
		}

		// Drop deliveries that aren't in the user-selected events filter.
		// 200-ack so ImageKit doesn't retry; the workflow just doesn't run.
		if (events.length > 0 && !events.includes(eventType)) {
			return { noWebhookResponse: false, workflowData: [] };
		}

		return { workflowData: [this.helpers.returnJsonArray([body])] };
	}

	/** Local credential test for ImagekitWebhookApi. n8n's credential lint
	 *  rule requires every credential to declare a `test` or `testedBy`,
	 *  and webhook signing secrets cannot be remotely validated (there is no
	 *  ImageKit endpoint that accepts the secret to confirm it). So this test
	 *  runs the secret through the same HMAC-SHA256 routine the runtime
	 *  webhook handler uses, catching malformed inputs (empty, non-string,
	 *  unsupported encodings) before any delivery is received. */
	methods = {
		credentialTest: {
			async imagekitWebhookSecretTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const data = (credential.data ?? {}) as ICredentialDataDecryptedObject;
				const secret = (data.secret as string | undefined) ?? '';
				if (!secret) {
					return { status: 'Error', message: 'Webhook secret is required.' };
				}
				if (!secret.startsWith('whsec_')) {
					return {
						status: 'Error',
						message:
							'Webhook secret must start with "whsec_" (copy it from the ImageKit dashboard).',
					};
				}
				try {
					// Same HMAC routine the runtime handler uses. If Node's crypto
					// rejects the key (e.g. unsupported encoding) this throws and we
					// surface the underlying message to the user.
					createHmac('sha256', secret).update('imagekit-credential-test').digest('hex');
				} catch (error) {
					return {
						status: 'Error',
						message: `Secret cannot be used as an HMAC-SHA256 key: ${(error as Error).message}`,
					};
				}
				return {
					status: 'OK',
					message:
						'Webhook secret format is valid. Real signature verification happens when ImageKit delivers a webhook.',
				};
			},
		},
	};
}
