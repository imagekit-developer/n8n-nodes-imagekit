import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';

interface MockExecuteFunctionsOptions {
	nodeParameters?: Record<string, unknown>;
	httpResponse?: unknown;
	binaryData?: Record<string, { fileName?: string; mimeType?: string }>;
	binaryDataBuffer?: Buffer;
}

export function createMockExecuteFunctions(
	options: MockExecuteFunctionsOptions = {},
): IExecuteFunctions {
	const {
		nodeParameters = {},
		httpResponse = {},
		binaryData,
		binaryDataBuffer,
	} = options;

	const httpRequestWithAuthentication = jest.fn().mockResolvedValue(httpResponse);
	const returnJsonArray = jest.fn((items: IDataObject[]) =>
		items.map((item) => ({ json: item })),
	);
	const assertBinaryData = jest.fn((_i: number, propertyName: string) => {
		if (binaryData && binaryData[propertyName]) {
			return binaryData[propertyName];
		}
		throw new Error(`No binary data found for property "${propertyName}"`);
	});
	const getBinaryDataBuffer = jest.fn().mockResolvedValue(
		binaryDataBuffer ?? Buffer.from('test-data'),
	);

	const context = {
		getNodeParameter: jest.fn((param: string) => {
			if (param in nodeParameters) {
				return nodeParameters[param];
			}
			return '';
		}),
		helpers: {
			httpRequestWithAuthentication,
			returnJsonArray,
			assertBinaryData,
			getBinaryDataBuffer,
		},
		continueOnFail: jest.fn().mockReturnValue(false),
		getNode: jest.fn().mockReturnValue({ name: 'ImageKit' }),
	} as unknown as IExecuteFunctions;

	return context;
}
