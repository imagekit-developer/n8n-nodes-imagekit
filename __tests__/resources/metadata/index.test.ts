import { executeMetadata } from '../../../nodes/Imagekit/resources/metadata/index';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('executeMetadata', () => {
	describe('getByFileId', () => {
		it('should call GET on /v1/files/:fileId/metadata', async () => {
			const mockResponse = { height: 100, width: 200, format: 'png' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'getByFileId',
					fileId: 'file123',
				},
				httpResponse: mockResponse,
			});

			const result = await executeMetadata.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					baseURL: 'https://api.imagekit.io',
					url: '/v1/files/file123/metadata',
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('getFromUrl', () => {
		it('should call GET on /v1/metadata with url query parameter', async () => {
			const mockResponse = { height: 300, width: 400 };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'getFromUrl',
					url: 'https://ik.imagekit.io/demo/test.jpg',
				},
				httpResponse: mockResponse,
			});

			const result = await executeMetadata.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					url: '/v1/metadata',
					qs: { url: 'https://ik.imagekit.io/demo/test.jpg' },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('unsupported operation', () => {
		it('should throw for unsupported operations', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'invalid' },
			});

			await expect(executeMetadata.call(context, 0)).rejects.toThrow(
				'Unsupported metadata operation: invalid',
			);
		});
	});
});
