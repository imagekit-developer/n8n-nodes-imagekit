import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

const showOnlyForFileUpload = {
	operation: ['upload'],
	resource: ['file'],
};

export const fileUploadDescription: INodeProperties[] = [
	{
		displayName: 'Input Data Field Name',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		description: 'The name of the input field containing the binary file data to upload. Leave empty to use a URL instead.',
		displayOptions: { show: showOnlyForFileUpload },
	},
	{
		displayName: 'File URL',
		name: 'fileUrl',
		type: 'string',
		default: '',
		description: 'URL of the file to upload. Used only if no binary data is provided.',
		displayOptions: { show: showOnlyForFileUpload },
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: '',
		required: true,
		description: 'The name with which the file has to be uploaded',
		displayOptions: { show: showOnlyForFileUpload },
	},
	{
		displayName: 'Additional Options',
		name: 'uploadOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: showOnlyForFileUpload },
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
				displayName: 'Folder',
				name: 'folder',
				type: 'string',
				default: '/',
				description: 'The folder path in which the file has to be uploaded',
			},
			{
				displayName: 'Is Private File',
				name: 'isPrivateFile',
				type: 'boolean',
				default: false,
				description: 'Whether the file should be marked as private',
			},
			{
				displayName: 'Overwrite AI Tags',
				name: 'overwriteAITags',
				type: 'boolean',
				default: true,
				description: 'Whether to overwrite AI tags if the file already exists',
			},
			{
				displayName: 'Overwrite Custom Metadata',
				name: 'overwriteCustomMetadata',
				type: 'boolean',
				default: true,
				description: 'Whether to overwrite custom metadata if the file already exists',
			},
			{
				displayName: 'Overwrite File',
				name: 'overwriteFile',
				type: 'boolean',
				default: false,
				description: 'Whether to overwrite the file if it already exists',
			},
			{
				displayName: 'Overwrite Tags',
				name: 'overwriteTags',
				type: 'boolean',
				default: true,
				description: 'Whether to overwrite tags if the file already exists',
			},
			{
				displayName: 'Response Fields',
				name: 'responseFields',
				type: 'multiOptions',
				options: [
					{
						name: 'Custom Coordinates',
						value: 'customCoordinates',
					},
					{
						name: 'Custom Metadata',
						value: 'customMetadata',
					},
					{
						name: 'Embedded Metadata',
						value: 'embeddedMetadata',
					},
					{
						name: 'Is Private File',
						value: 'isPrivateFile',
					},
					{
						name: 'Is Published',
						value: 'isPublished',
					},
					{
						name: 'Metadata',
						value: 'metadata',
					},
					{
						name: 'Selected Fields Schema',
						value: 'selectedFieldsSchema',
					},
					{
						name: 'Tags',
						value: 'tags',
					},
				],
				default: [],
				description: 'Response field keys to include in the API response body',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '',
				description: 'Comma-separated tags associated with the file',
			},
			{
				displayName: 'Use Unique File Name',
				name: 'useUniqueFileName',
				type: 'boolean',
				default: true,
				description: 'Whether to add a unique string to the filename to prevent duplicates',
			},
		],
	},
];

export async function uploadFile(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData[]> {
	const fileName = this.getNodeParameter('fileName', i) as string;
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
	const fileUrl = this.getNodeParameter('fileUrl', i) as string;
	const uploadOptions = this.getNodeParameter('uploadOptions', i) as IDataObject;

	const body: IDataObject = {
		fileName,
	};

	if (binaryPropertyName && this.helpers.assertBinaryData(i, binaryPropertyName)) {
		const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
		const dataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
		body.file = dataBuffer.toString('base64');
		if (!fileName && binaryData.fileName) {
			body.fileName = binaryData.fileName;
		}
	} else if (fileUrl) {
		body.file = fileUrl;
	} else {
		throw new Error('Either binary data or a file URL must be provided for upload.');
	}

	if (uploadOptions.useUniqueFileName !== undefined) {
		body.useUniqueFileName = uploadOptions.useUniqueFileName;
	}
	if (uploadOptions.tags) {
		body.tags = (uploadOptions.tags as string).split(',').map((t: string) => t.trim());
	}
	if (uploadOptions.folder) {
		body.folder = uploadOptions.folder;
	}
	if (uploadOptions.isPrivateFile !== undefined) {
		body.isPrivateFile = uploadOptions.isPrivateFile;
	}
	if (uploadOptions.customCoordinates) {
		body.customCoordinates = uploadOptions.customCoordinates;
	}
	if (uploadOptions.responseFields) {
		body.responseFields = uploadOptions.responseFields;
	}
	if (uploadOptions.overwriteFile !== undefined) {
		body.overwriteFile = uploadOptions.overwriteFile;
	}
	if (uploadOptions.overwriteAITags !== undefined) {
		body.overwriteAITags = uploadOptions.overwriteAITags;
	}
	if (uploadOptions.overwriteTags !== undefined) {
		body.overwriteTags = uploadOptions.overwriteTags;
	}
	if (uploadOptions.overwriteCustomMetadata !== undefined) {
		body.overwriteCustomMetadata = uploadOptions.overwriteCustomMetadata;
	}
	if (uploadOptions.customMetadata) {
		body.customMetadata = JSON.parse(uploadOptions.customMetadata as string);
	}

	const options: IHttpRequestOptions = {
		method: 'POST',
		baseURL: 'https://upload.imagekit.io',
		url: '/api/v1/files/upload',
		body,
	};

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'imagekitApi',
		options,
	);

	return [{ json: responseData as IDataObject }];
}
