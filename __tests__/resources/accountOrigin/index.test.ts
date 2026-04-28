import { executeAccountOrigin } from '../../../nodes/Imagekit/resources/_generated/accountOrigin';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('executeAccountOrigin', () => {
	describe('create', () => {
		it('should call POST on /v1/accounts/origins with parsed origin data', async () => {
			const mockResponse = { originId: 'o1', type: 'web' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'create',
					originData: '{"type":"web","origin":"https://example.com"}',
				},
				httpResponse: mockResponse,
			});

			const result = await executeAccountOrigin.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'POST',
					baseURL: 'https://api.imagekit.io',
					url: '/v1/accounts/origins',
					body: { type: 'web', origin: 'https://example.com' },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('update', () => {
		it('should call PUT on /v1/accounts/origins/:originId', async () => {
			const mockResponse = { originId: 'o1', type: 'web' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'update',
					originId: 'o1',
					originData: '{"origin":"https://new.example.com"}',
				},
				httpResponse: mockResponse,
			});

			const result = await executeAccountOrigin.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'PUT',
					url: '/v1/accounts/origins/o1',
					body: { origin: 'https://new.example.com' },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('list', () => {
		it('should call GET on /v1/accounts/origins and return array', async () => {
			const mockResponse = [{ originId: 'o1' }, { originId: 'o2' }];
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'list' },
				httpResponse: mockResponse,
			});

			const result = await executeAccountOrigin.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					url: '/v1/accounts/origins',
				}),
			);
			expect(context.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponse);
			expect(result).toEqual([{ json: { originId: 'o1' } }, { json: { originId: 'o2' } }]);
		});

		it('should return single json when response is not an array', async () => {
			const mockResponse = { originId: 'o1' };
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'list' },
				httpResponse: mockResponse,
			});

			const result = await executeAccountOrigin.call(context, 0);

			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('get', () => {
		it('should call GET on /v1/accounts/origins/:originId', async () => {
			const mockResponse = { originId: 'o1', type: 'web' };
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'get', originId: 'o1' },
				httpResponse: mockResponse,
			});

			const result = await executeAccountOrigin.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					url: '/v1/accounts/origins/o1',
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('delete', () => {
		it('should call DELETE on /v1/accounts/origins/:originId', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'delete', originId: 'o1' },
			});

			const result = await executeAccountOrigin.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'DELETE',
					url: '/v1/accounts/origins/o1',
				}),
			);
			expect(result).toEqual([{ json: { success: true, originId: 'o1' } }]);
		});
	});

	describe('unsupported operation', () => {
		it('should throw for unsupported operations', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'invalid' },
			});

			await expect(executeAccountOrigin.call(context, 0)).rejects.toThrow(
				'Unsupported account origin operation: invalid',
			);
		});
	});
});
