import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

const showOnlyForPurgeCache = {
	resource: ['purgeCache'],
};

const showOnlyForPurgeCachePurge = {
	operation: ['purge'],
	resource: ['purgeCache'],
};

const showOnlyForPurgeCacheGetStatus = {
	operation: ['getStatus'],
	resource: ['purgeCache'],
};

export const purgeCacheDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForPurgeCache },
		options: [
			{
				name: 'Purge',
				value: 'purge',
				action: 'Purge cache',
				description: 'Purge cache for a file URL',
			},
			{
				name: 'Get Purge Status',
				value: 'getStatus',
				action: 'Get purge status',
				description: 'Get the status of a purge request',
			},
		],
		default: 'purge',
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		description: 'The URL of the file to purge from cache',
		displayOptions: { show: showOnlyForPurgeCachePurge },
	},
	{
		displayName: 'Request ID',
		name: 'requestId',
		type: 'string',
		required: true,
		default: '',
		description: 'The request ID returned from a purge request',
		displayOptions: { show: showOnlyForPurgeCacheGetStatus },
	},
];

export async function executePurgeCache(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', i) as string;

	let options: IHttpRequestOptions;

	switch (operation) {
		case 'purge': {
			const url = this.getNodeParameter('url', i) as string;
			options = {
				method: 'POST',
				baseURL: 'https://api.imagekit.io',
				url: '/v1/files/purge',
				body: { url },
			};
			const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'imagekitApi', options);
			return [{ json: responseData as IDataObject }];
		}
		case 'getStatus': {
			const requestId = this.getNodeParameter('requestId', i) as string;
			options = {
				method: 'GET',
				baseURL: 'https://api.imagekit.io',
				url: `/v1/files/purge/${requestId}`,
			};
			const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'imagekitApi', options);
			return [{ json: responseData as IDataObject }];
		}
		default:
			throw new Error(`Unsupported purge cache operation: ${operation}`);
	}
}
