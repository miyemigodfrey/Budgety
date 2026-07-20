import { PrismaClient, type TransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "../src/server/constants";
import { toMinor } from "../src/lib/money";

/**
 * Seed the demo account. Run with `npm run db:seed`.
 *
 * Ported from the NestJS SeedService, which ran OnModuleInit — that has no place
 * in Next (it would run per cold start). Transactions are dated RELATIVE to now
 * so dashboard/monthly views are always populated, and source balances are
 * accumulated with the same inflow/outflow/transfer arithmetic as the balance
 * engine so the ledger and stored balance agree.
 */
const prisma = new PrismaClient();

async function main() {
	const email = "demo@budgety.com";

	// Idempotent: wipe and re-create the demo user (cascades to all its data).
	await prisma.user.deleteMany({ where: { email } });

	const password = await bcrypt.hash("password123", 10);
	const user = await prisma.user.create({
		data: {
			email,
			name: "Demo User",
			password,
			categories: { create: DEFAULT_CATEGORIES },
			settings: { create: DEFAULT_SETTINGS },
		},
	});

	const [gtbank, cash, piggy] = await Promise.all([
		prisma.source.create({
			data: { userId: user.id, name: "GTBank", currency: "NGN" },
		}),
		prisma.source.create({
			data: { userId: user.id, name: "Cash", currency: "NGN" },
		}),
		prisma.source.create({
			data: { userId: user.id, name: "Piggy Vest", currency: "NGN" },
		}),
	]);

	const now = new Date();
	const daysAgo = (d: number) => {
		const date = new Date(now);
		date.setDate(date.getDate() - d);
		return date;
	};

	const specs: {
		sourceId: string;
		type: TransactionType;
		amount: number;
		category: string;
		note: string;
		date: Date;
		transferTargetId?: string;
	}[] = [
		{ sourceId: gtbank.id, type: "inflow", amount: 450_000, category: "Salary", note: "March salary", date: daysAgo(30) },
		{ sourceId: gtbank.id, type: "outflow", amount: 120_000, category: "Rent", note: "Monthly rent payment", date: daysAgo(28) },
		{ sourceId: gtbank.id, type: "outflow", amount: 15_000, category: "Utilities", note: "Electricity bill", date: daysAgo(27) },
		{ sourceId: gtbank.id, type: "outflow", amount: 35_000, category: "Food & Groceries", note: "Monthly grocery shopping", date: daysAgo(25) },
		{ sourceId: gtbank.id, type: "transfer", amount: 100_000, category: "Savings", note: "Monthly savings transfer", date: daysAgo(24), transferTargetId: piggy.id },
		{ sourceId: cash.id, type: "inflow", amount: 50_000, category: "Freelance", note: "Logo design project", date: daysAgo(22) },
		{ sourceId: gtbank.id, type: "outflow", amount: 8_500, category: "Transport", note: "Uber rides this week", date: daysAgo(7) },
		{ sourceId: cash.id, type: "outflow", amount: 12_000, category: "Entertainment", note: "Movie night + dinner", date: daysAgo(6) },
		{ sourceId: gtbank.id, type: "outflow", amount: 25_000, category: "Shopping", note: "New headphones", date: daysAgo(5) },
		{ sourceId: cash.id, type: "outflow", amount: 5_000, category: "Food & Groceries", note: "Snacks and drinks", date: daysAgo(4) },
		{ sourceId: piggy.id, type: "inflow", amount: 15_000, category: "Investment Returns", note: "Piggy vest interest", date: daysAgo(3) },
		{ sourceId: gtbank.id, type: "outflow", amount: 7_500, category: "Health", note: "Pharmacy", date: daysAgo(2) },
		{ sourceId: gtbank.id, type: "inflow", amount: 75_000, category: "Freelance", note: "Web app project milestone", date: daysAgo(1) },
	];

	const balances: Record<string, bigint> = {
		[gtbank.id]: 0n,
		[cash.id]: 0n,
		[piggy.id]: 0n,
	};

	for (const spec of specs) {
		const amount = toMinor(spec.amount);
		await prisma.transaction.create({
			data: {
				userId: user.id,
				sourceId: spec.sourceId,
				type: spec.type,
				amount,
				category: spec.category,
				note: spec.note,
				date: spec.date,
				transferTargetId: spec.transferTargetId ?? null,
			},
		});

		const add = (id: string, delta: bigint) => {
			balances[id] = (balances[id] ?? 0n) + delta;
		};
		if (spec.type === "inflow") add(spec.sourceId, amount);
		else if (spec.type === "outflow") add(spec.sourceId, -amount);
		else {
			add(spec.sourceId, -amount);
			if (spec.transferTargetId) add(spec.transferTargetId, amount);
		}
	}

	await Promise.all(
		Object.entries(balances).map(([id, balance]) =>
			prisma.source.update({ where: { id }, data: { balance } }),
		),
	);

	console.log("Seeded demo data.");
	console.log("  Login: demo@budgety.com / password123");
	console.log(
		`  Balances: GTBank ${balances[gtbank.id]}, Cash ${balances[cash.id]}, Piggy Vest ${balances[piggy.id]} (kobo)`,
	);
}

main()
	.then(() => prisma.$disconnect())
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
