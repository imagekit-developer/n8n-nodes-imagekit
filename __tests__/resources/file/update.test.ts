import { updateFile } from '../../../nodes/Imagekit/resources/file/update';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('updateFile', () => {
	it('should call PATCH with tags parsed from comma-separated string', async () => {
		const mockResponse = { fileId: 'f1', tags: ['tag1', 'tag2'] };
		const context = createMockExecuteFunctions({
			nodeParameters: {
				fileId: 'f1',
				updateFields: { tags: 'tag1, tag2' },
			},
			httpResponse: mockResponse,
		});

		const result = await updateFile.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				method: 'PATCH',
				baseURL: 'https://api.imagekit.io',
				url: '/v1/files/f1/details',
				body: expect.objectContaining({
					tags: ['tag1', 'tag2'],
				}),
			}),
		);
		expect(result).toEqual([{ json: mockResponse }]);
	});

	it('should include customCoordinates and webhookUrl when provided', async () => {
		const mockResponse = { fileId: 'f2' };
		const context = createMockExecuteFunctions({
			nodeParameters: {
				fileId: 'f2',
				updateFields: {
					customCoordinates: '10,20,100,200',
					webhookUrl: 'https://example.com/hook',
				},
			},
			httpResponse: mockResponse,
		});

		await updateFile.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				body: expect.objectContaining({
					customCoordinates: '10,20,100,200',
					webhookUrl: 'https://example.com/hook',
				}),
			}),
		);
	});

	it('should parse JSON customMetadata and extensions', async () => {
		const mockResponse = { fileId: 'f3' };
		const context = createMockExecuteFunctions({
			nodeParameters: {
				fileId: 'f3',
				updateFields: {
					customMetadata: '{"brand":"test"}',
					extensions: '[{"name":"google-auto-tagging","maxTags":5}]',
				},
			},
			httpResponse: mockResponse,
		});

		await updateFile.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				body: expect.objectContaining({
					customMetadata: { brand: 'test' },
					extensions: [{ name: 'google-auto-tagging', maxTags: 5 }],
				}),
			}),
		);
	});

	it('should send empty body when no update fields are provided', async () => {
		const mockResponse = { fileId: 'f4' };
		const context = createMockExecuteFunctions({
			nodeParameters: {
				fileId: 'f4',
				updateFields: {},
			},
			httpResponse: mockResponse,
		});

		await updateFile.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				body: {},
			}),
		);
	});
});
