import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

const showOnlyForAssetList = {
	operation: ['list'],
	resource: ['asset'],
};

export const assetListDescription: INodeProperties[] = [
	{
		displayName: 'Sort By',
		name: 'sortBy',
		type: 'options',
		options: [
			{
				name: 'Name',
				value: 'name',
			},
			{
				name: 'Created At',
				value: 'created',
			},
			{
				name: 'Updated At',
				value: 'updated',
			},
			{
				name: 'Height',
				value: 'height',
			},
			{
				name: 'Width',
				value: 'width',
			},
			{
				name: 'Size',
				value: 'size',
			},
			{
				name: 'Relevance',
				value: 'relevance',
			},
		],
		default: 'created',
		description: 'Field to sort the results by.',
	    displayOptions: { show: showOnlyForAssetList },
	},
	{
		displayName: 'Sort Direction',
		name: 'sortDirection',
		type: 'options',
		options: [
			{
				name: 'Ascending',
				value: 'asc',
			},
			{
				name: 'Descending',
				value: 'desc',
			},
		],
		default: 'asc',
		description: 'Direction to sort the results.',
	    displayOptions: { show: showOnlyForAssetList },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 1000,
		},
		displayOptions: { show: showOnlyForAssetList },
		default: 1000,
		description: 'The maximum number of results to return.',
	},
	{
		displayName: 'Skip',
		name: 'skip',
		type: 'number',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: { show: showOnlyForAssetList },
		default: 0,
		description: 'The number of results to skip.',
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: showOnlyForAssetList },
		options: [
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				default: '',
				description: 'The path of the file to list.',
			},
			{
				displayName: 'File Type',
				name: 'fileType',
				type: 'options',
				options: [
					{
						name: 'All',
						value: 'all',
					},
					{
						name: 'Image',
						value: 'image',
					},
					{
						name: 'Non-Image',
						value: 'non-image',
					},
				],
				default: 'all',
				description: 'Type of files to include in the result set.',
			},
			{
				displayName: 'Asset Type',
				name: 'type',
				type: 'options',
				options: [
					{
						name: 'All',
						value: 'all',
					},
					{
						name: 'File',
						value: 'file',
					},
					{
						name: 'Folder',
						value: 'folder',
					},
					{
						name: 'File Version',
						value: 'file-version',
					}
				],
				default: 'all',
				description: 'Type of assets to include in the result set.',
			},
		],
	},
];

export async function listAssets(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData[]> {
	const limit = this.getNodeParameter('limit', i) as number;
	const skip = this.getNodeParameter('skip', i) as number;
	const sortBy = this.getNodeParameter('sortBy', i) as string;
	const sortDirection = this.getNodeParameter('sortDirection', i) as string;
	const additionalOptions = this.getNodeParameter('additionalOptions', i) as IDataObject;

	const sort = `${sortDirection}_${sortBy}`;

	const qs: IDataObject = {
		limit,
		skip,
		sort,
	};

	// Add optional parameters from additionalOptions if they have values
	if (additionalOptions.path) {
		qs.path = additionalOptions.path;
	}

	if (additionalOptions.fileType && additionalOptions.fileType !== 'all') {
		qs.fileType = additionalOptions.fileType;
	}

	if (additionalOptions.type && additionalOptions.type !== 'all') {
		qs.type = additionalOptions.type;
    }
    
	const options: IHttpRequestOptions = {
		method: 'GET',
		baseURL: 'https://api.imagekit.io',
		url: '/v1/files',
		qs,
	};

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'imagekitApi',
		options,
	);

	if (Array.isArray(responseData)) {
		return this.helpers.returnJsonArray(responseData as IDataObject[]);
	}
	return [{ json: responseData as IDataObject }];
}
