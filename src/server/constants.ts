import type { CategoryType } from "@prisma/client";

/**
 * Categories created for every new account (and the demo seed), so the
 * transaction picker is never empty. Shared so the two callers can't drift.
 */
export const DEFAULT_CATEGORIES: { name: string; type: CategoryType }[] = [
	{ name: "Salary", type: "income" },
	{ name: "Freelance", type: "income" },
	{ name: "Investment Returns", type: "income" },
	{ name: "Food & Groceries", type: "expense" },
	{ name: "Transport", type: "expense" },
	{ name: "Rent", type: "expense" },
	{ name: "Utilities", type: "expense" },
	{ name: "Entertainment", type: "expense" },
	{ name: "Shopping", type: "expense" },
	{ name: "Health", type: "expense" },
];

/** Default settings row for a new user; also the read-fallback. */
export const DEFAULT_SETTINGS = {
	dailyReminder: false,
	appLockEnabled: false,
	darkMode: false,
	backupEnabled: false,
};
