import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

const showOnlyForFileDelete = {
	operation: ['delete'],
	resource: ['file'],
};

export const fileDeleteDescription: INodeProperties[] = [
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		required: true,
		default: '',
		description: 'The unique ID of the file to delete',
		displayOptions: { show: showOnlyForFileDelete },
	},
];

export async function deleteFile(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData[]> {
	const fileId = this.getNodeParameter('fileId', i) as string;

	const options: IHttpRequestOptions = {
		method: 'DELETE',
		baseURL: 'https://api.imagekit.io',
		url: `/v1/files/${fileId}`,
	};

	await this.helpers.httpRequestWithAuthentication.call(
		this,
		'imagekitApi',
		options,
	);

	return [{ json: { success: true, fileId } as IDataObject }];
}
