import { createHmac, timingSafeEqual } from 'crypto';

export type VerifyResult =
	| { valid: true; timestamp: number }
	| { valid: false; reason: string };

export interface VerifyOptions {
	toleranceMs?: number;
	now?: number;
}

/**
 * Verifies the `t=<unix-ms>,v1=<hex-hmac-sha256>` header per
 * https://imagekit.io/docs/webhooks#verify-signature-manually. Must run against
 * the raw request body: re-serialising parsed JSON changes the HMAC.
 */
export function verifyImagekitSignature(
	rawBody: Buffer | string | undefined,
	signatureHeader: string | string[] | undefined,
	secret: string,
	options: VerifyOptions = {},
): VerifyResult {
	if (!secret) return { valid: false, reason: 'missing-secret' };
	if (rawBody === undefined || rawBody === null) {
		return { valid: false, reason: 'missing-raw-body' };
	}
	const headerValue = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
	if (!headerValue) return { valid: false, reason: 'missing-signature-header' };

	const parts: Record<string, string> = {};
	for (const segment of headerValue.split(',')) {
		const eq = segment.indexOf('=');
		if (eq < 0) continue;
		parts[segment.slice(0, eq).trim()] = segment.slice(eq + 1).trim();
	}
	const timestampStr = parts.t;
	const expectedHex = parts.v1;
	if (!timestampStr || !expectedHex) {
		return { valid: false, reason: 'malformed-signature-header' };
	}

	const timestamp = Number(timestampStr);
	if (!Number.isFinite(timestamp)) {
		return { valid: false, reason: 'invalid-timestamp' };
	}

	const tolerance = options.toleranceMs ?? 5 * 60 * 1000;
	const now = options.now ?? Date.now();
	if (Math.abs(now - timestamp) > tolerance) {
		return { valid: false, reason: 'timestamp-outside-tolerance' };
	}

	const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
	const computedHex = createHmac('sha256', secret)
		.update(`${timestampStr}.${bodyStr}`)
		.digest('hex');

	// timingSafeEqual throws on unequal lengths.
	if (computedHex.length !== expectedHex.length) {
		return { valid: false, reason: 'signature-mismatch' };
	}
	const ok = timingSafeEqual(Buffer.from(computedHex, 'utf8'), Buffer.from(expectedHex, 'utf8'));
	return ok ? { valid: true, timestamp } : { valid: false, reason: 'signature-mismatch' };
}
