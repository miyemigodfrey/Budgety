/**
 * Formats a backend period key ("2026-07") as a short month label ("Jul").
 * Falls back to the raw key if it isn't in the expected shape.
 */
export const formatPeriod = (period: string) => {
	const [year, month] = period.split("-").map(Number);
	if (!year || !month) return period;
	return new Date(year, month - 1, 1).toLocaleString("en-US", {
		month: "short",
	});
};
