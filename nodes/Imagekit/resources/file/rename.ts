import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

const showOnlyForFileRename = {
	operation: ['rename'],
	resource: ['file'],
};

export const fileRenameDescription: INodeProperties[] = [
	{
		displayName: 'File Path',
		name: 'filePath',
		type: 'string',
		required: true,
		default: '',
		description: 'The full path of the file to rename (e.g. /path/to/file.jpg)',
		displayOptions: { show: showOnlyForFileRename },
	},
	{
		displayName: 'New File Name',
		name: 'newFileName',
		type: 'string',
		required: true,
		default: '',
		description: 'The new name for the file',
		displayOptions: { show: showOnlyForFileRename },
	},
	{
		displayName: 'Purge Cache',
		name: 'purgeCache',
		type: 'boolean',
		default: true,
		description: 'Whether to purge CDN cache for the old file URL',
		displayOptions: { show: showOnlyForFileRename },
	},
];

export async function renameFile(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData[]> {
	const filePath = this.getNodeParameter('filePath', i) as string;
	const newFileName = this.getNodeParameter('newFileName', i) as string;
	const purgeCache = this.getNodeParameter('purgeCache', i) as boolean;

	const body: IDataObject = {
		filePath,
		newFileName,
		purgeCache,
	};

	const options: IHttpRequestOptions = {
		method: 'PUT',
		baseURL: 'https://api.imagekit.io',
		url: '/v1/files/rename',
		body,
	};

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'imagekitApi',
		options,
	);

	return [{ json: responseData as IDataObject }];
}
