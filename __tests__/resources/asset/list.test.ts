import { listAssets } from '../../../nodes/Imagekit/resources/asset/list';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('listAssets', () => {
	it('should call GET on /v1/files with correct query parameters', async () => {
		const mockResponse = [{ fileId: 'f1', name: 'a.png' }, { fileId: 'f2', name: 'b.png' }];
		const context = createMockExecuteFunctions({
			nodeParameters: {
				limit: 10,
				skip: 0,
				sortBy: 'name',
				sortDirection: 'asc',
				additionalOptions: {},
			},
			httpResponse: mockResponse,
		});

		const result = await listAssets.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				method: 'GET',
				baseURL: 'https://api.imagekit.io',
				url: '/v1/files',
				qs: expect.objectContaining({
					limit: 10,
					skip: 0,
					sort: 'ASC_NAME',
				}),
			}),
		);
		expect(context.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponse);
		expect(result).toEqual([{ json: { fileId: 'f1', name: 'a.png' } }, { json: { fileId: 'f2', name: 'b.png' } }]);
	});

	it('should include optional path and fileType in query string', async () => {
		const context = createMockExecuteFunctions({
			nodeParameters: {
				limit: 50,
				skip: 5,
				sortBy: 'created',
				sortDirection: 'desc',
				additionalOptions: {
					path: '/images',
					fileType: 'image',
					type: 'file',
				},
			},
			httpResponse: [{ fileId: 'f1' }],
		});

		await listAssets.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				qs: expect.objectContaining({
					limit: 50,
					skip: 5,
					sort: 'DESC_CREATED',
					path: '/images',
					fileType: 'image',
					type: 'file',
				}),
			}),
		);
	});

	it('should include searchQuery when provided', async () => {
		const context = createMockExecuteFunctions({
			nodeParameters: {
				limit: 20,
				skip: 0,
				sortBy: 'relevance',
				sortDirection: 'desc',
				additionalOptions: {
					searchQuery: 'createdAt > "7d" AND tags IN ["sale"]',
				},
			},
			httpResponse: [],
		});

		await listAssets.call(context, 0);

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'imagekitApi',
			expect.objectContaining({
				qs: expect.objectContaining({
					searchQuery: 'createdAt > "7d" AND tags IN ["sale"]',
					sort: 'DESC_RELEVANCE',
				}),
			}),
		);
	});

	it('should not include fileType and type when set to all', async () => {
		const context = createMockExecuteFunctions({
			nodeParameters: {
				limit: 50,
				skip: 0,
				sortBy: 'name',
				sortDirection: 'asc',
				additionalOptions: {
					fileType: 'all',
					type: 'all',
				},
			},
			httpResponse: [],
		});

		await listAssets.call(context, 0);

		const callArgs = (context.helpers.httpRequestWithAuthentication as jest.Mock).mock.calls[0][1];
		expect(callArgs.qs).not.toHaveProperty('fileType');
		expect(callArgs.qs).not.toHaveProperty('type');
	});

	it('should return single json object when response is not an array', async () => {
		const mockResponse = { error: 'something' };
		const context = createMockExecuteFunctions({
			nodeParameters: {
				limit: 10,
				skip: 0,
				sortBy: 'name',
				sortDirection: 'asc',
				additionalOptions: {},
			},
			httpResponse: mockResponse,
		});

		const result = await listAssets.call(context, 0);

		expect(result).toEqual([{ json: mockResponse }]);
	});
});
