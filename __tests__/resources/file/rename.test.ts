import { executeFile } from "../../../nodes/Imagekit/resources/_generated/file";
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('renameFile', () => {
	it('should call PUT on /v1/files/rename with correct body', async () => {
		const mockResponse = { purgeRequestId: 'purge123' };
		const context = createMockExecuteFunctions({
			nodeParameters: {
					operation: "rename",
				filePath: '/images/old-name.jpg',
				newFileName: 'new-name.jpg',
				purgeCache: true,
			},
			httpResponse: mockResponse,
		});

		const result = await executeFile.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				method: 'PUT',
				baseURL: 'https://api.imagekit.io',
				url: '/v1/files/rename',
				body: {
					filePath: '/images/old-name.jpg',
					newFileName: 'new-name.jpg',
					purgeCache: true,
				},
			}),
		);
		expect(result).toEqual([{ json: mockResponse }]);
	});

	it('should support purgeCache set to false', async () => {
		const context = createMockExecuteFunctions({
			nodeParameters: {
					operation: "rename",
				filePath: '/images/file.jpg',
				newFileName: 'renamed.jpg',
				purgeCache: false,
			},
			httpResponse: {},
		});

		await executeFile.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				body: expect.objectContaining({ purgeCache: false }),
			}),
		);
	});
});
