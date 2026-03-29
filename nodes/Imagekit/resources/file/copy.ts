import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

const showOnlyForFileCopy = {
	operation: ['copy'],
	resource: ['file'],
};

export const fileCopyDescription: INodeProperties[] = [
	{
		displayName: 'Source File Path',
		name: 'sourceFilePath',
		type: 'string',
		required: true,
		default: '',
		description: 'The full path of the file to copy (e.g. /path/to/file.jpg)',
		displayOptions: { show: showOnlyForFileCopy },
	},
	{
		displayName: 'Destination Path',
		name: 'destinationPath',
		type: 'string',
		required: true,
		default: '',
		description: 'The folder path where the file should be copied to',
		displayOptions: { show: showOnlyForFileCopy },
	},
	{
		displayName: 'Include File Versions',
		name: 'includeFileVersions',
		type: 'boolean',
		default: false,
		description: 'Whether to copy all file versions',
		displayOptions: { show: showOnlyForFileCopy },
	},
];

export async function copyFile(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData[]> {
	const sourceFilePath = this.getNodeParameter('sourceFilePath', i) as string;
	const destinationPath = this.getNodeParameter('destinationPath', i) as string;
	const includeFileVersions = this.getNodeParameter('includeFileVersions', i) as boolean;

	const body: IDataObject = {
		sourceFilePath,
		destinationPath,
		includeFileVersions,
	};

	const options: IHttpRequestOptions = {
		method: 'POST',
		baseURL: 'https://api.imagekit.io',
		url: '/v1/files/copy',
		body,
	};

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'imagekitApi',
		options,
	);

	return [{ json: responseData as IDataObject }];
}
