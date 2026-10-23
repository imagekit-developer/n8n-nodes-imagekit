import { Imagekit } from '../../nodes/Imagekit/Imagekit.node';

describe('Imagekit description', () => {
	const description = new Imagekit().description;

	it('offers API Key and OAuth2 credentials gated on the authentication parameter', () => {
		const imagekitApi = description.credentials?.find((c) => c.name === 'imagekitApi');
		expect(imagekitApi?.required).toBe(true);
		expect(imagekitApi?.displayOptions?.show?.authentication).toEqual(['apiKey']);

		const imagekitOAuth2Api = description.credentials?.find(
			(c) => c.name === 'imagekitOAuth2Api',
		);
		expect(imagekitOAuth2Api?.required).toBe(true);
		expect(imagekitOAuth2Api?.displayOptions?.show?.authentication).toEqual(['oAuth2']);
	});

	it('has authentication as the first property, defaulting to apiKey', () => {
		const first = description.properties[0];
		expect(first.name).toBe('authentication');
		expect(first.default).toBe('apiKey');
	});
});
