import type { Icon, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class ImagekitOAuth2Api implements ICredentialType {
	name = 'imagekitOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'ImageKit OAuth2 API';

	icon = {
		light: 'file:../nodes/Imagekit/imagekit.light.svg',
		dark: 'file:../nodes/Imagekit/imagekit.dark.svg',
	} satisfies Icon;

	documentationUrl = 'https://imagekit.io/docs/api-keys';

	properties: INodeProperties[] = [
		{
			displayName: 'Use Dynamic Client Registration',
			name: 'useDynamicClientRegistration',
			type: 'hidden',
			default: true,
		},
		{
			displayName: 'Server URL',
			name: 'serverUrl',
			type: 'hidden',
			default: 'https://imagekit.io',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.imagekit.io',
			url: '/v1/files',
			qs: { limit: 1 },
		},
	};
}
