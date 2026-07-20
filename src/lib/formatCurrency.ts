import { toMajor } from "./money";

/**
 * Formats a monetary amount using the given ISO currency code.
 *
 * Accepts BigInt MINOR units (kobo) — the shape the server returns — or a
 * number/undefined for convenience at call sites that already hold major units
 * or nullable data. Defaults to NGN (₦).
 */
export const formatCurrency = (
	amount: bigint | number | null | undefined,
	currency = "NGN",
) => {
	const major =
		typeof amount === "bigint"
			? toMajor(amount)
			: typeof amount === "number" && !Number.isNaN(amount)
				? amount
				: 0;
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency,
		maximumFractionDigits: 2,
	}).format(major);
};
