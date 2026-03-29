import { moveFile } from '../../../nodes/Imagekit/resources/file/move';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('moveFile', () => {
	it('should call POST on /v1/files/move with correct body', async () => {
		const mockResponse = { jobId: 'move-job-1' };
		const context = createMockExecuteFunctions({
			nodeParameters: {
				sourceFilePath: '/images/old.jpg',
				destinationPath: '/archive/',
			},
			httpResponse: mockResponse,
		});

		const result = await moveFile.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				method: 'POST',
				baseURL: 'https://api.imagekit.io',
				url: '/v1/files/move',
				body: {
					sourceFilePath: '/images/old.jpg',
					destinationPath: '/archive/',
				},
			}),
		);
		expect(result).toEqual([{ json: mockResponse }]);
	});
});
