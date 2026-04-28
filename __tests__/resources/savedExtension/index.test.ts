import { executeSavedExtension } from '../../../nodes/Imagekit/resources/_generated/savedExtension';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('executeSavedExtension', () => {
	describe('create', () => {
		it('should call POST on /v1/saved-extensions with parsed extension data', async () => {
			const mockResponse = { extensionId: 'ext1', name: 'auto-tagging' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'create',
					extensionData: '{"name":"auto-tagging","options":{"maxTags":5}}',
				},
				httpResponse: mockResponse,
			});

			const result = await executeSavedExtension.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'POST',
					baseURL: 'https://api.imagekit.io',
					url: '/v1/saved-extensions',
					body: { name: 'auto-tagging', options: { maxTags: 5 } },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('update', () => {
		it('should call PATCH on /v1/saved-extensions/:extensionId', async () => {
			const mockResponse = { extensionId: 'ext1' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'update',
					extensionId: 'ext1',
					extensionData: '{"options":{"maxTags":10}}',
				},
				httpResponse: mockResponse,
			});

			const result = await executeSavedExtension.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'PATCH',
					url: '/v1/saved-extensions/ext1',
					body: { options: { maxTags: 10 } },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('list', () => {
		it('should call GET on /v1/saved-extensions and return array', async () => {
			const mockResponse = [{ extensionId: 'ext1' }, { extensionId: 'ext2' }];
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'list' },
				httpResponse: mockResponse,
			});

			const result = await executeSavedExtension.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					url: '/v1/saved-extensions',
				}),
			);
			expect(context.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponse);
			expect(result).toEqual([{ json: { extensionId: 'ext1' } }, { json: { extensionId: 'ext2' } }]);
		});

		it('should return single json when response is not an array', async () => {
			const mockResponse = { extensionId: 'ext1' };
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'list' },
				httpResponse: mockResponse,
			});

			const result = await executeSavedExtension.call(context, 0);

			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('get', () => {
		it('should call GET on /v1/saved-extensions/:extensionId', async () => {
			const mockResponse = { extensionId: 'ext1', name: 'auto-tagging' };
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'get', extensionId: 'ext1' },
				httpResponse: mockResponse,
			});

			const result = await executeSavedExtension.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					url: '/v1/saved-extensions/ext1',
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('delete', () => {
		it('should call DELETE on /v1/saved-extensions/:extensionId', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'delete', extensionId: 'ext1' },
			});

			const result = await executeSavedExtension.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'DELETE',
					url: '/v1/saved-extensions/ext1',
				}),
			);
			expect(result).toEqual([{ json: { success: true, extensionId: 'ext1' } }]);
		});
	});

	describe('unsupported operation', () => {
		it('should throw for unsupported operations', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'invalid' },
			});

			await expect(executeSavedExtension.call(context, 0)).rejects.toThrow(
				'Unsupported saved extension operation: invalid',
			);
		});
	});
});
