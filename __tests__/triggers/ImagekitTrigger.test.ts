import { createHmac } from 'crypto';
import { ImagekitTrigger } from '../../nodes/Imagekit/ImagekitTrigger.node';
import { createMockWebhookFunctions } from '../helpers/mockWebhookFunctions';

const SECRET = 'whsec_test_secret';

function sign(timestamp: number, body: string, secret = SECRET): string {
	const v1 = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
	return `t=${timestamp},v1=${v1}`;
}

const NOW = 1_700_000_000_000;

describe('ImagekitTrigger', () => {
	beforeEach(() => {
		jest.useFakeTimers().setSystemTime(NOW);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	const fileCreated = { id: 'evt_1', type: 'file.created', data: { fileId: 'abc' } };
	const fileCreatedRaw = JSON.stringify(fileCreated);

	it('emits the parsed body when the signature is valid and the event is selected', async () => {
		const trigger = new ImagekitTrigger();
		const header = sign(NOW, fileCreatedRaw);
		const { context } = createMockWebhookFunctions({
			nodeParameters: {
				events: ['file.created'],
				verifySignature: true,
				toleranceSeconds: 300,
			},
			headers: { 'x-ik-signature': header },
			body: fileCreated,
			rawBody: fileCreatedRaw,
			credentials: { secret: SECRET },
		});

		const result = await trigger.webhook!.call(context);

		expect(result).toEqual({ workflowData: [[{ json: fileCreated }]] });
	});

	it('returns 401 when the signature is invalid', async () => {
		const trigger = new ImagekitTrigger();
		const { context, response } = createMockWebhookFunctions({
			nodeParameters: {
				events: ['file.created'],
				verifySignature: true,
				toleranceSeconds: 300,
			},
			headers: { 'x-ik-signature': `t=${NOW},v1=deadbeef` },
			body: fileCreated,
			rawBody: fileCreatedRaw,
			credentials: { secret: SECRET },
		});

		const result = await trigger.webhook!.call(context);

		expect(result).toEqual({ noWebhookResponse: true });
		expect(response.statusCode).toBe(401);
		expect(response.body).toEqual({ error: 'invalid-signature', reason: 'signature-mismatch' });
	});

	it('drops events not in the user-selected filter (200 ack, no workflow run)', async () => {
		const trigger = new ImagekitTrigger();
		const otherEvent = { id: 'evt_2', type: 'file.updated', data: { fileId: 'abc' } };
		const otherRaw = JSON.stringify(otherEvent);
		const header = sign(NOW, otherRaw);
		const { context } = createMockWebhookFunctions({
			nodeParameters: {
				events: ['file.created'], // only "created" is selected
				verifySignature: true,
				toleranceSeconds: 300,
			},
			headers: { 'x-ik-signature': header },
			body: otherEvent,
			rawBody: otherRaw,
			credentials: { secret: SECRET },
		});

		const result = await trigger.webhook!.call(context);

		expect(result).toEqual({ noWebhookResponse: false, workflowData: [] });
	});

	it('passes through any of the selected event types', async () => {
		const trigger = new ImagekitTrigger();
		const videoReady = {
			id: 'evt_3',
			type: 'video.transformation.ready',
			data: { url: 'https://...' },
		};
		const videoRaw = JSON.stringify(videoReady);
		const header = sign(NOW, videoRaw);
		const { context } = createMockWebhookFunctions({
			nodeParameters: {
				events: ['file.created', 'video.transformation.ready'],
				verifySignature: true,
				toleranceSeconds: 300,
			},
			headers: { 'x-ik-signature': header },
			body: videoReady,
			rawBody: videoRaw,
			credentials: { secret: SECRET },
		});

		const result = await trigger.webhook!.call(context);

		expect(result).toEqual({ workflowData: [[{ json: videoReady }]] });
	});

	it('skips signature verification when the toggle is off', async () => {
		const trigger = new ImagekitTrigger();
		const { context } = createMockWebhookFunctions({
			nodeParameters: {
				events: ['file.created'],
				verifySignature: false,
				toleranceSeconds: 300,
			},
			headers: {},
			body: fileCreated,
			rawBody: fileCreatedRaw,
		});

		const result = await trigger.webhook!.call(context);

		expect(result).toEqual({ workflowData: [[{ json: fileCreated }]] });
	});

	it('rejects deliveries whose timestamp is outside the tolerance window', async () => {
		const trigger = new ImagekitTrigger();
		const stale = NOW - 10 * 60 * 1000;
		const header = sign(stale, fileCreatedRaw);
		const { context, response } = createMockWebhookFunctions({
			nodeParameters: {
				events: ['file.created'],
				verifySignature: true,
				toleranceSeconds: 300,
			},
			headers: { 'x-ik-signature': header },
			body: fileCreated,
			rawBody: fileCreatedRaw,
			credentials: { secret: SECRET },
		});

		const result = await trigger.webhook!.call(context);

		expect(result).toEqual({ noWebhookResponse: true });
		expect(response.statusCode).toBe(401);
		expect(response.body).toEqual({
			error: 'invalid-signature',
			reason: 'timestamp-outside-tolerance',
		});
	});
});
