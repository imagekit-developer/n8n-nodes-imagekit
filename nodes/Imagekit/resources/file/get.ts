import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

const showOnlyForFileGet = {
	operation: ['get'],
	resource: ['file'],
};

export const fileGetDescription: INodeProperties[] = [
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		required: true,
		default: '',
		description: 'The unique ID of the file.',
		displayOptions: { show: showOnlyForFileGet },
	},
];

export async function getFile(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData[]> {
	const fileId = this.getNodeParameter('fileId', i) as string;

	const options: IHttpRequestOptions = {
		method: 'GET',
		baseURL: 'https://api.imagekit.io',
		url: `/v1/files/${fileId}/details`,
	};

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'imagekitApi',
		options,
	);

	return [{ json: responseData as IDataObject }];
}
