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
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { createHmac } from 'crypto';
import { verifyImagekitSignature } from './verifySignature';

const WEBHOOK_PERMISSION_MESSAGE =
	'The ImageKit API key in your ImageKit API credential is not allowed to manage webhooks (HTTP 403). Standard keys cannot access webhooks: use a restricted API key with webhook access (https://imagekit.io/docs/api-keys), or create the webhook in the ImageKit dashboard yourself and turn off "Automatic Webhook Setup" on this node.';

/** v1 nodes predate auto-registration, so an absent param means manual. */
function isAutoWebhookSetup(ctx: IHookFunctions | IWebhookFunctions): boolean {
	return ctx.getNodeParameter('autoWebhookSetup', ctx.getNode().typeVersion !== 1) as boolean;
}

/** n8n wraps HTTP failures in NodeApiError (httpCode is a string); fall back
 *  to the raw axios shape in case the helper ever rethrows unwrapped. */
function isForbidden(error: unknown): boolean {
	const e = error as {
		httpCode?: string | number;
		statusCode?: number;
		response?: { status?: number };
	};
	return Number(e?.httpCode ?? e?.statusCode ?? e?.response?.status) === 403;
}

export class ImagekitTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ImageKit Trigger',
		name: 'imagekitTrigger',
		icon: { light: 'file:imagekit.light.svg', dark: 'file:imagekit.dark.svg' },
		group: ['trigger'],
		version: [1, 2],
		defaultVersion: 2,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description:
			'Triggers on ImageKit webhook events (file and folder lifecycle, transformations, video processing).',
		eventTriggerDescription: 'Waiting for an ImageKit webhook delivery',
		defaults: { name: 'ImageKit Trigger' },
		usableAsTool: undefined,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'imagekitApi',
				required: true,
				displayOptions: { show: { autoWebhookSetup: [true] } },
			},
			{
				name: 'imagekitWebhookApi',
				required: false,
				displayOptions: { show: { autoWebhookSetup: [false] } },
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
			// The notices sit before the toggle on purpose: n8n renders the
			// credential picker right before the last parameter the credentials'
			// displayOptions depend on (autoWebhookSetup), so this yields
			// notice -> credential -> toggle in the panel.
			{
				displayName:
					'The webhook is created in ImageKit automatically when this workflow is activated. This needs a <a href="https://imagekit.io/docs/api-keys" target="_blank">restricted API key</a> with webhook access; otherwise turn off "Automatic Webhook Setup".',
				name: 'autoWebhookNotice',
				type: 'notice',
				default: '',
				displayOptions: { show: { autoWebhookSetup: [true] } },
			},
			{
				displayName:
					'Create the webhook in the <a href="https://imagekit.io/dashboard/developer/webhooks" target="_blank">ImageKit dashboard</a> with the URL above, then paste its signing secret into the ImageKit Webhook API credential below.',
				name: 'manualWebhookNotice',
				type: 'notice',
				default: '',
				displayOptions: { show: { autoWebhookSetup: [false] } },
			},
			{
				displayName: 'Automatic Webhook Setup',
				name: 'autoWebhookSetup',
				type: 'boolean',
				default: false,
				displayOptions: { show: { '@version': [1] } },
				description:
					'Whether n8n should create the webhook in ImageKit when this workflow is activated and remove it on deactivation. Requires a restricted API key with webhook access. Turn off if you created the webhook yourself in the ImageKit dashboard; you then supply its signing secret via an ImageKit Webhook API credential.',
			},
			{
				displayName: 'Automatic Webhook Setup',
				name: 'autoWebhookSetup',
				type: 'boolean',
				default: true,
				displayOptions: { show: { '@version': [2] } },
				description:
					'Whether n8n should create the webhook in ImageKit when this workflow is activated and remove it on deactivation. Requires a restricted API key with webhook access. Turn off if you created the webhook yourself in the ImageKit dashboard; you then supply its signing secret via an ImageKit Webhook API credential.',
			},
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
					'folder.created',
					'folder.updated',
					'folder.deleted',
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
						name: 'Folder Created',
						value: 'folder.created',
					},
					{
						name: 'Folder Deleted',
						value: 'folder.deleted',
					},
					{
						name: 'Folder Updated',
						value: 'folder.updated',
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
					'Whether to validate the x-ik-signature header. The signing secret is fetched automatically when the webhook is registered on activation; an ImageKit Webhook API credential is only needed when "Automatic Webhook Setup" is off.',
			},
			{
				displayName:
					'Signature verification is disabled. Any caller who discovers this webhook URL can trigger this workflow with arbitrary payloads. Re-enable verification (and connect an ImageKit Webhook API credential) before going to production.',
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
				if (!isAutoWebhookSetup(this)) return true;
				try {
					const webhookUrl = this.getNodeWebhookUrl('default');
					const events = this.getNodeParameter('events') as string[];
					const staticData = this.getWorkflowStaticData('node');
					const webhooks = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'imagekitApi',
						{
							method: 'GET',
							baseURL: 'https://api.imagekit.io',
							url: '/v1/accounts/webhooks',
						},
					)) as IDataObject[];
					// Match by URL (not stored id) so manually-registered webhooks are
					// adopted, events are reconciled with the current parameter, and
					// re-activation still works if static data was lost.
					const existing = webhooks.find((w) => w.endpoint === webhookUrl);
					if (!existing) {
						delete staticData.webhookId;
						delete staticData.secret;
						return false;
					}
					const existingEvents = [...((existing.events as string[] | undefined) ?? [])].sort();
					const wantedEvents = [...events].sort();
					const eventsDiffer =
						existingEvents.length !== wantedEvents.length ||
						existingEvents.some((e, i) => e !== wantedEvents[i]);
					if (existing.enabled === false || eventsDiffer) {
						await this.helpers.httpRequestWithAuthentication.call(this, 'imagekitApi', {
							method: 'PATCH',
							baseURL: 'https://api.imagekit.io',
							url: `/v1/accounts/webhooks/${existing.id}`,
							body: { enabled: true, events },
						});
					}
					staticData.webhookId = existing.id;
					staticData.secret = existing.secret;
					return true;
				} catch (error) {
					if (isForbidden(error)) {
						throw new NodeOperationError(this.getNode(), WEBHOOK_PERMISSION_MESSAGE, {
							description:
								'Webhook registration needs the "Webhooks" permission on the ImageKit private key.',
						});
					}
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			},
			async create(this: IHookFunctions): Promise<boolean> {
				if (!isAutoWebhookSetup(this)) return true;
				try {
					const webhookUrl = this.getNodeWebhookUrl('default');
					const events = this.getNodeParameter('events') as string[];
					const staticData = this.getWorkflowStaticData('node');
					const webhook = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'imagekitApi',
						{
							method: 'POST',
							baseURL: 'https://api.imagekit.io',
							url: '/v1/accounts/webhooks',
							body: { endpoint: webhookUrl, events, enabled: true },
						},
					)) as IDataObject;
					staticData.webhookId = webhook.id;
					staticData.secret = webhook.secret;
					return true;
				} catch (error) {
					if (isForbidden(error)) {
						throw new NodeOperationError(this.getNode(), WEBHOOK_PERMISSION_MESSAGE, {
							description:
								'Webhook registration needs the "Webhooks" permission on the ImageKit private key.',
						});
					}
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				if (!isAutoWebhookSetup(this)) return true;
				const staticData = this.getWorkflowStaticData('node');
				const webhookId = staticData.webhookId as string | undefined;
				if (webhookId) {
					try {
						await this.helpers.httpRequestWithAuthentication.call(this, 'imagekitApi', {
							method: 'DELETE',
							baseURL: 'https://api.imagekit.io',
							url: `/v1/accounts/webhooks/${webhookId}`,
						});
					} catch (error) {
						// A failed delete (already removed in the dashboard, network
						// blip) must not block deactivation.
						this.logger.warn(
							`[ImagekitTrigger] Failed to delete ImageKit webhook ${webhookId}: ${(error as Error).message}`,
						);
					}
				}
				delete staticData.webhookId;
				delete staticData.secret;
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
			// Manual mode uses only the credential so a stale static-data secret can't
			// shadow it. getCredentials throws when the optional credential isn't set.
			const staticData = this.getWorkflowStaticData('node');
			const credentialSecret = async () =>
				(await this.getCredentials('imagekitWebhookApi').catch(() => undefined))?.secret as
					| string
					| undefined;
			const secret = isAutoWebhookSetup(this)
				? (staticData.secret as string | undefined) || (await credentialSecret())
				: await credentialSecret();
			if (!secret) {
				const res = this.getResponseObject();
				res.status(401).json({ error: 'invalid-signature', reason: 'no-secret' });
				return { noWebhookResponse: true };
			}
			// Re-stringifying the parsed body would change bytes and break the HMAC.
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

		// 200-ack unselected events so ImageKit doesn't retry.
		if (events.length > 0 && !events.includes(eventType)) {
			return { noWebhookResponse: false, workflowData: [] };
		}

		return { workflowData: [this.helpers.returnJsonArray([body])] };
	}

	/** Webhook signing secrets can't be validated remotely, so this only checks
	 *  the secret is usable as an HMAC-SHA256 key. */
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
