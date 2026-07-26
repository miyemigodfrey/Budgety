import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { computeOpeningBalance } from "./balance";

export async function reconcile(
	db: PrismaClient,
	userId: string,
	entries: { sourceId: string; actualBalance: bigint }[],
) {
	const results = [];
	for (const entry of entries) {
		const source = await db.source.findFirst({
			where: { id: entry.sourceId, userId },
		});
		if (!source) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: `Source ${entry.sourceId} not found`,
			});
		}

		const discrepancy = entry.actualBalance - source.balance;
		// Replace semantics: the schema's @@unique([userId, sourceId]) makes this
		// a real upsert — there was only ever one record per source.
		const record = await db.reconciliation.upsert({
			where: { userId_sourceId: { userId, sourceId: entry.sourceId } },
			update: {
				actualBalance: entry.actualBalance,
				appBalance: source.balance,
				discrepancy,
				reconciledAt: new Date(),
			},
			create: {
				userId,
				sourceId: entry.sourceId,
				actualBalance: entry.actualBalance,
				appBalance: source.balance,
				discrepancy,
			},
		});
		results.push({ ...record, sourceName: source.name });
	}
	return results;
}

export async function getDiscrepancies(db: PrismaClient, userId: string) {
	const [records, sources] = await Promise.all([
		db.reconciliation.findMany({ where: { userId } }),
		db.source.findMany({ where: { userId } }),
	]);

	return records.map((r) => {
		const source = sources.find((s) => s.id === r.sourceId);
		// Recomputed against the LIVE balance, not the stored snapshot.
		const currentAppBalance = source?.balance ?? 0n;
		return {
			sourceId: r.sourceId,
			sourceName: source?.name ?? r.sourceId,
			actualBalance: r.actualBalance,
			appBalance: currentAppBalance,
			discrepancy: r.actualBalance - currentAppBalance,
			reconciledAt: r.reconciledAt,
		};
	});
}

export async function getReconciliationBySource(
	db: PrismaClient,
	userId: string,
	sourceId: string,
) {
	const source = await db.source.findFirst({ where: { id: sourceId, userId } });
	if (!source) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Source not found" });
	}

	const latestRecord = await db.reconciliation.findUnique({
		where: { userId_sourceId: { userId, sourceId } },
	});
	const transactions = await db.transaction.findMany({ where: { userId } });
	const openingBalance = computeOpeningBalance(
		sourceId,
		source.balance,
		transactions,
	);

	return {
		sourceId: source.id,
		sourceName: source.name,
		openingBalance,
		appBalance: source.balance,
		actualBalance: latestRecord?.actualBalance,
		discrepancy: latestRecord
			? latestRecord.actualBalance - source.balance
			: undefined,
		lastReconciledAt: latestRecord?.reconciledAt,
	};
}
