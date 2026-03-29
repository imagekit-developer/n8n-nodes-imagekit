import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

const showOnlyForMetadata = {
	resource: ['metadata'],
};

const showOnlyForMetadataGetByFileId = {
	operation: ['getByFileId'],
	resource: ['metadata'],
};

const showOnlyForMetadataGetFromUrl = {
	operation: ['getFromUrl'],
	resource: ['metadata'],
};

export const metadataDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForMetadata },
		options: [
			{
				name: 'Get by File ID',
				value: 'getByFileId',
				action: 'Get metadata by file ID',
				description: 'Get metadata of a file by its ID',
			},
			{
				name: 'Get From URL',
				value: 'getFromUrl',
				action: 'Get metadata from URL',
				description: 'Get metadata of a file from its remote URL',
			},
		],
		default: 'getByFileId',
	},
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		required: true,
		default: '',
		description: 'The unique ID of the file',
		displayOptions: { show: showOnlyForMetadataGetByFileId },
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		description: 'The remote URL of the file to get metadata for',
		displayOptions: { show: showOnlyForMetadataGetFromUrl },
	},
];

export async function executeMetadata(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', i) as string;

	let options: IHttpRequestOptions;

	switch (operation) {
		case 'getByFileId': {
			const fileId = this.getNodeParameter('fileId', i) as string;
			options = {
				method: 'GET',
				baseURL: 'https://api.imagekit.io',
				url: `/v1/files/${fileId}/metadata`,
			};
			break;
		}
		case 'getFromUrl': {
			const url = this.getNodeParameter('url', i) as string;
			options = {
				method: 'GET',
				baseURL: 'https://api.imagekit.io',
				url: '/v1/metadata',
				qs: { url },
			};
			break;
		}
		default:
			throw new Error(`Unsupported metadata operation: ${operation}`);
	}

	const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'imagekitApi', options);
	return [{ json: responseData as IDataObject }];
}
