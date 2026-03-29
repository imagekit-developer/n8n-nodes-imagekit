import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

const showOnlyForFileVersion = {
	resource: ['fileVersion'],
};

const showOnlyForFileVersionList = {
	operation: ['list'],
	resource: ['fileVersion'],
};

const showOnlyForFileVersionGet = {
	operation: ['get'],
	resource: ['fileVersion'],
};

const showOnlyForFileVersionDelete = {
	operation: ['delete'],
	resource: ['fileVersion'],
};

const showOnlyForFileVersionRestore = {
	operation: ['restore'],
	resource: ['fileVersion'],
};

export const fileVersionDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForFileVersion },
		options: [
			{
				name: 'List',
				value: 'list',
				action: 'List file versions',
				description: 'List all versions of a file.',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a file version',
				description: 'Get a specific version of a file.',
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a file version',
				description: 'Delete a specific version of a file.',
			},
			{
				name: 'Restore',
				value: 'restore',
				action: 'Restore a file version',
				description: 'Restore a specific version of a file.',
			},
		],
		default: 'list',
	},
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		required: true,
		default: '',
		description: 'The unique ID of the file.',
		displayOptions: { show: showOnlyForFileVersionList },
	},
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		required: true,
		default: '',
		description: 'The unique ID of the file.',
		displayOptions: { show: showOnlyForFileVersionGet },
	},
	{
		displayName: 'Version ID',
		name: 'versionId',
		type: 'string',
		required: true,
		default: '',
		description: 'The version ID to retrieve.',
		displayOptions: { show: showOnlyForFileVersionGet },
	},
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		required: true,
		default: '',
		description: 'The unique ID of the file.',
		displayOptions: { show: showOnlyForFileVersionDelete },
	},
	{
		displayName: 'Version ID',
		name: 'versionId',
		type: 'string',
		required: true,
		default: '',
		description: 'The version ID to delete.',
		displayOptions: { show: showOnlyForFileVersionDelete },
	},
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		required: true,
		default: '',
		description: 'The unique ID of the file.',
		displayOptions: { show: showOnlyForFileVersionRestore },
	},
	{
		displayName: 'Version ID',
		name: 'versionId',
		type: 'string',
		required: true,
		default: '',
		description: 'The version ID to restore.',
		displayOptions: { show: showOnlyForFileVersionRestore },
	},
];

export async function executeFileVersion(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', i) as string;
	const fileId = this.getNodeParameter('fileId', i) as string;

	let options: IHttpRequestOptions;

	switch (operation) {
		case 'list': {
			options = {
				method: 'GET',
				baseURL: 'https://api.imagekit.io',
				url: `/v1/files/${fileId}/versions`,
			};
			const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'imagekitApi', options);
			if (Array.isArray(responseData)) {
				return this.helpers.returnJsonArray(responseData as IDataObject[]);
			}
			return [{ json: responseData as IDataObject }];
		}
		case 'get': {
			const versionId = this.getNodeParameter('versionId', i) as string;
			options = {
				method: 'GET',
				baseURL: 'https://api.imagekit.io',
				url: `/v1/files/${fileId}/versions/${versionId}`,
			};
			const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'imagekitApi', options);
			return [{ json: responseData as IDataObject }];
		}
		case 'delete': {
			const versionId = this.getNodeParameter('versionId', i) as string;
			options = {
				method: 'DELETE',
				baseURL: 'https://api.imagekit.io',
				url: `/v1/files/${fileId}/versions/${versionId}`,
			};
			await this.helpers.httpRequestWithAuthentication.call(this, 'imagekitApi', options);
			return [{ json: { success: true, fileId, versionId } as IDataObject }];
		}
		case 'restore': {
			const versionId = this.getNodeParameter('versionId', i) as string;
			options = {
				method: 'PUT',
				baseURL: 'https://api.imagekit.io',
				url: `/v1/files/${fileId}/versions/${versionId}/restore`,
			};
			const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'imagekitApi', options);
			return [{ json: responseData as IDataObject }];
		}
		default:
			throw new Error(`Unsupported file version operation: ${operation}`);
	}
}
