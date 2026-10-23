import { ImagekitTrigger } from '../../nodes/Imagekit/ImagekitTrigger.node';

describe('ImagekitTrigger description', () => {
	const description = new ImagekitTrigger().description;

	it('is versioned [1, 2] with defaultVersion 2', () => {
		expect(description.version).toEqual([1, 2]);
		expect(description.defaultVersion).toBe(2);
	});

	it('defaults autoWebhookSetup to false on v1 and true on v2', () => {
		const autoWebhookSetupProps = description.properties.filter(
			(p) => p.name === 'autoWebhookSetup',
		);
		expect(autoWebhookSetupProps).toHaveLength(2);
		const v1 = autoWebhookSetupProps.find(
			(p) => p.displayOptions?.show?.['@version']?.includes(1),
		);
		const v2 = autoWebhookSetupProps.find(
			(p) => p.displayOptions?.show?.['@version']?.includes(2),
		);
		expect(v1?.default).toBe(false);
		expect(v2?.default).toBe(true);
	});

	it('only requires the ImageKit API credential when autoWebhookSetup is on', () => {
		const imagekitApi = description.credentials?.find((c) => c.name === 'imagekitApi');
		expect(imagekitApi?.required).toBe(true);
		expect(imagekitApi?.displayOptions?.show?.autoWebhookSetup).toEqual([true]);
	});
});
