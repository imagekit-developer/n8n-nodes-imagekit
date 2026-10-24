import { executeNamedTransformation } from '../../../nodes/Imagekit/resources/_generated/namedTransformation';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('executeNamedTransformation', () => {
	describe('create', () => {
		it('should call POST on /v1/named-transformations with the typed body fields', async () => {
			const mockResponse = { id: 'nt1', name: 'small_thumbnail' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'create',
					name: 'small_thumbnail',
					transformation: 'w-150,h-150',
					enabled: true,
				},
				httpResponse: mockResponse,
			});

			const result = await executeNamedTransformation.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'POST',
					baseURL: 'https://api.imagekit.io',
					url: '/v1/named-transformations',
					body: { name: 'small_thumbnail', transformation: 'w-150,h-150', enabled: true },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('list', () => {
		it('should call GET on /v1/named-transformations and return array', async () => {
			const mockResponse = [{ id: 'nt1' }, { id: 'nt2' }];
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'list' },
				httpResponse: mockResponse,
			});

			const result = await executeNamedTransformation.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					url: '/v1/named-transformations',
				}),
			);
			expect(context.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponse);
			expect(result).toEqual([{ json: { id: 'nt1' } }, { json: { id: 'nt2' } }]);
		});
	});

	describe('get', () => {
		it('should call GET on /v1/named-transformations/:namedTransformationId', async () => {
			const mockResponse = { id: 'nt1', name: 'small_thumbnail' };
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'get', namedTransformationId: 'nt1' },
				httpResponse: mockResponse,
			});

			const result = await executeNamedTransformation.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					url: '/v1/named-transformations/nt1',
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('update', () => {
		it('should call PATCH on /v1/named-transformations/:namedTransformationId with parsed JSON body', async () => {
			const mockResponse = { id: 'nt1', enabled: false };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'update',
					namedTransformationId: 'nt1',
					namedTransformationData: '{"enabled":false}',
				},
				httpResponse: mockResponse,
			});

			const result = await executeNamedTransformation.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'PATCH',
					url: '/v1/named-transformations/nt1',
					body: { enabled: false },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('delete', () => {
		it('should call DELETE on /v1/named-transformations/:namedTransformationId', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'delete', namedTransformationId: 'nt1' },
			});

			const result = await executeNamedTransformation.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'DELETE',
					url: '/v1/named-transformations/nt1',
				}),
			);
			expect(result).toEqual([{ json: { success: true, namedTransformationId: 'nt1' } }]);
		});
	});

	describe('unsupported operation', () => {
		it('should throw for unsupported operations', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'invalid' },
			});

			await expect(executeNamedTransformation.call(context, 0)).rejects.toThrow(
				'Unsupported named transformation operation: invalid',
			);
		});
	});
});
