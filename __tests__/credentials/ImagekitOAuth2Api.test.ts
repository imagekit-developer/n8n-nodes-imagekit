import { ImagekitOAuth2Api } from '../../credentials/ImagekitOAuth2Api.credentials';

describe('ImagekitOAuth2Api credential', () => {
	const credential = new ImagekitOAuth2Api();

	it('is named imagekitOAuth2Api and extends oAuth2Api', () => {
		expect(credential.name).toBe('imagekitOAuth2Api');
		expect(credential.extends).toEqual(['oAuth2Api']);
	});

	it('enables Dynamic Client Registration against imagekit.io', () => {
		const dcr = credential.properties.find((p) => p.name === 'useDynamicClientRegistration');
		expect(dcr?.type).toBe('hidden');
		expect(dcr?.default).toBe(true);

		const serverUrl = credential.properties.find((p) => p.name === 'serverUrl');
		expect(serverUrl?.type).toBe('hidden');
		expect(serverUrl?.default).toBe('https://imagekit.io');
	});

	it('does not declare a scope property', () => {
		expect(credential.properties.some((p) => p.name === 'scope')).toBe(false);
	});
});
