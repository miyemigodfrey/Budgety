/**
 * Money conversion — the ONLY place major and minor units meet.
 *
 * Everything server-side and in the database is BigInt minor units (kobo,
 * 1/100 NGN). The UI and forms work in major units (naira as a JS number).
 * tRPC inputs call `toMinor` at the schema edge; formatters call `toMajor`
 * before display. Nothing else should multiply or divide by 100.
 */

const MINOR_PER_MAJOR = 100;

/**
 * Major (e.g. 19.99) → minor (1999n).
 *
 * The Math.round is essential: 19.99 * 100 === 1998.9999999999998 in IEEE-754,
 * so a naive BigInt() would truncate to 1998.
 */
export function toMinor(major: number): bigint {
	if (!Number.isFinite(major)) {
		throw new Error(`Cannot convert non-finite amount to minor units: ${major}`);
	}
	return BigInt(Math.round(major * MINOR_PER_MAJOR));
}

/**
 * Minor (1999n) → major (19.99). Lossy by design — for display only.
 */
export function toMajor(minor: bigint): number {
	return Number(minor) / MINOR_PER_MAJOR;
}
