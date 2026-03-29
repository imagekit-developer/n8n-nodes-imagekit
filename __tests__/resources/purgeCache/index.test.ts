import { executePurgeCache } from '../../../nodes/Imagekit/resources/purgeCache/index';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('executePurgeCache', () => {
	describe('purge', () => {
		it('should call POST on /v1/files/purge with the URL', async () => {
			const mockResponse = { requestId: 'req123' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'purge',
					url: 'https://ik.imagekit.io/demo/test.jpg',
				},
				httpResponse: mockResponse,
			});

			const result = await executePurgeCache.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'POST',
					baseURL: 'https://api.imagekit.io',
					url: '/v1/files/purge',
					body: { url: 'https://ik.imagekit.io/demo/test.jpg' },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('getStatus', () => {
		it('should call GET on /v1/files/purge/:requestId', async () => {
			const mockResponse = { status: 'Complete' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'getStatus',
					requestId: 'req123',
				},
				httpResponse: mockResponse,
			});

			const result = await executePurgeCache.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					url: '/v1/files/purge/req123',
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

			await expect(executePurgeCache.call(context, 0)).rejects.toThrow(
				'Unsupported purge cache operation: invalid',
			);
		});
	});
});
