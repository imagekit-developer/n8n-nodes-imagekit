import type {
	INodeType,
	INodeTypeDescription,
	INodeExecutionData,
	IExecuteFunctions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { assetDescription, executeAsset } from './resources/asset';
import { fileDescription, executeFile } from './resources/file';
// Resources below are produced by scripts/generate.ts from
// vendor/sdk-generation + openapi/config.json. See openapi/README.md.
// `file` is partial codegen — its splicer at ./resources/file composes
// the 9 generated ops with hand-written `upload` + `update`.
import { customMetadataFieldsDescription, executeCustomMetadataFields } from './resources/_generated/customMetadataFields';
import { fileVersionDescription, executeFileVersion } from './resources/_generated/fileVersion';
import { metadataDescription, executeMetadata } from './resources/_generated/metadata';
import { folderDescription, executeFolder } from './resources/_generated/folder';
import { purgeCacheDescription, executePurgeCache } from './resources/_generated/purgeCache';
import { accountDescription, executeAccount } from './resources/_generated/account';
import { accountOriginDescription, executeAccountOrigin } from './resources/_generated/accountOrigin';
import { accountUrlEndpointDescription, executeAccountUrlEndpoint } from './resources/_generated/accountUrlEndpoint';
import { savedExtensionDescription, executeSavedExtension } from './resources/_generated/savedExtension';

export class Imagekit implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Imagekit',
		name: 'imagekit',
		icon: { light: 'file:imagekit.light.svg', dark: 'file:imagekit.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Imagekit API',
		defaults: {
			name: 'Imagekit',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'imagekitApi', required: true }],
		requestDefaults: {
			baseURL: 'https://api.imagekit.io',
			headers: {
				Accept: 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Account',
						value: 'account',
					},
					{
						name: 'Account Origin',
						value: 'accountOrigin',
					},
					{
						name: 'Account URL Endpoint',
						value: 'accountUrlEndpoint',
					},
					{
						name: 'Asset',
						value: 'asset',
					},
					{
						name: 'Custom Metadata Field',
						value: 'customMetadataFields',
					},
					{
						name: 'File',
						value: 'file',
					},
					{
						name: 'File Version',
						value: 'fileVersion',
					},
					{
						name: 'Folder',
						value: 'folder',
					},
					{
						name: 'Metadata',
						value: 'metadata',
					},
					{
						name: 'Purge Cache',
						value: 'purgeCache',
					},
					{
						name: 'Saved Extension',
						value: 'savedExtension',
					},
				],
				default: 'asset',
			},
			...assetDescription,
			...fileDescription,
			...fileVersionDescription,
			...metadataDescription,
			...folderDescription,
			...customMetadataFieldsDescription,
			...purgeCacheDescription,
			...accountDescription,
			...accountOriginDescription,
			...accountUrlEndpointDescription,
			...savedExtensionDescription,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;

				switch (resource) {
					case 'asset': {
						const executionItems = await executeAsset.call(this, i);
						returnData.push(...executionItems);
						break;
					}
					case 'file': {
						const executionItems = await executeFile.call(this, i);
						returnData.push(...executionItems);
						break;
					}
					case 'fileVersion': {
						const executionItems = await executeFileVersion.call(this, i);
						returnData.push(...executionItems);
						break;
					}
					case 'metadata': {
						const executionItems = await executeMetadata.call(this, i);
						returnData.push(...executionItems);
						break;
					}
					case 'folder': {
						const executionItems = await executeFolder.call(this, i);
						returnData.push(...executionItems);
						break;
					}
					case 'customMetadataFields': {
						const executionItems = await executeCustomMetadataFields.call(this, i);
						returnData.push(...executionItems);
						break;
					}
					case 'purgeCache': {
						const executionItems = await executePurgeCache.call(this, i);
						returnData.push(...executionItems);
						break;
					}
					case 'account': {
						const executionItems = await executeAccount.call(this, i);
						returnData.push(...executionItems);
						break;
					}
					case 'accountOrigin': {
						const executionItems = await executeAccountOrigin.call(this, i);
						returnData.push(...executionItems);
						break;
					}
					case 'accountUrlEndpoint': {
						const executionItems = await executeAccountUrlEndpoint.call(this, i);
						returnData.push(...executionItems);
						break;
					}
					case 'savedExtension': {
						const executionItems = await executeSavedExtension.call(this, i);
						returnData.push(...executionItems);
						break;
					}
					default:
						throw new NodeOperationError(this.getNode(), `Unsupported resource: ${resource}`);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					// pairedItem preserves the link back to the input item that
					// produced this error so downstream nodes can correlate failures
					// with the originating row when running in continueOnFail mode.
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
