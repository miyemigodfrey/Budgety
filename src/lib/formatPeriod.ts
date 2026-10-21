/**
 * Formats a backend period key into a short axis label, handling every
 * granularity the charts support:
 *   "2026"        (yearly)        → "2026"
 *   "2026-07"     (monthly)       → "Jul"
 *   "2026-07-06"  (weekly/biweek) → "Jul 6"  (the window's start date)
 * Falls back to the raw key if it isn't one of these shapes.
 */
export const formatPeriod = (period: string) => {
	if (/^\d{4}$/.test(period)) return period;

	if (/^\d{4}-\d{2}$/.test(period)) {
		const [year, month] = period.split("-").map(Number);
		if (!year || !month) return period;
		return new Date(year, month - 1, 1).toLocaleString("en-US", {
			month: "short",
		});
	}

	if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
		const [year, month, day] = period.split("-").map(Number);
		if (!year || !month || !day) return period;
		return new Date(year, month - 1, day).toLocaleString("en-US", {
			month: "short",
			day: "numeric",
		});
	}

	return period;
};
