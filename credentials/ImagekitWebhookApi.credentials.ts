import type { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

/**
 * Holds the shared signing secret used by the generated trigger nodes to
 * verify the `x-ik-signature` header on incoming webhook deliveries.
 *
 * This is intentionally separate from `ImagekitApi` (the private/public-key
 * credential used for outbound REST calls): webhook secrets are issued
 * per-endpoint in the ImageKit dashboard and live a different lifecycle.
 */
export class ImagekitWebhookApi implements ICredentialType {
	name = 'imagekitWebhookApi';

	displayName = 'ImageKit Webhook API';

	icon = {
		light: 'file:../nodes/Imagekit/imagekit.light.svg',
		dark: 'file:../nodes/Imagekit/imagekit.dark.svg',
	} satisfies Icon;

	documentationUrl = 'https://imagekit.io/docs/webhooks';

	properties: INodeProperties[] = [
		{
			displayName: 'Webhook Secret',
			name: 'secret',
			type: 'string',
			default: '',
			required: true,
			typeOptions: {
				password: true,
			},
			description:
				'The signing secret shown when you create a webhook endpoint in the ImageKit dashboard. Starts with "whsec_". Used to verify the x-ik-signature header on every delivery.',
		},
	];
}
