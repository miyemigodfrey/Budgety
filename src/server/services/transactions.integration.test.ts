import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "@/server/db";
import { toMinor } from "@/lib/money";
import {
	createTransaction,
	updateTransaction,
	deleteTransaction,
} from "./transactions";
import { deleteSource } from "./sources";
import { computeSourceStats } from "./balance";

/**
 * Prisma port of the balance-engine characterization suite. Same cases as the
 * NestJS bun:test spec, so a green run here proves the money math survived the
 * float→bigint + read-modify-write→atomic + locking rewrite.
 *
 * Requires a real Postgres (DATABASE_URL). It self-skips otherwise, and wipes
 * its test user between cases, so point it at a database you can lose.
 */
const HAS_DB = !!process.env.DATABASE_URL;
const d = HAS_DB ? describe : describe.skip;

const EMAIL = "balance-engine-test@budgety.test";
let userId: string;

const src = async (name: string, balanceMajor: number) => {
	const s = await db.source.create({
		data: { userId, name, balance: toMinor(balanceMajor), currency: "NGN" },
	});
	return s.id;
};

const balanceOf = async (id: string) =>
	(await db.source.findUniqueOrThrow({ where: { id } })).balance;

const nowIso = () => new Date().toISOString();

beforeEach(async () => {
	await db.user.deleteMany({ where: { email: EMAIL } });
	const user = await db.user.create({
		data: { email: EMAIL, name: "Test", password: "x" },
	});
	userId = user.id;
});

afterAll(async () => {
	if (HAS_DB) await db.user.deleteMany({ where: { email: EMAIL } });
	await db.$disconnect();
});

d("create", () => {
	it("inflow credits, outflow debits, transfer moves both", async () => {
		const a = await src("A", 500);
		const b = await src("B", 50);
		await createTransaction(db, userId, {
			sourceId: a,
			type: "inflow",
			amount: toMinor(100),
			category: "Salary",
			date: nowIso(),
		});
		expect(await balanceOf(a)).toBe(toMinor(600));
		await createTransaction(db, userId, {
			sourceId: a,
			type: "transfer",
			amount: toMinor(200),
			category: "Savings",
			date: nowIso(),
			transferTargetId: b,
		});
		expect(await balanceOf(a)).toBe(toMinor(400));
		expect(await balanceOf(b)).toBe(toMinor(250));
	});

	it("allows spending exactly to zero (strict <)", async () => {
		const a = await src("A", 500);
		await createTransaction(db, userId, {
			sourceId: a,
			type: "outflow",
			amount: toMinor(500),
			category: "Rent",
			date: nowIso(),
		});
		expect(await balanceOf(a)).toBe(0n);
	});

	it("rejects outflow of balance + 1 with the amount in major units", async () => {
		const a = await src("A", 500);
		await expect(
			createTransaction(db, userId, {
				sourceId: a,
				type: "outflow",
				amount: toMinor(501),
				category: "Rent",
				date: nowIso(),
			}),
		).rejects.toThrow('Insufficient balance in "A". Available: 500');
	});
});

d("update", () => {
	it("rolls back fully when the new amount does not fit", async () => {
		const a = await src("A", 500);
		const tx = await createTransaction(db, userId, {
			sourceId: a,
			type: "outflow",
			amount: toMinor(200),
			category: "Rent",
			date: nowIso(),
		});
		expect(await balanceOf(a)).toBe(toMinor(300));

		await expect(
			updateTransaction(db, userId, { id: tx.id, amount: toMinor(900) }),
		).rejects.toThrow();

		// Restored exactly, not left torn.
		expect(await balanceOf(a)).toBe(toMinor(300));
	});

	it("reports the POST-REVERSE balance (the fixed aliasing bug)", async () => {
		// NestJS reported 300 here (the aliased post-rollback value); Prisma has
		// no such aliasing, so it reports 500 — the value the guard compared.
		const a = await src("A", 500);
		const tx = await createTransaction(db, userId, {
			sourceId: a,
			type: "outflow",
			amount: toMinor(200),
			category: "Rent",
			date: nowIso(),
		});
		await expect(
			updateTransaction(db, userId, { id: tx.id, amount: toMinor(900) }),
		).rejects.toThrow('Insufficient balance in "A" after edit. Available: 500');
	});
});

d("delete", () => {
	it("refuses to delete an inflow that would go negative", async () => {
		const a = await src("A", 0);
		const tx = await createTransaction(db, userId, {
			sourceId: a,
			type: "inflow",
			amount: toMinor(100),
			category: "Salary",
			date: nowIso(),
		});
		await createTransaction(db, userId, {
			sourceId: a,
			type: "outflow",
			amount: toMinor(100),
			category: "Rent",
			date: nowIso(),
		});
		await expect(deleteTransaction(db, userId, tx.id)).rejects.toThrow(
			"reversing this inflow would cause negative balance",
		);
	});

	it("cascades transactions on both sides of a transfer", async () => {
		const a = await src("A", 500);
		const b = await src("B", 0);
		await createTransaction(db, userId, {
			sourceId: a,
			type: "transfer",
			amount: toMinor(100),
			category: "Savings",
			date: nowIso(),
			transferTargetId: b,
		});
		await deleteSource(db, userId, b);
		expect(await db.transaction.count({ where: { userId } })).toBe(0);
	});
});

d("concurrency", () => {
	it("two simultaneous outflows that together overdraw — exactly one wins", async () => {
		const a = await src("A", 100);
		const mk = () =>
			createTransaction(db, userId, {
				sourceId: a,
				type: "outflow",
				amount: toMinor(100),
				category: "Rent",
				date: nowIso(),
			});
		const results = await Promise.allSettled([mk(), mk()]);
		const ok = results.filter((r) => r.status === "fulfilled").length;
		expect(ok).toBe(1);
		expect(await balanceOf(a)).toBe(0n);
	});
});

d("invariant", () => {
	it("balance == opening + inflow - outflow + transferIn - transferOut", async () => {
		const a = await src("A", 1000);
		const b = await src("B", 1000);
		await createTransaction(db, userId, { sourceId: a, type: "inflow", amount: toMinor(500), category: "Salary", date: nowIso() });
		await createTransaction(db, userId, { sourceId: a, type: "outflow", amount: toMinor(200), category: "Rent", date: nowIso() });
		await createTransaction(db, userId, { sourceId: a, type: "transfer", amount: toMinor(300), category: "Savings", date: nowIso(), transferTargetId: b });
		await createTransaction(db, userId, { sourceId: b, type: "transfer", amount: toMinor(100), category: "Savings", date: nowIso(), transferTargetId: a });

		const txs = await db.transaction.findMany({ where: { userId } });
		expect(computeSourceStats(a, await balanceOf(a), txs).openingBalance).toBe(toMinor(1000));
		expect(computeSourceStats(b, await balanceOf(b), txs).openingBalance).toBe(toMinor(1000));
	});
});
