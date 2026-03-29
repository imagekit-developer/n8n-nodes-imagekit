import { uploadFile } from '../../../nodes/Imagekit/resources/file/upload';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('uploadFile', () => {
	it('should upload a file using binary data', async () => {
		const mockResponse = { fileId: 'new123', name: 'photo.png', url: 'https://ik.imagekit.io/photo.png' };
		const binaryBuffer = Buffer.from('binary-file-content');
		const context = createMockExecuteFunctions({
			nodeParameters: {
				fileName: 'photo.png',
				binaryPropertyName: 'data',
				fileUrl: '',
				uploadOptions: {},
			},
			httpResponse: mockResponse,
			binaryData: { data: { fileName: 'photo.png', mimeType: 'image/png' } },
			binaryDataBuffer: binaryBuffer,
		});

		const result = await uploadFile.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				method: 'POST',
				baseURL: 'https://upload.imagekit.io',
				url: '/api/v1/files/upload',
				body: expect.objectContaining({
					fileName: 'photo.png',
					file: binaryBuffer.toString('base64'),
				}),
			}),
		);
		expect(result).toEqual([{ json: mockResponse }]);
	});

	it('should upload a file using a URL when no binary data is provided', async () => {
		const mockResponse = { fileId: 'url123', name: 'remote.jpg' };
		const context = createMockExecuteFunctions({
			nodeParameters: {
				fileName: 'remote.jpg',
				binaryPropertyName: '',
				fileUrl: 'https://example.com/remote.jpg',
				uploadOptions: {},
			},
			httpResponse: mockResponse,
		});
		// Make assertBinaryData throw (no binary data)
		(context.helpers.assertBinaryData as jest.Mock).mockImplementation(() => {
			throw new Error('No binary data');
		});

		const result = await uploadFile.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				body: expect.objectContaining({
					fileName: 'remote.jpg',
					file: 'https://example.com/remote.jpg',
				}),
			}),
		);
		expect(result).toEqual([{ json: mockResponse }]);
	});

	it('should throw when neither binary data nor URL is provided', async () => {
		const context = createMockExecuteFunctions({
			nodeParameters: {
				fileName: 'test.jpg',
				binaryPropertyName: '',
				fileUrl: '',
				uploadOptions: {},
			},
		});
		(context.helpers.assertBinaryData as jest.Mock).mockImplementation(() => {
			throw new Error('No binary data');
		});

		await expect(uploadFile.call(context, 0)).rejects.toThrow(
			'Either binary data or a file URL must be provided for upload.',
		);
	});

	it('should pass upload options to the request body', async () => {
		const mockResponse = { fileId: 'opt123' };
		const context = createMockExecuteFunctions({
			nodeParameters: {
				fileName: 'test.jpg',
				binaryPropertyName: '',
				fileUrl: 'https://example.com/test.jpg',
				uploadOptions: {
					tags: 'tag1, tag2',
					folder: '/uploads',
					isPrivateFile: true,
					useUniqueFileName: false,
				},
			},
			httpResponse: mockResponse,
		});
		(context.helpers.assertBinaryData as jest.Mock).mockImplementation(() => {
			throw new Error('No binary data');
		});

		const result = await uploadFile.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				body: expect.objectContaining({
					tags: ['tag1', 'tag2'],
					folder: '/uploads',
					isPrivateFile: true,
					useUniqueFileName: false,
				}),
			}),
		);
		expect(result).toEqual([{ json: mockResponse }]);
	});
});
