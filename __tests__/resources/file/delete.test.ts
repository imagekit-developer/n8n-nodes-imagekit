import { executeFile } from "../../../nodes/Imagekit/resources/_generated/file";
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('deleteFile', () => {
	it('should call DELETE on the correct endpoint', async () => {
		const context = createMockExecuteFunctions({
			nodeParameters: { operation: "delete", fileId: 'file123' },
		});

		const result = await executeFile.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				method: 'DELETE',
				baseURL: 'https://api.imagekit.io',
				url: '/v1/files/file123',
			}),
		);
		expect(result).toEqual([{ json: { success: true, fileId: 'file123' } }]);
	});
});
