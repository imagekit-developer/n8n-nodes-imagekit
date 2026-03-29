import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

const showOnlyForAccount = {
	resource: ['account'],
};

const showOnlyForAccountGetUsage = {
	operation: ['getUsage'],
	resource: ['account'],
};

export const accountDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForAccount },
		options: [
			{
				name: 'Get Usage',
				value: 'getUsage',
				action: 'Get account usage',
				description: 'Get account usage statistics',
			},
		],
		default: 'getUsage',
	},
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'YYYY-MM-DD',
		description: 'Start date for the usage period (format: YYYY-MM-DD)',
		displayOptions: { show: showOnlyForAccountGetUsage },
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'YYYY-MM-DD',
		description: 'End date for the usage period (format: YYYY-MM-DD)',
		displayOptions: { show: showOnlyForAccountGetUsage },
	},
];

export async function executeAccount(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', i) as string;

	switch (operation) {
		case 'getUsage': {
			const startDate = this.getNodeParameter('startDate', i) as string;
			const endDate = this.getNodeParameter('endDate', i) as string;
			const options: IHttpRequestOptions = {
				method: 'GET',
				baseURL: 'https://api.imagekit.io',
				url: '/v1/accounts/usage',
				qs: { startDate, endDate },
			};
			const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'imagekitApi', options);
			return [{ json: responseData as IDataObject }];
		}
		default:
			throw new Error(`Unsupported account operation: ${operation}`);
	}
}
