import { executeCustomMetadataFields } from '../../../nodes/Imagekit/resources/_generated/customMetadataFields';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('executeCustomMetadataFields', () => {
	describe('create', () => {
		it('should call POST on /v1/customMetadataFields with name, label, and parsed schema', async () => {
			const mockResponse = { id: 'field1', name: 'brand', label: 'Brand' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'create',
					fieldName: 'brand',
					label: 'Brand',
					schema: '{"type":"Text"}',
				},
				httpResponse: mockResponse,
			});

			const result = await executeCustomMetadataFields.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'POST',
					baseURL: 'https://api.imagekit.io',
					url: '/v1/customMetadataFields',
					body: { name: 'brand', label: 'Brand', schema: { type: 'Text' } },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('update', () => {
		it('should call PATCH on /v1/customMetadataFields/:fieldId with parsed update body', async () => {
			const mockResponse = { id: 'field1', label: 'Updated Label' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'update',
					fieldId: 'field1',
					updateBody: '{"label":"Updated Label"}',
				},
				httpResponse: mockResponse,
			});

			const result = await executeCustomMetadataFields.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'PATCH',
					url: '/v1/customMetadataFields/field1',
					body: { label: 'Updated Label' },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('list', () => {
		it('should call GET on /v1/customMetadataFields without includeDeleted by default', async () => {
			const mockResponse = [{ id: 'f1' }, { id: 'f2' }];
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'list',
					includeDeleted: false,
				},
				httpResponse: mockResponse,
			});

			const result = await executeCustomMetadataFields.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					url: '/v1/customMetadataFields',
					qs: {},
				}),
			);
			expect(context.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponse);
			expect(result).toEqual([{ json: { id: 'f1' } }, { json: { id: 'f2' } }]);
		});

		it('should include includeDeleted in qs when set to true', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'list',
					includeDeleted: true,
				},
				httpResponse: [],
			});

			await executeCustomMetadataFields.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					qs: { includeDeleted: true },
				}),
			);
		});
	});

	describe('delete', () => {
		it('should call DELETE on /v1/customMetadataFields/:fieldId', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'delete',
					fieldId: 'field1',
				},
			});

			const result = await executeCustomMetadataFields.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'DELETE',
					url: '/v1/customMetadataFields/field1',
				}),
			);
			expect(result).toEqual([{ json: { success: true, fieldId: 'field1' } }]);
		});
	});

	describe('unsupported operation', () => {
		it('should throw for unsupported operations', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'invalid' },
			});

			await expect(executeCustomMetadataFields.call(context, 0)).rejects.toThrow(
				'Unsupported custom metadata field operation: invalid',
			);
		});
	});
});
