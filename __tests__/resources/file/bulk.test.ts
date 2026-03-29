import {
	bulkDeleteFiles,
	bulkAddTags,
	bulkRemoveTags,
	bulkRemoveAITags,
} from '../../../nodes/Imagekit/resources/file/bulk';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('bulkDeleteFiles', () => {
	it('should call POST on /v1/files/batch/deleteByFileIds with parsed file IDs', async () => {
		const mockResponse = { successfullyDeletedFileIds: ['id1', 'id2'] };
		const context = createMockExecuteFunctions({
			nodeParameters: { fileIds: 'id1, id2, id3' },
			httpResponse: mockResponse,
		});

		const result = await bulkDeleteFiles.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				method: 'POST',
				baseURL: 'https://api.imagekit.io',
				url: '/v1/files/batch/deleteByFileIds',
				body: { fileIds: ['id1', 'id2', 'id3'] },
			}),
		);
		expect(result).toEqual([{ json: mockResponse }]);
	});
});

describe('bulkAddTags', () => {
	it('should call POST on /v1/files/addTags with parsed IDs and tags', async () => {
		const mockResponse = { successfullyUpdatedFileIds: ['id1'] };
		const context = createMockExecuteFunctions({
			nodeParameters: {
				fileIds: 'id1, id2',
				tags: 'nature, landscape',
			},
			httpResponse: mockResponse,
		});

		const result = await bulkAddTags.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				method: 'POST',
				url: '/v1/files/addTags',
				body: {
					fileIds: ['id1', 'id2'],
					tags: ['nature', 'landscape'],
				},
			}),
		);
		expect(result).toEqual([{ json: mockResponse }]);
	});
});

describe('bulkRemoveTags', () => {
	it('should call POST on /v1/files/removeTags', async () => {
		const mockResponse = { successfullyUpdatedFileIds: ['id1'] };
		const context = createMockExecuteFunctions({
			nodeParameters: {
				fileIds: 'id1',
				tags: 'old-tag',
			},
			httpResponse: mockResponse,
		});

		const result = await bulkRemoveTags.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				method: 'POST',
				url: '/v1/files/removeTags',
				body: {
					fileIds: ['id1'],
					tags: ['old-tag'],
				},
			}),
		);
		expect(result).toEqual([{ json: mockResponse }]);
	});
});

describe('bulkRemoveAITags', () => {
	it('should call POST on /v1/files/removeAITags', async () => {
		const mockResponse = { successfullyUpdatedFileIds: ['id1', 'id2'] };
		const context = createMockExecuteFunctions({
			nodeParameters: {
				fileIds: 'id1, id2',
				tags: 'ai-tag1, ai-tag2',
			},
			httpResponse: mockResponse,
		});

		const result = await bulkRemoveAITags.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				method: 'POST',
				url: '/v1/files/removeAITags',
				body: {
					fileIds: ['id1', 'id2'],
					tags: ['ai-tag1', 'ai-tag2'],
				},
			}),
		);
		expect(result).toEqual([{ json: mockResponse }]);
	});
});
