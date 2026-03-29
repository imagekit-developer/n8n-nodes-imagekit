import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

const showOnlyForBulkDelete = {
	operation: ['bulkDelete'],
	resource: ['file'],
};

const showOnlyForBulkAddTags = {
	operation: ['bulkAddTags'],
	resource: ['file'],
};

const showOnlyForBulkRemoveTags = {
	operation: ['bulkRemoveTags'],
	resource: ['file'],
};

const showOnlyForBulkRemoveAITags = {
	operation: ['bulkRemoveAITags'],
	resource: ['file'],
};

export const fileBulkDescription: INodeProperties[] = [
	{
		displayName: 'File IDs',
		name: 'fileIds',
		type: 'string',
		required: true,
		default: '',
		description: 'Comma-separated list of file IDs to delete.',
		displayOptions: { show: showOnlyForBulkDelete },
	},
	{
		displayName: 'File IDs',
		name: 'fileIds',
		type: 'string',
		required: true,
		default: '',
		description: 'Comma-separated list of file IDs to add tags to.',
		displayOptions: { show: showOnlyForBulkAddTags },
	},
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		required: true,
		default: '',
		description: 'Comma-separated list of tags to add.',
		displayOptions: { show: showOnlyForBulkAddTags },
	},
	{
		displayName: 'File IDs',
		name: 'fileIds',
		type: 'string',
		required: true,
		default: '',
		description: 'Comma-separated list of file IDs to remove tags from.',
		displayOptions: { show: showOnlyForBulkRemoveTags },
	},
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		required: true,
		default: '',
		description: 'Comma-separated list of tags to remove.',
		displayOptions: { show: showOnlyForBulkRemoveTags },
	},
	{
		displayName: 'File IDs',
		name: 'fileIds',
		type: 'string',
		required: true,
		default: '',
		description: 'Comma-separated list of file IDs to remove AI tags from.',
		displayOptions: { show: showOnlyForBulkRemoveAITags },
	},
	{
		displayName: 'AI Tags',
		name: 'tags',
		type: 'string',
		required: true,
		default: '',
		description: 'Comma-separated list of AI tags to remove.',
		displayOptions: { show: showOnlyForBulkRemoveAITags },
	},
];

export async function bulkDeleteFiles(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData[]> {
	const fileIds = (this.getNodeParameter('fileIds', i) as string).split(',').map((id: string) => id.trim());

	const body: IDataObject = { fileIds };

	const options: IHttpRequestOptions = {
		method: 'POST',
		baseURL: 'https://api.imagekit.io',
		url: '/v1/files/batch/deleteByFileIds',
		body,
	};

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'imagekitApi',
		options,
	);

	return [{ json: responseData as IDataObject }];
}

export async function bulkAddTags(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData[]> {
	const fileIds = (this.getNodeParameter('fileIds', i) as string).split(',').map((id: string) => id.trim());
	const tags = (this.getNodeParameter('tags', i) as string).split(',').map((t: string) => t.trim());

	const body: IDataObject = { fileIds, tags };

	const options: IHttpRequestOptions = {
		method: 'POST',
		baseURL: 'https://api.imagekit.io',
		url: '/v1/files/addTags',
		body,
	};

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'imagekitApi',
		options,
	);

	return [{ json: responseData as IDataObject }];
}

export async function bulkRemoveTags(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData[]> {
	const fileIds = (this.getNodeParameter('fileIds', i) as string).split(',').map((id: string) => id.trim());
	const tags = (this.getNodeParameter('tags', i) as string).split(',').map((t: string) => t.trim());

	const body: IDataObject = { fileIds, tags };

	const options: IHttpRequestOptions = {
		method: 'POST',
		baseURL: 'https://api.imagekit.io',
		url: '/v1/files/removeTags',
		body,
	};

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'imagekitApi',
		options,
	);

	return [{ json: responseData as IDataObject }];
}

export async function bulkRemoveAITags(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData[]> {
	const fileIds = (this.getNodeParameter('fileIds', i) as string).split(',').map((id: string) => id.trim());
	const tags = (this.getNodeParameter('tags', i) as string).split(',').map((t: string) => t.trim());

	const body: IDataObject = { fileIds, tags };

	const options: IHttpRequestOptions = {
		method: 'POST',
		baseURL: 'https://api.imagekit.io',
		url: '/v1/files/removeAITags',
		body,
	};

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'imagekitApi',
		options,
	);

	return [{ json: responseData as IDataObject }];
}
