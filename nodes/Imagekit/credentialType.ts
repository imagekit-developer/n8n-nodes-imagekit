import type { IExecuteFunctions, IHookFunctions } from 'n8n-workflow';

export type ImagekitCredentialType = 'imagekitApi' | 'imagekitOAuth2Api';

export function getCredentialType(this: IExecuteFunctions, i: number): ImagekitCredentialType {
	return this.getNodeParameter('authentication', i, 'apiKey') === 'oAuth2'
		? 'imagekitOAuth2Api'
		: 'imagekitApi';
}

export function getHookCredentialType(ctx: IHookFunctions): ImagekitCredentialType {
	return ctx.getNodeParameter('authentication', 'apiKey') === 'oAuth2'
		? 'imagekitOAuth2Api'
		: 'imagekitApi';
}
