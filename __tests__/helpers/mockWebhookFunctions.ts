import type { IDataObject, IWebhookFunctions } from 'n8n-workflow';

interface MockWebhookFunctionsOptions {
	nodeParameters?: Record<string, unknown>;
	headers?: Record<string, string | string[]>;
	body?: IDataObject;
	rawBody?: Buffer | string;
	credentials?: IDataObject | Error;
	staticData?: IDataObject;
	typeVersion?: number;
}

interface MockWebhookContext {
	context: IWebhookFunctions;
	response: {
		status: jest.Mock;
		json: jest.Mock;
		send: jest.Mock;
		statusCode?: number;
		body?: unknown;
	};
}

export function createMockWebhookFunctions(
	options: MockWebhookFunctionsOptions = {},
): MockWebhookContext {
	const {
		nodeParameters = {},
		headers = {},
		body = {},
		rawBody,
		credentials,
		staticData = {},
		typeVersion = 2,
	} = options;

	const response: MockWebhookContext['response'] = {
		statusCode: undefined,
		body: undefined,
		status: jest.fn(function status(this: MockWebhookContext['response'], code: number) {
			this.statusCode = code;
			return this;
		}) as unknown as jest.Mock,
		json: jest.fn(function json(this: MockWebhookContext['response'], payload: unknown) {
			this.body = payload;
			return this;
		}) as unknown as jest.Mock,
		send: jest.fn(function send(this: MockWebhookContext['response'], payload: unknown) {
			this.body = payload;
			return this;
		}) as unknown as jest.Mock,
	};
	// Re-bind so inner `this` references work when called as `res.status(...)`.
	response.status = jest.fn((code: number) => {
		response.statusCode = code;
		return response;
	}) as unknown as jest.Mock;
	response.json = jest.fn((payload: unknown) => {
		response.body = payload;
		return response;
	}) as unknown as jest.Mock;
	response.send = jest.fn((payload: unknown) => {
		response.body = payload;
		return response;
	}) as unknown as jest.Mock;

	const context = {
		getNodeParameter: jest.fn((param: string, fallback?: unknown) => {
			if (param in nodeParameters) return nodeParameters[param];
			return fallback ?? '';
		}),
		getHeaderData: jest.fn(() => headers),
		getBodyData: jest.fn(() => body),
		getRequestObject: jest.fn(() => ({ rawBody })),
		getResponseObject: jest.fn(() => response),
		getCredentials: jest.fn(async () => {
			if (credentials instanceof Error) throw credentials;
			return credentials ?? {};
		}),
		getWorkflowStaticData: jest.fn(() => staticData),
		getNode: jest.fn(() => ({ name: 'ImageKit Trigger', typeVersion })),
		helpers: {
			returnJsonArray: jest.fn((items: IDataObject[]) => items.map((item) => ({ json: item }))),
		},
	} as unknown as IWebhookFunctions;

	return { context, response };
}
