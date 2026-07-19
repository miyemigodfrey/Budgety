/**
 * Formats a monetary amount using the given ISO currency code.
 * Defaults to NGN (₦) to match the backend, which stores and formats
 * all balances in Naira.
 */
export const formatCurrency = (
	amount: number | null | undefined,
	currency = "NGN",
) => {
	const value = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency,
		maximumFractionDigits: 2,
	}).format(value);
};
