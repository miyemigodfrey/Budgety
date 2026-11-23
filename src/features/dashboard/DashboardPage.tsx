"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorState } from "@/components/EmptyState";
import { useSpace } from "@/hooks/useSpace";
import { useQuickAdd } from "@/components/app/QuickAdd";
import { useMe } from "@/components/layout/Sidebar";
import { span } from "@/components/app/grid";
import type { Status } from "@/lib/status";
import { getSources, type SourceDto } from "@/api/sources";
import { getTransactionOverview, type TransactionOverviewDto } from "@/api/overview";
import {
	getTransactions,
	getTrends,
	type Granularity,
	type TransactionDto,
	type TrendPoint,
} from "@/api/transaction";
import { getLists, type ShoppingList } from "@/api/shopping";
import { getDiscrepancies } from "@/api/reconcilation";
import {
	BalanceHero,
	CashFlowCard,
	CategoryCard,
	DashboardSkeleton,
	RecentCard,
	ShoppingCard,
	SourcesCard,
	StatCard,
	pickShoppingList,
	type CategorySlice,
} from "./cards";
import { FirstRun } from "./FirstRun";
import { firstName, greeting, inMonth, monthName, todayOver } from "./format";

/** Outflows this month grouped by category: top four, the rest as "Other". */
function categorySlices(txs: TransactionDto[]): { slices: CategorySlice[]; total: bigint } {
	const by = new Map<string, bigint>();
	let total = 0n;
	for (const t of txs) {
		if (t.type !== "outflow" || !inMonth(t.date)) continue;
		const key = t.category?.trim() || "Uncategorised";
		by.set(key, (by.get(key) ?? 0n) + t.amount);
		total += t.amount;
	}
	const sorted = [...by.entries()]
		.map(([name, amount]) => ({ name, amount }))
		.sort((a, b) => (b.amount > a.amount ? 1 : b.amount < a.amount ? -1 : 0));
	if (sorted.length <= 5) return { slices: sorted, total };
	const top = sorted.slice(0, 4);
	const rest = sorted.slice(4).reduce((s, c) => s + c.amount, 0n);
	return { slices: [...top, { name: "Other", amount: rest }], total };
}

const sumFlow = (txs: TransactionDto[], type: "inflow" | "outflow", offset: number) =>
	txs
		.filter((t) => t.type === type && inMonth(t.date, offset))
		.reduce((s, t) => s + t.amount, 0n);

type Data = {
	overview: TransactionOverviewDto;
	sources: SourceDto[];
	transactions: TransactionDto[];
};

