import { executeAccountUrlEndpoint } from '../../../nodes/Imagekit/resources/_generated/accountUrlEndpoint';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('executeAccountUrlEndpoint', () => {
	describe('create', () => {
		it('should call POST on /v1/accounts/url-endpoints with parsed endpoint data', async () => {
			const mockResponse = { endpointId: 'e1', url: 'https://ik.imagekit.io/demo' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'create',
					endpointData: '{"url":"https://ik.imagekit.io/demo"}',
				},
				httpResponse: mockResponse,
			});

			const result = await executeAccountUrlEndpoint.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'POST',
					baseURL: 'https://api.imagekit.io',
					url: '/v1/accounts/url-endpoints',
					body: { url: 'https://ik.imagekit.io/demo' },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('update', () => {
		it('should call PUT on /v1/accounts/url-endpoints/:endpointId', async () => {
			const mockResponse = { endpointId: 'e1' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'update',
					endpointId: 'e1',
					endpointData: '{"url":"https://new.example.com"}',
				},
				httpResponse: mockResponse,
			});

			const result = await executeAccountUrlEndpoint.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'PUT',
					url: '/v1/accounts/url-endpoints/e1',
					body: { url: 'https://new.example.com' },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('list', () => {
		it('should call GET on /v1/accounts/url-endpoints and return array', async () => {
			const mockResponse = [{ endpointId: 'e1' }, { endpointId: 'e2' }];
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'list' },
				httpResponse: mockResponse,
			});

			const result = await executeAccountUrlEndpoint.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					url: '/v1/accounts/url-endpoints',
				}),
			);
			expect(context.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponse);
			expect(result).toEqual([{ json: { endpointId: 'e1' } }, { json: { endpointId: 'e2' } }]);
		});
	});

	describe('get', () => {
		it('should call GET on /v1/accounts/url-endpoints/:endpointId', async () => {
			const mockResponse = { endpointId: 'e1' };
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'get', endpointId: 'e1' },
				httpResponse: mockResponse,
			});

			const result = await executeAccountUrlEndpoint.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					url: '/v1/accounts/url-endpoints/e1',
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('delete', () => {
		it('should call DELETE on /v1/accounts/url-endpoints/:endpointId', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'delete', endpointId: 'e1' },
			});

			const result = await executeAccountUrlEndpoint.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'DELETE',
					url: '/v1/accounts/url-endpoints/e1',
				}),
			);
			expect(result).toEqual([{ json: { success: true, endpointId: 'e1' } }]);
		});
	});

	describe('unsupported operation', () => {
		it('should throw for unsupported operations', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'invalid' },
			});

			await expect(executeAccountUrlEndpoint.call(context, 0)).rejects.toThrow(
				'Unsupported account URL endpoint operation: invalid',
			);
		});
	});
});
