import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

const showOnlyForFilePublish = {
	operation: ['publish'],
	resource: ['file'],
};

export const filePublishDescription: INodeProperties[] = [
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		required: true,
		default: '',
		description: 'The unique ID of the file to publish or unpublish',
		displayOptions: { show: showOnlyForFilePublish },
	},
	{
		displayName: 'Is Published',
		name: 'isPublished',
		type: 'boolean',
		required: true,
		default: true,
		description: 'Whether to publish (true) or unpublish (false) the file',
		displayOptions: { show: showOnlyForFilePublish },
	},
	{
		displayName: 'Include File Versions',
		name: 'includeFileVersions',
		type: 'boolean',
		default: false,
		description: 'Whether to publish or unpublish all versions of the file. When false, only the current version is affected.',
		displayOptions: { show: showOnlyForFilePublish },
	},
];

export async function publishFile(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData[]> {
	const fileId = this.getNodeParameter('fileId', i) as string;
	const isPublished = this.getNodeParameter('isPublished', i) as boolean;
	const includeFileVersions = this.getNodeParameter('includeFileVersions', i) as boolean;

	const body: IDataObject = {
		publish: {
			isPublished,
			includeFileVersions,
		},
	};

	const options: IHttpRequestOptions = {
		method: 'PATCH',
		baseURL: 'https://api.imagekit.io',
		url: `/v1/files/${fileId}/details`,
		body,
	};

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'imagekitApi',
		options,
	);

	return [{ json: responseData as IDataObject }];
}
