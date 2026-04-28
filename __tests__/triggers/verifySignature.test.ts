import { createHmac } from 'crypto';
import { verifyImagekitSignature } from '../../nodes/Imagekit/verifySignature';

const SECRET = 'whsec_test_super_secret';
const NOW = 1_700_000_000_000;
const RAW_BODY = '{"id":"evt_1","type":"file.created","data":{"fileId":"abc"}}';

function sign(timestamp: number, body: string, secret = SECRET): string {
	const v1 = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
	return `t=${timestamp},v1=${v1}`;
}

describe('verifyImagekitSignature', () => {
	it('accepts a valid signature within tolerance', () => {
		const header = sign(NOW, RAW_BODY);
		const result = verifyImagekitSignature(RAW_BODY, header, SECRET, { now: NOW });
		expect(result).toEqual({ valid: true, timestamp: NOW });
	});

	it('accepts a Buffer body the same way as a string body', () => {
		const header = sign(NOW, RAW_BODY);
		const result = verifyImagekitSignature(Buffer.from(RAW_BODY, 'utf8'), header, SECRET, {
			now: NOW,
		});
		expect(result).toEqual({ valid: true, timestamp: NOW });
	});

	it('rejects a tampered body', () => {
		const header = sign(NOW, RAW_BODY);
		const tampered = RAW_BODY.replace('abc', 'xyz');
		const result = verifyImagekitSignature(tampered, header, SECRET, { now: NOW });
		expect(result).toEqual({ valid: false, reason: 'signature-mismatch' });
	});

	it('rejects when the secret is wrong', () => {
		const header = sign(NOW, RAW_BODY);
		const result = verifyImagekitSignature(RAW_BODY, header, 'whsec_wrong', { now: NOW });
		expect(result).toEqual({ valid: false, reason: 'signature-mismatch' });
	});

	it('rejects a stale timestamp outside the tolerance window', () => {
		const stale = NOW - 10 * 60 * 1000;
		const header = sign(stale, RAW_BODY);
		const result = verifyImagekitSignature(RAW_BODY, header, SECRET, { now: NOW });
		expect(result).toEqual({ valid: false, reason: 'timestamp-outside-tolerance' });
	});

	it('rejects a future timestamp outside the tolerance window', () => {
		const future = NOW + 10 * 60 * 1000;
		const header = sign(future, RAW_BODY);
		const result = verifyImagekitSignature(RAW_BODY, header, SECRET, { now: NOW });
		expect(result).toEqual({ valid: false, reason: 'timestamp-outside-tolerance' });
	});

	it('returns a structured reason when the header is missing', () => {
		expect(verifyImagekitSignature(RAW_BODY, undefined, SECRET, { now: NOW })).toEqual({
			valid: false,
			reason: 'missing-signature-header',
		});
	});

	it('returns a structured reason when the header is malformed', () => {
		expect(verifyImagekitSignature(RAW_BODY, 'not-a-real-header', SECRET, { now: NOW })).toEqual({
			valid: false,
			reason: 'malformed-signature-header',
		});
	});

	it('returns a structured reason when the raw body is missing', () => {
		const header = sign(NOW, RAW_BODY);
		expect(verifyImagekitSignature(undefined, header, SECRET, { now: NOW })).toEqual({
			valid: false,
			reason: 'missing-raw-body',
		});
	});

	it('returns a structured reason when no secret is configured', () => {
		const header = sign(NOW, RAW_BODY);
		expect(verifyImagekitSignature(RAW_BODY, header, '', { now: NOW })).toEqual({
			valid: false,
			reason: 'missing-secret',
		});
	});

	it('accepts the first value when the header arrives as an array (express forwarding)', () => {
		const header = sign(NOW, RAW_BODY);
		const result = verifyImagekitSignature(RAW_BODY, [header, 'noise'], SECRET, { now: NOW });
		expect(result).toEqual({ valid: true, timestamp: NOW });
	});

	it('honours a custom tolerance window', () => {
		const stale = NOW - 30 * 1000;
		const header = sign(stale, RAW_BODY);
		const ok = verifyImagekitSignature(RAW_BODY, header, SECRET, {
			now: NOW,
			toleranceMs: 60 * 1000,
		});
		expect(ok).toEqual({ valid: true, timestamp: stale });
		const bad = verifyImagekitSignature(RAW_BODY, header, SECRET, {
			now: NOW,
			toleranceMs: 10 * 1000,
		});
		expect(bad).toEqual({ valid: false, reason: 'timestamp-outside-tolerance' });
	});
});
