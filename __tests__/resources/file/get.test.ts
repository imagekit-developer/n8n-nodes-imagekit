import { getFile } from '../../../nodes/Imagekit/resources/file/get';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('getFile', () => {
	it('should call the correct API endpoint with the file ID', async () => {
		const mockResponse = { fileId: 'abc123', name: 'test.png', url: 'https://ik.imagekit.io/test.png' };
		const context = createMockExecuteFunctions({
			nodeParameters: { fileId: 'abc123' },
			httpResponse: mockResponse,
		});

		const result = await getFile.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				method: 'GET',
				baseURL: 'https://api.imagekit.io',
				url: '/v1/files/abc123/details',
			}),
		);
		expect(result).toEqual([{ json: mockResponse }]);
	});

	it('should propagate API errors', async () => {
		const context = createMockExecuteFunctions({
			nodeParameters: { fileId: 'bad-id' },
		});
		(context.helpers.httpRequestWithAuthentication as jest.Mock).mockRejectedValue(
			new Error('File not found'),
		);

		await expect(getFile.call(context, 0)).rejects.toThrow('File not found');
	});
});
