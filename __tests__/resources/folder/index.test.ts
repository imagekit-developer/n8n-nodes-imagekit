import { executeFolder } from '../../../nodes/Imagekit/resources/folder/index';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('executeFolder', () => {
	describe('create', () => {
		it('should call POST on /v1/folder with folderName and parentFolderPath', async () => {
			const mockResponse = { success: true };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'create',
					folderName: 'new-folder',
					parentFolderPath: '/images',
				},
				httpResponse: mockResponse,
			});

			const result = await executeFolder.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'POST',
					baseURL: 'https://api.imagekit.io',
					url: '/v1/folder',
					body: { folderName: 'new-folder', parentFolderPath: '/images' },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('delete', () => {
		it('should call DELETE on /v1/folder with folderPath', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'delete',
					folderPath: '/images/old-folder',
				},
			});

			const result = await executeFolder.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'DELETE',
					url: '/v1/folder',
					body: { folderPath: '/images/old-folder' },
				}),
			);
			expect(result).toEqual([{ json: { success: true, folderPath: '/images/old-folder' } }]);
		});
	});

	describe('copy', () => {
		it('should call POST on /v1/bulkJobs/copyFolder', async () => {
			const mockResponse = { jobId: 'copy-job-1' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'copy',
					sourceFolderPath: '/images/src',
					destinationPath: '/backup',
				},
				httpResponse: mockResponse,
			});

			const result = await executeFolder.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'POST',
					url: '/v1/bulkJobs/copyFolder',
					body: { sourceFolderPath: '/images/src', destinationPath: '/backup' },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('move', () => {
		it('should call POST on /v1/bulkJobs/moveFolder', async () => {
			const mockResponse = { jobId: 'move-job-1' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'move',
					sourceFolderPath: '/images/old',
					destinationPath: '/archive',
				},
				httpResponse: mockResponse,
			});

			const result = await executeFolder.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'POST',
					url: '/v1/bulkJobs/moveFolder',
					body: { sourceFolderPath: '/images/old', destinationPath: '/archive' },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('rename', () => {
		it('should call POST on /v1/bulkJobs/renameFolder', async () => {
			const mockResponse = { jobId: 'rename-job-1' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'rename',
					sourceFolderPath: '/images/old-name',
					newFolderName: 'new-name',
					purgeCache: true,
				},
				httpResponse: mockResponse,
			});

			const result = await executeFolder.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'POST',
					url: '/v1/bulkJobs/renameFolder',
					body: { sourceFolderPath: '/images/old-name', newFolderName: 'new-name', purgeCache: true },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('getJobStatus', () => {
		it('should call GET on /v1/bulkJobs/:jobId', async () => {
			const mockResponse = { jobId: 'job123', status: 'Completed' };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'getJobStatus',
					jobId: 'job123',
				},
				httpResponse: mockResponse,
			});

			const result = await executeFolder.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					url: '/v1/bulkJobs/job123',
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

			await expect(executeFolder.call(context, 0)).rejects.toThrow(
				'Unsupported folder operation: invalid',
			);
		});
	});
});
