import { copyFile } from '../../../nodes/Imagekit/resources/file/copy';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('copyFile', () => {
	it('should call POST on /v1/files/copy with correct body', async () => {
		const mockResponse = { jobId: 'job123' };
		const context = createMockExecuteFunctions({
			nodeParameters: {
				sourceFilePath: '/images/photo.jpg',
				destinationPath: '/backup/',
				includeFileVersions: true,
			},
			httpResponse: mockResponse,
		});

		const result = await copyFile.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				method: 'POST',
				baseURL: 'https://api.imagekit.io',
				url: '/v1/files/copy',
				body: {
					sourceFilePath: '/images/photo.jpg',
					destinationPath: '/backup/',
					includeFileVersions: true,
				},
			}),
		);
		expect(result).toEqual([{ json: mockResponse }]);
	});
});
