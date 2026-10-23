import { executeAccount } from '../../../nodes/Imagekit/resources/_generated/account';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

describe('executeAccount', () => {
	describe('getUsage', () => {
		it('should call GET on /v1/accounts/usage with date range query parameters', async () => {
			const mockResponse = { bandwidth: 1024, storage: 2048 };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'getUsage',
					startDate: '2025-01-01',
					endDate: '2025-01-31',
				},
				httpResponse: mockResponse,
			});

			const result = await executeAccount.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					baseURL: 'https://api.imagekit.io',
					url: '/v1/accounts/usage',
					qs: { startDate: '2025-01-01', endDate: '2025-01-31' },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('getUsageAnalytics', () => {
		it('should call GET on /v1/accounts/usage-analytics with date range query parameters', async () => {
			const mockResponse = { requests: 1000, bandwidth: 2048 };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					operation: 'getUsageAnalytics',
					startDate: '2025-01-01',
					endDate: '2025-01-31',
				},
				httpResponse: mockResponse,
			});

			const result = await executeAccount.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitApi',
				expect.objectContaining({
					method: 'GET',
					baseURL: 'https://api.imagekit.io',
					url: '/v1/accounts/usage-analytics',
					qs: { startDate: '2025-01-01', endDate: '2025-01-31' },
				}),
			);
			expect(result).toEqual([{ json: mockResponse }]);
		});
	});

	describe('authentication', () => {
		it('uses the OAuth2 credential when authentication is oAuth2', async () => {
			const mockResponse = { bandwidth: 1024 };
			const context = createMockExecuteFunctions({
				nodeParameters: {
					authentication: 'oAuth2',
					operation: 'getUsage',
					startDate: '2025-01-01',
					endDate: '2025-01-31',
				},
				httpResponse: mockResponse,
			});

			await executeAccount.call(context, 0);

			expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
				'imagekitOAuth2Api',
				expect.objectContaining({ method: 'GET', url: '/v1/accounts/usage' }),
			);
		});
	});

	describe('unsupported operation', () => {
		it('should throw for unsupported operations', async () => {
			const context = createMockExecuteFunctions({
				nodeParameters: { operation: 'invalid' },
			});

			await expect(executeAccount.call(context, 0)).rejects.toThrow(
				'Unsupported account operation: invalid',
			);
		});
	});
});
