import { NodeOperationError } from 'n8n-workflow';
import { ImagekitTrigger } from '../../nodes/Imagekit/ImagekitTrigger.node';
import { createMockHookFunctions } from '../helpers/mockHookFunctions';

const URL = 'https://n8n.example/webhook/abc/imagekit-webhook';
const hooks = () => new ImagekitTrigger().webhookMethods!.default;

describe('ImagekitTrigger webhookMethods', () => {
	describe('checkExists', () => {
		it('adopts a webhook whose endpoint matches the n8n URL', async () => {
			const { context, staticData, http } = createMockHookFunctions({
				apiResponses: [
					[
						{ id: 'other', endpoint: 'https://x', secret: 's0', enabled: true },
						{ id: 'wh_1', endpoint: URL, secret: 'whsec_1', enabled: true },
					],
				],
			});

			const result = await hooks().checkExists.call(context);

			expect(result).toBe(true);
			expect(staticData).toEqual({ webhookId: 'wh_1', secret: 'whsec_1' });
			expect(http).toHaveBeenCalledTimes(1);
			expect(http).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({ method: 'GET', url: '/v1/accounts/webhooks' }),
			);
		});

		it('returns false and clears stale static data when no endpoint matches', async () => {
			const { context, staticData } = createMockHookFunctions({
				staticData: { webhookId: 'old', secret: 'old' },
				apiResponses: [[]],
			});

			const result = await hooks().checkExists.call(context);

			expect(result).toBe(false);
			expect(staticData).toEqual({});
		});

		it('turns a 403 into a NodeOperationError pointing to manual mode', async () => {
			const { context } = createMockHookFunctions({
				apiResponses: [Object.assign(new Error('Forbidden'), { httpCode: '403' })],
			});

			const call = hooks().checkExists.call(context);
			await expect(call).rejects.toThrow(/Automatic Webhook Setup/);
			await expect(call).rejects.toBeInstanceOf(NodeOperationError);
		});

		it('rethrows non-403 errors unchanged', async () => {
			const { context } = createMockHookFunctions({
				apiResponses: [Object.assign(new Error('boom'), { httpCode: '500' })],
			});

			await expect(hooks().checkExists.call(context)).rejects.toThrow('boom');
		});

		it('re-enables a disabled matching webhook', async () => {
			const { context, staticData, http } = createMockHookFunctions({
				apiResponses: [[{ id: 'wh_1', endpoint: URL, secret: 'whsec_1', enabled: false }], {}],
			});

			const result = await hooks().checkExists.call(context);

			expect(result).toBe(true);
			expect(staticData).toEqual({ webhookId: 'wh_1', secret: 'whsec_1' });
			expect(http).toHaveBeenCalledTimes(2);
			expect(http).toHaveBeenNthCalledWith(
				2,
				'imagekitApi',
				expect.objectContaining({
					method: 'PATCH',
					url: '/v1/accounts/webhooks/wh_1',
					body: { enabled: true },
				}),
			);
		});
	});

	describe('create', () => {
		it('POSTs the n8n URL and selected events and stores id + secret', async () => {
			const { context, staticData, http } = createMockHookFunctions({
				nodeParameters: { events: ['file.created', 'folder.deleted'] },
				apiResponses: [{ id: 'wh_2', secret: 'whsec_2' }],
			});

			const result = await hooks().create.call(context);

			expect(result).toBe(true);
			expect(http).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'POST',
					url: '/v1/accounts/webhooks',
					body: { endpoint: URL, events: ['file.created', 'folder.deleted'], enabled: true },
				}),
			);
			expect(staticData).toEqual({ webhookId: 'wh_2', secret: 'whsec_2' });
		});

		it('turns a 403 into a NodeOperationError pointing to manual mode', async () => {
			const { context } = createMockHookFunctions({
				nodeParameters: { events: ['file.created'] },
				apiResponses: [Object.assign(new Error('Forbidden'), { httpCode: '403' })],
			});

			const call = hooks().create.call(context);
			await expect(call).rejects.toThrow(/Automatic Webhook Setup/);
			await expect(call).rejects.toBeInstanceOf(NodeOperationError);
		});
	});

	describe('delete', () => {
		it('DELETEs the stored id and clears static data', async () => {
			const { context, staticData, http } = createMockHookFunctions({
				staticData: { webhookId: 'wh_2', secret: 'whsec_2' },
				apiResponses: [undefined],
			});

			const result = await hooks().delete.call(context);

			expect(result).toBe(true);
			expect(http).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({ method: 'DELETE', url: '/v1/accounts/webhooks/wh_2' }),
			);
			expect(staticData).toEqual({});
		});

		it('is a no-op without a stored id', async () => {
			const { context, http } = createMockHookFunctions();

			const result = await hooks().delete.call(context);

			expect(result).toBe(true);
			expect(http).not.toHaveBeenCalled();
		});

		it('still clears static data when the API call fails', async () => {
			const { context, staticData } = createMockHookFunctions({
				staticData: { webhookId: 'wh_2', secret: 'whsec_2' },
				apiResponses: [new Error('404')],
			});

			const result = await hooks().delete.call(context);

			expect(result).toBe(true);
			expect(staticData).toEqual({});
			expect(context.logger.warn).toHaveBeenCalledTimes(1);
		});
	});

	describe('manual mode', () => {
		const manualOptions = {
			nodeParameters: { autoWebhookSetup: false },
			staticData: { webhookId: 'wh_1', secret: 's' },
		};

		it('checkExists returns true without calling the API or touching static data', async () => {
			const { context, staticData, http } = createMockHookFunctions(manualOptions);

			const result = await hooks().checkExists.call(context);

			expect(result).toBe(true);
			expect(http).not.toHaveBeenCalled();
			expect(staticData).toEqual({ webhookId: 'wh_1', secret: 's' });
		});

		it('create returns true without calling the API', async () => {
			const { context, http } = createMockHookFunctions(manualOptions);

			const result = await hooks().create.call(context);

			expect(result).toBe(true);
			expect(http).not.toHaveBeenCalled();
		});

		it('delete returns true without calling the API', async () => {
			const { context, http } = createMockHookFunctions(manualOptions);

			const result = await hooks().delete.call(context);

			expect(result).toBe(true);
			expect(http).not.toHaveBeenCalled();
		});

		it('a typeVersion 1 node with no autoWebhookSetup parameter takes the manual path', async () => {
			const { context, http } = createMockHookFunctions({
				typeVersion: 1,
				apiResponses: [[]],
			});

			const result = await hooks().checkExists.call(context);

			expect(result).toBe(true);
			expect(http).not.toHaveBeenCalled();
		});

		it('a typeVersion 1 node that opted in to auto setup uses auto-registration', async () => {
			const { context, http } = createMockHookFunctions({
				typeVersion: 1,
				nodeParameters: { autoWebhookSetup: true },
				apiResponses: [[]],
			});

			const result = await hooks().checkExists.call(context);

			expect(result).toBe(false);
			expect(http).toHaveBeenCalledTimes(1);
		});
	});
});
