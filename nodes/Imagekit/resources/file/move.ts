import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

const showOnlyForFileMove = {
	operation: ['move'],
	resource: ['file'],
};

export const fileMoveDescription: INodeProperties[] = [
	{
		displayName: 'Source File Path',
		name: 'sourceFilePath',
		type: 'string',
		required: true,
		default: '',
		description: 'The full path of the file to move (e.g. /path/to/file.jpg).',
		displayOptions: { show: showOnlyForFileMove },
	},
	{
		displayName: 'Destination Path',
		name: 'destinationPath',
		type: 'string',
		required: true,
		default: '',
		description: 'The folder path where the file should be moved to.',
		displayOptions: { show: showOnlyForFileMove },
	},
];

export async function moveFile(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData[]> {
	const sourceFilePath = this.getNodeParameter('sourceFilePath', i) as string;
	const destinationPath = this.getNodeParameter('destinationPath', i) as string;

	const body: IDataObject = {
		sourceFilePath,
		destinationPath,
	};

	const options: IHttpRequestOptions = {
		method: 'POST',
		baseURL: 'https://api.imagekit.io',
		url: '/v1/files/move',
		body,
	};

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'imagekitApi',
		options,
	);

	return [{ json: responseData as IDataObject }];
}
