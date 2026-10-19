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

/**
 * Parse a money string the way a person types it into a form — "300,000",
 * "₦1,250.50", " 42 " — into a major-unit number.
 *
 * Thousands separators are the trap: `Number("300,000")` is NaN and
 * `parseFloat("300,000")` silently truncates to 300, turning three hundred
 * thousand into three hundred. We strip commas, currency symbols and spaces,
 * then parse. Returns NaN for anything with no usable digits, so callers still
 * validate.
 */
export function parseMoneyInput(raw: string): number {
	const cleaned = raw.replace(/[,\s₦$€£]/g, "");
	if (cleaned === "" || !/^\d*\.?\d*$/.test(cleaned)) return NaN;
	return Number(cleaned);
}

/**
 * Format a major-unit number with thousands separators for display inside a
 * text input as the user types (e.g. 300000 → "300,000", 1250.5 → "1,250.5").
 * Keeps a trailing "." or trailing zeros the user is mid-typing intact.
 *
 * Anything that isn't a digit or a decimal point is dropped, so letters and
 * symbols can never enter the field — only numeric input survives.
 */
export function formatMoneyInput(raw: string): string {
	// Keep digits and dots only; collapse to a single decimal point.
	let cleaned = raw.replace(/[^\d.]/g, "");
	const firstDot = cleaned.indexOf(".");
	if (firstDot !== -1) {
		cleaned =
			cleaned.slice(0, firstDot + 1) +
			cleaned.slice(firstDot + 1).replace(/\./g, "");
	}
	if (cleaned === "") return "";
	const [intPart, decPart] = cleaned.split(".");
	const grouped = (intPart ?? "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return decPart !== undefined ? `${grouped}.${decPart}` : grouped;
}
