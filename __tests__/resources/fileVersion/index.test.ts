import { executeFileVersion } from '../../../nodes/Imagekit/resources/fileVersion/index';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('executeFileVersion', () => {
	describe('list', () => {
		it('should call GET on /v1/files/:fileId/versions', async () => {
			const mockResponse = [{ versionId: 'v1' }, { versionId: 'v2' }];
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'list', fileId: 'file123' },
				httpResponse: mockResponse,
			});

			const result = await executeFileVersion.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					url: '/v1/files/file123/versions',
				}),
			);
			expect(context.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponse);
			expect(result).toEqual([{ json: { versionId: 'v1' } }, { json: { versionId: 'v2' } }]);
		});

		it('should return single json when response is not an array', async () => {
			const mockResponse = { versionId: 'v1' };
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'list', fileId: 'file123' },
				httpResponse: mockResponse,
			});

			const result = await executeFileVersion.call(context, 0);

			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('get', () => {
		it('should call GET on /v1/files/:fileId/versions/:versionId', async () => {
			const mockResponse = { versionId: 'v1', name: 'test.png' };
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'get', fileId: 'file123', versionId: 'v1' },
				httpResponse: mockResponse,
			});

			const result = await executeFileVersion.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					url: '/v1/files/file123/versions/v1',
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('delete', () => {
		it('should call DELETE on /v1/files/:fileId/versions/:versionId', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'delete', fileId: 'file123', versionId: 'v1' },
			});

			const result = await executeFileVersion.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'DELETE',
					url: '/v1/files/file123/versions/v1',
				}),
			);
			expect(result).toEqual([{ json: { success: true, fileId: 'file123', versionId: 'v1' } }]);
		});
	});

	describe('restore', () => {
		it('should call PUT on /v1/files/:fileId/versions/:versionId/restore', async () => {
			const mockResponse = { fileId: 'file123', versionId: 'v1' };
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'restore', fileId: 'file123', versionId: 'v1' },
				httpResponse: mockResponse,
			});

			const result = await executeFileVersion.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'PUT',
					url: '/v1/files/file123/versions/v1/restore',
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('unsupported operation', () => {
		it('should throw for unsupported operations', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'invalid', fileId: 'file123' },
			});

			await expect(executeFileVersion.call(context, 0)).rejects.toThrow(
				'Unsupported file version operation: invalid',
			);
		});
	});
});
