import { z } from "zod";
import { toMinor } from "@/lib/money";

/**
 * Input schemas, mirroring the old class-validator DTOs.
 *
 * `.strict()` reproduces the global pipe's `forbidNonWhitelisted: true` — an
 * unknown key is rejected, not stripped. Money fields accept MAJOR units from
 * the form and convert to BigInt minor units at the edge, so every procedure
 * body sees only minor units.
 */

const money = z.number().nonnegative();
const positiveMoney = z.number().min(0.01);

export const transactionTypeSchema = z.enum(["inflow", "outflow", "transfer"]);
export const categoryTypeSchema = z.enum(["income", "expense"]);

// ---- auth ----
export const registerSchema = z
	.object({
		name: z.string().min(2),
		email: z.string().email(),
		password: z.string().min(6),
	})
	.strict();

// ---- sources ----
export const createSourceSchema = z
	.object({
		name: z.string().min(1),
		balance: money.transform(toMinor),
		currency: z.string().optional(),
	})
	.strict();

export const updateSourceSchema = z
	.object({
		id: z.string(),
		name: z.string().min(1).optional(),
		currency: z.string().optional(),
		balance: money.transform(toMinor).optional(),
	})
	.strict();

export const sourceSummarySchema = z
	.object({
		id: z.string(),
		period: z.enum(["daily", "monthly", "yearly", "all"]).default("all"),
	})
	.strict();

// ---- transactions ----
export const createTransactionSchema = z
	.object({
		sourceId: z.string(),
		type: transactionTypeSchema,
		amount: positiveMoney.transform(toMinor),
		category: z.string().min(1),
		note: z.string().optional(),
		date: z.string(), // ISO date string; parsed to Date in the service
		transferTargetId: z.string().optional(),
	})
	.strict();

export const updateTransactionSchema = z
	.object({
		id: z.string(),
		sourceId: z.string().optional(),
		type: transactionTypeSchema.optional(),
		amount: positiveMoney.transform(toMinor).optional(),
		category: z.string().min(1).optional(),
		note: z.string().optional(),
		date: z.string().optional(),
		transferTargetId: z.string().optional(),
	})
	.strict();

export const listTransactionsSchema = z
	.object({
		sourceId: z.string().optional(),
		type: transactionTypeSchema.optional(),
		startDate: z.string().optional(),
		endDate: z.string().optional(),
	})
	.strict()
	.optional();

// ---- categories ----
export const createCategorySchema = z
	.object({
		name: z.string().min(1),
		type: categoryTypeSchema,
	})
	.strict();

export const updateCategorySchema = z
	.object({
		id: z.string(),
		name: z.string().min(1).optional(),
		type: categoryTypeSchema.optional(),
	})
	.strict();

// ---- reconciliation ----
export const reconcileSchema = z
	.object({
		entries: z.array(
			z
				.object({
					sourceId: z.string(),
					actualBalance: money.transform(toMinor),
				})
				.strict(),
		),
	})
	.strict();

// ---- settings ----
export const updateSettingsSchema = z
	.object({
		dailyReminder: z.boolean().optional(),
		appLockEnabled: z.boolean().optional(),
		darkMode: z.boolean().optional(),
		backupEnabled: z.boolean().optional(),
	})
	.strict();

// ---- shared query params (previously unvalidated) ----
export const monthsSchema = z
	.object({ months: z.coerce.number().int().default(6) })
	.strict()
	.optional();
