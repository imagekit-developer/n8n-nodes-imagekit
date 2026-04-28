import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ImagekitApi implements ICredentialType {
	name = 'imagekitApi';

	displayName = 'ImageKit API';

	icon = {
		light: 'file:../nodes/Imagekit/imagekit.light.svg',
		dark: 'file:../nodes/Imagekit/imagekit.dark.svg',
	} satisfies Icon;

	documentationUrl = 'https://github.com/ahnv/n8n-nodes-imagekit/#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			default: '',
			required: true,
			typeOptions: {
				password: true,
			},
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{$credentials.privateKey}}',
				password: '',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.imagekit.io',
			url: '/v1/files',
		},
	};
}