function Dashboard() {
	const { isAllView, activeSpace } = useSpace();
	const { openAddTransaction, refreshPage } = useQuickAdd();
	const me = useMe();

	const [data, setData] = useState<Data | null>(null);
	const [status, setStatus] = useState<Status>("loading");
	const [reloadKey, setReloadKey] = useState(0);
	const reload = useCallback(() => {
		setStatus("loading");
		setReloadKey((k) => k + 1);
	}, []);

	// Secondary panels load on their own and never block the page.
	const [shopping, setShopping] = useState<ShoppingList | null>(null);
	const [lastReconciled, setLastReconciled] = useState<Date | null | undefined>(undefined);

	const [granularity, setGranularity] = useState<Granularity>("monthly");
	const [trend, setTrend] = useState<TrendPoint[] | undefined>(undefined);
	const [trendError, setTrendError] = useState(false);
	const [trendKey, setTrendKey] = useState(0);

	useEffect(() => {
		let cancelled = false;
		Promise.all([getTransactionOverview(), getSources(), getTransactions()])
			.then(([overview, sources, transactions]) => {
				if (cancelled) return;
				setData({ overview, sources, transactions });
				setStatus("ready");
			})
			.catch((error) => {
				if (cancelled) return;
				console.error("Failed to load dashboard:", error);
				setStatus("error");
			});
		getLists()
			.then((lists) => !cancelled && setShopping(pickShoppingList(lists) ?? null))
			.catch((e) => console.error("Failed to load shopping lists:", e));
		getDiscrepancies()
			.then((rows) => {
				if (cancelled) return;
				const latest = rows.reduce<Date | null>((acc, r) => {
					const d = new Date(r.reconciledAt);
					return !acc || d > acc ? d : acc;
				}, null);
				setLastReconciled(latest);
			})
			.catch((e) => console.error("Failed to load reconciliations:", e));
		return () => {
			cancelled = true;
		};
	}, [reloadKey]);

	// The chart refetches on its own when the granularity changes.
	useEffect(() => {
		let cancelled = false;
		setTrend(undefined);
		setTrendError(false);
		getTrends(6, granularity)
			.then((t) => !cancelled && setTrend(t.totalsByMonth))
			.catch((e) => {
				if (cancelled) return;
				console.error("Failed to load cash flow:", e);
				setTrendError(true);
			});
		return () => {
			cancelled = true;
		};
	}, [granularity, reloadKey, trendKey]);

	const derived = useMemo(() => {
		if (!data) return null;
		const tx = data.transactions;
		return {
			cats: categorySlices(tx),
			inflowPrev: sumFlow(tx, "inflow", -1),
			outflowPrev: sumFlow(tx, "outflow", -1),
		};
	}, [data]);

	if (status === "loading") return <DashboardSkeleton />;

	if (status === "error" || !data || !derived) {
		return (
			<main className="page">
				<ErrorState message="Couldn't load your dashboard." onRetry={reload} />
			</main>
		);
	}

	const name = firstName(me?.name);
	const spaceLabel = isAllView ? "All spaces" : (activeSpace?.name ?? "this space");
	const { overview, sources, transactions } = data;

	// Brand-new space: no sources, or sources but nothing recorded yet.
	if (sources.length === 0 || transactions.length === 0) {
		return (
			<FirstRun
				name={name}
				sources={sources}
				totalBalance={overview.totalBalance}
				onChanged={refreshPage}
			/>
		);
	}

	return (
		<main className="page">
			<div className="page-h">
				<div className="page-h-text">
					<p className="t-over">{todayOver()}</p>
					<h1 className="t-h1">
						{greeting()}
						{name ? `, ${name}` : ""}
					</h1>
					<p className="t-muted">
						{isAllView ? (
							<>
								Here’s where your money stands across <strong className="t-fg2">all spaces</strong>.
							</>
						) : (
							<>
								Here’s where your money stands in <strong className="t-fg2">{spaceLabel}</strong>.
							</>
						)}
					</p>
				</div>
			</div>

			<div className="g g-stretch">
				<BalanceHero
					overview={overview}
					sourceCount={sources.length}
					spaceLabel={spaceLabel}
					readOnly={isAllView}
					onAdd={openAddTransaction}
				/>

				<div style={span({ d: 6, t: 12 })}>
					<div className="g g-stretch" style={{ height: "100%" }}>
						<StatCard
							kind="in"
							current={overview.monthly.inflow}
							previous={derived.inflowPrev}
							previousMonth={monthName(-1)}
						/>
						<StatCard
							kind="out"
							current={overview.monthly.outflow}
							previous={derived.outflowPrev}
							previousMonth={monthName(-1)}
						/>
						{shopping && <ShoppingCard list={shopping} />}
					</div>
				</div>

				<CashFlowCard
					granularity={granularity}
					onGranularity={setGranularity}
					series={trend}
					error={trendError}
					onRetry={() => setTrendKey((k) => k + 1)}
				/>

				<CategoryCard
					slices={derived.cats.slices}
					total={derived.cats.total}
					monthLabel={monthName(0)}
				/>

				<RecentCard
					txs={overview.recentTransactions.slice(0, 6)}
					spaceLabel={spaceLabel}
					isAllView={isAllView}
				/>

				<SourcesCard
					sources={sources}
					totalBalance={overview.totalBalance}
					lastReconciled={lastReconciled}
				/>
			</div>
		</main>
	);
}

export default Dashboard;
