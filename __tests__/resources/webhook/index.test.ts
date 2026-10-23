import { executeWebhook } from '../../../nodes/Imagekit/resources/_generated/webhook';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('executeWebhook', () => {
	describe('create', () => {
		it('should call POST on /v1/accounts/webhooks splitting the events CSV into an array', async () => {
			const mockResponse = { id: 'wh1', endpoint: 'https://example.com/hook' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'create',
					endpoint: 'https://example.com/hook',
					events: 'file.created, video.transformation.ready',
					enabled: true,
				},
				httpResponse: mockResponse,
			});

			const result = await executeWebhook.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'POST',
					baseURL: 'https://api.imagekit.io',
					url: '/v1/accounts/webhooks',
					body: {
						endpoint: 'https://example.com/hook',
						events: ['file.created', 'video.transformation.ready'],
						enabled: true,
					},
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('list', () => {
		it('should call GET on /v1/accounts/webhooks and return array', async () => {
			const mockResponse = [{ id: 'wh1' }, { id: 'wh2' }];
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'list' },
				httpResponse: mockResponse,
			});

			const result = await executeWebhook.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					url: '/v1/accounts/webhooks',
				}),
			);
			expect(context.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponse);
			expect(result).toEqual([{ json: { id: 'wh1' } }, { json: { id: 'wh2' } }]);
		});
	});

	describe('get', () => {
		it('should call GET on /v1/accounts/webhooks/:webhookId', async () => {
			const mockResponse = { id: 'wh1', endpoint: 'https://example.com/hook' };
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'get', webhookId: 'wh1' },
				httpResponse: mockResponse,
			});

			const result = await executeWebhook.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					url: '/v1/accounts/webhooks/wh1',
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('update', () => {
		it('should call PATCH on /v1/accounts/webhooks/:webhookId with parsed JSON body', async () => {
			const mockResponse = { id: 'wh1', enabled: false };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'update',
					webhookId: 'wh1',
					webhookData: '{"enabled":false}',
				},
				httpResponse: mockResponse,
			});

			const result = await executeWebhook.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'PATCH',
					url: '/v1/accounts/webhooks/wh1',
					body: { enabled: false },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('delete', () => {
		it('should call DELETE on /v1/accounts/webhooks/:webhookId', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'delete', webhookId: 'wh1' },
			});

			const result = await executeWebhook.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'DELETE',
					url: '/v1/accounts/webhooks/wh1',
				}),
			);
			expect(result).toEqual([{ json: { success: true, webhookId: 'wh1' } }]);
		});
	});

	describe('unsupported operation', () => {
		it('should throw for unsupported operations', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'invalid' },
			});

			await expect(executeWebhook.call(context, 0)).rejects.toThrow(
				'Unsupported webhook operation: invalid',
			);
		});
	});
});
