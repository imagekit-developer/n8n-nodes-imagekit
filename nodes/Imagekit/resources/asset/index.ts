import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
} from 'n8n-workflow';
import { assetListDescription, listAssets } from './list';

const showOnlyForAssets = {
	resource: ['asset'],
};

export const assetDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForAssets,
		},
		options: [
			{
				name: 'List and Search',
				value: 'list',
				action: 'List and search assets',
				description: 'This API can list all the uploaded files and folders in your ImageKit.io media library. In addition, you can fine-tune your query by specifying various filters by generating a query string in a Lucene-like syntax and provide this generated string as the value of the searchQuery.',
			},
		],
		default: 'list',
	},
	...assetListDescription,
];

export async function executeAsset(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const operation = this.getNodeParameter('operation', i) as string;

    switch (operation) {
        case 'list':
            return listAssets.call(this, i);
        default:
            throw new Error(`Unsupported asset operation: ${operation}`);
    }
}
