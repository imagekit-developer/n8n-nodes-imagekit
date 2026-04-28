import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Result of verifying an ImageKit webhook signature.
 *
 * - `valid: true`  — the request is authentic and within the timestamp tolerance.
 * - `valid: false` — `reason` describes why; useful for the 401 response body and tests.
 */
export type VerifyResult =
	| { valid: true; timestamp: number }
	| { valid: false; reason: string };

export interface VerifyOptions {
	/** Maximum allowed clock skew between ImageKit and our server, in milliseconds.
	 *  Requests with a timestamp older or newer than this are rejected to mitigate
	 *  replay attacks. Default: 5 minutes (matches Stripe / Standard Webhooks). */
	toleranceMs?: number;
	/** Override the current time. Used by tests; pass `Date.now()` in production. */
	now?: number;
}

/**
 * Verify an ImageKit webhook delivery using the legacy `x-ik-signature` header.
 *
 * Algorithm (per https://imagekit.io/docs/webhooks#verify-signature-manually):
 *   1. The header is `t=<unix-ms>,v1=<hex-hmac-sha256>`.
 *   2. The HMAC payload is `${timestamp}.${rawBody}` (UTF-8 string concat).
 *   3. The HMAC key is the webhook signing secret.
 *
 * **Important:** the verification *must* run against the raw, unparsed request
 * body — re-serialising the parsed JSON loses key order and whitespace, which
 * changes the HMAC. n8n's express layer preserves the raw text on
 * `req.rawBody`; trigger nodes pass that buffer/string in here.
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

	// Parse `t=...,v1=...` (order-independent, accepts extra fields).
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

	// Length check first to keep `timingSafeEqual` happy and to short-circuit
	// the obvious garbage cases without leaking timing information.
	if (computedHex.length !== expectedHex.length) {
		return { valid: false, reason: 'signature-mismatch' };
	}
	const ok = timingSafeEqual(Buffer.from(computedHex, 'utf8'), Buffer.from(expectedHex, 'utf8'));
	return ok ? { valid: true, timestamp } : { valid: false, reason: 'signature-mismatch' };
}
