import type { IDataObject, IHookFunctions } from 'n8n-workflow';

interface MockHookFunctionsOptions {
	nodeParameters?: Record<string, unknown>;
	staticData?: IDataObject;
	webhookUrl?: string;
	apiResponses?: unknown[];
	typeVersion?: number;
}

interface MockHookContext {
	context: IHookFunctions;
	staticData: IDataObject;
	http: jest.Mock;
}

const DEFAULT_WEBHOOK_URL = 'https://n8n.example/webhook/abc/imagekit-webhook';

/** Minimal IHookFunctions mock for the trigger's webhookMethods tests.
 *  `apiResponses` are consumed in call order: Error instances reject,
 *  anything else resolves. `staticData` is the live object behind
 *  getWorkflowStaticData so tests can assert on it directly. */
export function createMockHookFunctions(options: MockHookFunctionsOptions = {}): MockHookContext {
	const {
		nodeParameters = {},
		staticData = {},
		webhookUrl = DEFAULT_WEBHOOK_URL,
		apiResponses = [],
		typeVersion = 2,
	} = options;

	const http = jest.fn();
	for (const response of apiResponses) {
		if (response instanceof Error) {
			http.mockRejectedValueOnce(response);
		} else {
			http.mockResolvedValueOnce(response);
		}
	}

	const context = {
		getNodeParameter: jest.fn((param: string, fallback?: unknown) => {
			if (param in nodeParameters) return nodeParameters[param];
			return fallback ?? '';
		}),
		getNodeWebhookUrl: jest.fn(() => webhookUrl),
		getWorkflowStaticData: jest.fn(() => staticData),
		getNode: jest.fn(() => ({
			name: 'ImageKit Trigger',
			type: 'imagekitTrigger',
			typeVersion,
			id: 'n1',
			position: [0, 0],
			parameters: {},
		})),
		logger: {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
		},
		helpers: {
			httpRequestWithAuthentication: http,
		},
	} as unknown as IHookFunctions;

	return { context, staticData, http };
}
