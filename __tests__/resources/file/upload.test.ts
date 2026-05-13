import { uploadFile } from '../../../nodes/Imagekit/resources/file/upload';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

function getCallArgs(context: ReturnType<typeof createMockExecuteFunctions>) {
	return (context.helpers.httpRequestWithAuthentication as jest.Mock).mock.calls[0][1];
}

async function formEntries(form: FormData): Promise<Record<string, string | File>> {
	const out: Record<string, string | File> = {};
	form.forEach((value, key) => {
		out[key] = value as string | File;
	});
	return out;
}

describe('uploadFile', () => {
	it('should upload a file using binary data as multipart/form-data', async () => {
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

		const args = getCallArgs(context);
		expect(args.method).toBe('POST');
		expect(args.baseURL).toBe('https://upload.imagekit.io');
		expect(args.url).toBe('/api/v1/files/upload');
		expect(args.body).toBeInstanceOf(FormData);

		const entries = await formEntries(args.body as FormData);
		expect(entries.fileName).toBe('photo.png');
		expect(entries.file).toBeInstanceOf(Blob);
		const fileBlob = entries.file as File;
		expect(fileBlob.name).toBe('photo.png');
		expect(fileBlob.type).toBe('image/png');
		expect(await fileBlob.text()).toBe('binary-file-content');
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

		const result = await uploadFile.call(context, 0);

		const args = getCallArgs(context);
		expect(args.body).toBeInstanceOf(FormData);
		const entries = await formEntries(args.body as FormData);
		expect(entries.file).toBe('https://example.com/remote.jpg');
		expect(entries.fileName).toBe('remote.jpg');
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

		await expect(uploadFile.call(context, 0)).rejects.toThrow(
			'Either binary data or a file URL must be provided for upload.',
		);
	});

	it('should pass upload options as multipart form fields', async () => {
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
					responseFields: ['tags', 'customMetadata'],
					useUniqueFileName: false,
				},
			},
			httpResponse: mockResponse,
		});

		const result = await uploadFile.call(context, 0);

		const args = getCallArgs(context);
		const entries = await formEntries(args.body as FormData);
		expect(entries.tags).toBe('tag1,tag2');
		expect(entries.folder).toBe('/uploads');
		expect(entries.isPrivateFile).toBe('true');
		expect(entries.responseFields).toBe('tags,customMetadata');
		expect(entries.useUniqueFileName).toBe('false');
		expect(result).toEqual([{ json: mockResponse }]);
	});

	it('should hit /api/v1/files/upload by default', async () => {
		const context = createMockExecuteFunctions({
			nodeParameters: {
				fileName: 'a.jpg',
				binaryPropertyName: '',
				fileUrl: 'https://example.com/a.jpg',
				uploadOptions: {},
			},
			httpResponse: { fileId: '1' },
		});

		await uploadFile.call(context, 0);

		const args = getCallArgs(context);
		expect(args.url).toBe('/api/v1/files/upload');
	});

	it('should hit /api/v2/files/upload when apiVersion is v2', async () => {
		const context = createMockExecuteFunctions({
			nodeParameters: {
				apiVersion: 'v2',
				fileName: 'a.jpg',
				binaryPropertyName: '',
				fileUrl: 'https://example.com/a.jpg',
				uploadOptions: {},
			},
			httpResponse: { fileId: '1' },
		});

		await uploadFile.call(context, 0);

		const args = getCallArgs(context);
		expect(args.url).toBe('/api/v2/files/upload');
		expect(args.baseURL).toBe('https://upload.imagekit.io');
		expect(args.body).toBeInstanceOf(FormData);
	});
});
