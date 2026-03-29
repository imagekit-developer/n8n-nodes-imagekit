import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

const showOnlyForFileUpdate = {
	operation: ['update'],
	resource: ['file'],
};

export const fileUpdateDescription: INodeProperties[] = [
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		required: true,
		default: '',
		description: 'The unique ID of the file to update',
		displayOptions: { show: showOnlyForFileUpdate },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showOnlyForFileUpdate },
		options: [
			{
				displayName: 'Custom Coordinates',
				name: 'customCoordinates',
				type: 'string',
				default: '',
				description: 'Custom coordinates for cropping in format x,y,width,height',
			},
			{
				displayName: 'Custom Metadata (JSON)',
				name: 'customMetadata',
				type: 'json',
				default: '{}',
				description: 'JSON object with custom metadata key-value pairs',
			},
			{
				displayName: 'Extensions (JSON)',
				name: 'extensions',
				type: 'json',
				default: '[]',
				description: 'JSON array of extension objects to apply',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '',
				description: 'Comma-separated tags associated with the file',
			},
			{
				displayName: 'Webhook URL',
				name: 'webhookUrl',
				type: 'string',
				default: '',
				description: 'URL to receive webhook notifications for async operations',
			},
		],
	},
];

export async function updateFile(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData[]> {
	const fileId = this.getNodeParameter('fileId', i) as string;
	const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

	const body: IDataObject = {};

	if (updateFields.tags) {
		body.tags = (updateFields.tags as string).split(',').map((t: string) => t.trim());
	}
	if (updateFields.customCoordinates) {
		body.customCoordinates = updateFields.customCoordinates;
	}
	if (updateFields.customMetadata) {
		body.customMetadata = JSON.parse(updateFields.customMetadata as string);
	}
	if (updateFields.extensions) {
		body.extensions = JSON.parse(updateFields.extensions as string);
	}
	if (updateFields.webhookUrl) {
		body.webhookUrl = updateFields.webhookUrl;
	}

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
