"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { DownloardCards } from "@/components/DownloadCards";
import { span } from "@/components/app/grid";
import { getSummary, type ReportSummary } from "@/api/export";
import {
	getTransactions,
	getTrends,
	type Granularity,
	type TransactionDto,
	type TrendsDto,
} from "@/api/transaction";
import { useSpace } from "@/hooks/useSpace";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatPeriod } from "@/lib/formatPeriod";
import { toMajor } from "@/lib/money";
import type { Status } from "@/lib/status";

const GRANULARITIES: {
	id: Granularity;
	label: string;
	noun: string;
	unit: string;
}[] = [
	{ id: "weekly", label: "Weekly", noun: "weeks", unit: "week" },
	{ id: "biweekly", label: "Bi-weekly", noun: "periods", unit: "fortnight" },
	{ id: "monthly", label: "Monthly", noun: "months", unit: "month" },
	{ id: "yearly", label: "Yearly", noun: "years", unit: "year" },
];

const CAT_COLORS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)"];

/** Signed amount with a real minus sign, as the canvas writes it. */
const signed = (minor: bigint) =>
	(minor > 0n ? "+" : minor < 0n ? "−" : "") +
	formatCurrency(minor < 0n ? -minor : minor);

const compact = new Intl.NumberFormat("en-NG", {
	style: "currency",
	currency: "NGN",
	notation: "compact",
	maximumFractionDigits: 1,
});

/** Round the axis top up to a tidy number that splits into four steps. */
function niceMax(max: number) {
	if (max <= 0) return 4;
	const rough = max / 4;
	const mag = 10 ** Math.floor(Math.log10(rough));
	const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rough) ?? 10 * mag;
	return step * 4;
}

/** Start date of a backend period key ("2026", "2026-07", "2026-07-06"). */
function periodStart(key: string): Date | null {
	const [y, m, d] = key.split("-").map(Number);
	if (!y) return null;
	return new Date(y, (m ?? 1) - 1, d ?? 1);
}

const pct = (part: number, whole: number) =>
	`${whole > 0 ? Math.max(0, Math.min(100, (part / whole) * 100)).toFixed(1) : 0}%`;

export default function ReportPage() {
	const { isAllView, activeSpace } = useSpace();
	const spaceName = isAllView ? "All spaces" : (activeSpace?.name ?? "…");

	const [summary, setSummary] = useState<ReportSummary | null>(null);
	const [transactions, setTransactions] = useState<TransactionDto[]>([]);
	const [status, setStatus] = useState<Status>("loading");

	const [granularity, setGranularity] = useState<Granularity>("monthly");
	const [trends, setTrends] = useState<TrendsDto | null>(null);
	const [trendStatus, setTrendStatus] = useState<Status>("loading");

	const [reloadKey, setReloadKey] = useState(0);
	const reload = useCallback(() => {
		setStatus("loading");
		setTrendStatus("loading");
		setReloadKey((k) => k + 1);
	}, []);

	// Balance + this month's totals, and the ledger for the category split.
	useEffect(() => {
		let cancelled = false;
		Promise.all([getSummary(6), getTransactions()])
			.then(([s, txs]) => {
				if (cancelled) return;
				setSummary(s);
				setTransactions(txs);
				setStatus("ready");
			})
			.catch((error) => {
				if (cancelled) return;
				console.error("Failed to load report summary:", error);
				setStatus("error");
			});
		return () => {
			cancelled = true;
		};
	}, [reloadKey]);

	// Per-period inflow / outflow for the chosen granularity.
	useEffect(() => {
		let cancelled = false;
		setTrendStatus("loading");
		getTrends(6, granularity)
			.then((t) => {
				if (cancelled) return;
				setTrends(t);
				setTrendStatus("ready");
			})
			.catch((error) => {
				if (cancelled) return;
				console.error("Failed to load report trends:", error);
				setTrendStatus("error");
			});
		return () => {
			cancelled = true;
		};
	}, [reloadKey, granularity]);

	const gran = GRANULARITIES.find((g) => g.id === granularity) ?? GRANULARITIES[2]!;
	const periods = useMemo(() => trends?.totalsByMonth ?? [], [trends]);

	const chart = useMemo(() => {
		const max = niceMax(
			Math.max(0, ...periods.map((p) => Math.max(toMajor(p.inflow), toMajor(p.outflow)))),
		);
		const h = (v: bigint) => `${Math.max(1.5, (toMajor(v) / max) * 100).toFixed(1)}%`;
		return {
			axis: [max, max * 0.75, max * 0.5, max * 0.25].map((v) => compact.format(v)),
			bars: periods.map((p) => ({
				key: p.period,
				label: formatPeriod(p.period),
				inH: h(p.inflow),
				outH: h(p.outflow),
				title: `${formatPeriod(p.period)}: in ${formatCurrency(p.inflow)}, out ${formatCurrency(p.outflow)}`,
			})),
		};
	}, [periods]);

	const totals = useMemo(() => {
		const inflow = periods.reduce((s, p) => s + p.inflow, 0n);
		const outflow = periods.reduce((s, p) => s + p.outflow, 0n);
		return { inflow, outflow, net: inflow - outflow };
	}, [periods]);

	// Outflow by category across the same window the chart covers.
	const categories = useMemo(() => {
		const start = periods[0] ? periodStart(periods[0].period) : null;
		if (!start) return { rows: [], total: 0n };
		const byCat = new Map<string, bigint>();
		for (const tx of transactions) {
			if (tx.type !== "outflow" || new Date(tx.date) < start) continue;
			const name = tx.category?.trim() || "Uncategorised";
			byCat.set(name, (byCat.get(name) ?? 0n) + tx.amount);
		}
		const sorted = [...byCat.entries()].sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : 0));
		const top = sorted.slice(0, 4);
		const rest = sorted.slice(4).reduce((s, [, v]) => s + v, 0n);
		if (rest > 0n) top.push(["Other", rest]);
		const total = sorted.reduce((s, [, v]) => s + v, 0n);
		const biggest = top[0] ? toMajor(top[0][1]) : 0;
		return {
			total,
			rows: top.map(([name, amount], i) => ({
				name,
				amount,
				color: CAT_COLORS[i % CAT_COLORS.length]!,
				share: `${Math.round((toMajor(amount) / toMajor(total || 1n)) * 100)}%`,
				w: pct(toMajor(amount), biggest),
			})),
		};
	}, [periods, transactions]);

	const sourceCount = summary?.charts.breakdownSeries[0]?.sources.length ?? 0;
	const monthLabel = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
	const loading = status === "loading";
	const trendsLoading = trendStatus === "loading";

	return (
		<main className="page">
			<div className="page-h">
				<div className="page-h-text">
					<p className="t-over">
						{spaceName} · {monthLabel}
					</p>
					<h1 className="t-h1">Reports</h1>
					<p className="t-muted">See where your money went, and take your records with you.</p>
				</div>
			</div>

			{/* Export actions */}
			<DownloardCards />

			{status === "error" || trendStatus === "error" ? (
				<section className="card">
					<div className="empty" role="alert">
						<p className="card-t">Couldn&rsquo;t load your report.</p>
						<p>Check your connection and try again.</p>
						<button className="btn btn-secondary" type="button" onClick={reload}>
							Try again
						</button>
					</div>
				</section>
			) : (
				<>
					{/* Stats */}
					<div className="g g-stretch">
						<section className="card stat" style={span({ d: 4, t: 4 })}>
							<div className="stat-top">
								<span className="stat-l">Total balance</span>
								<span className="ic-tile">
									<Wallet className="ic" aria-hidden="true" />
								</span>
							</div>
							{loading ? (
								<span className="sk" style={{ height: 29, width: "70%" }} />
							) : (
								<span className="stat-v">{formatCurrency(summary?.totalBalance)}</span>
							)}
							<span className="stat-d">
								{loading
									? "Across all sources"
									: `Across ${sourceCount === 1 ? "1 source" : `all ${sourceCount} sources`}`}
							</span>
						</section>
						<section className="card stat" style={span({ d: 4, t: 4, m: 6 })}>
							<div className="stat-top">
								<span className="stat-l">Inflow</span>
								<span className="ic-tile in">
									<ArrowDownLeft className="ic" aria-hidden="true" />
								</span>
							</div>
							{loading ? (
								<span className="sk" style={{ height: 29, width: "60%" }} />
							) : (
								<span className="stat-v in">+{formatCurrency(summary?.monthly.inflow)}</span>
							)}
							<span className="stat-d">This month</span>
						</section>
						<section className="card stat" style={span({ d: 4, t: 4, m: 6 })}>
							<div className="stat-top">
								<span className="stat-l">Outflow</span>
								<span className="ic-tile out">
									<ArrowUpRight className="ic" aria-hidden="true" />
								</span>
							</div>
							{loading ? (
								<span className="sk" style={{ height: 29, width: "60%" }} />
							) : (
								<span className="stat-v out">−{formatCurrency(summary?.monthly.outflow)}</span>
							)}
							<span className="stat-d">This month</span>
						</section>
					</div>

					{/* Summary */}
					<section className="card stack" aria-label={`${gran.label} summary`}>
						<div className="between wrap">
							<div>
								<h2 className="t-h2">{gran.label} summary</h2>
								<p className="card-s">
									Last {periods.length || 6} {gran.noun} in {spaceName}
								</p>
							</div>
							<div className="seg" role="group" aria-label="Granularity">
								{GRANULARITIES.map((g) => (
									<button
										key={g.id}
										type="button"
										className={`seg-i${g.id === granularity ? " on" : ""}`}
										aria-pressed={g.id === granularity}
										onClick={() => setGranularity(g.id)}>
										{g.label}
									</button>
								))}
							</div>
						</div>

						<div className="g" style={{ gap: 32 }}>
							<div className="chart" style={span({ d: 7, t: 12 })}>
								<div className="between">
									<p className="card-t">Totals per {gran.unit}</p>
									<div className="legend">
										<span>
											<i className="dot" style={{ background: "var(--success)" }} />
											Inflow
										</span>
										<span>
											<i className="dot" style={{ background: "var(--danger)" }} />
											Outflow
										</span>
									</div>
								</div>
								{trendsLoading ? (
									<span className="sk" style={{ height: 264 }} />
								) : (
									<>
										<div
											className="chart-plot"
											style={{ height: 240 }}
											role="img"
											aria-label={`Inflow and outflow per ${gran.unit}. Totals: in ${formatCurrency(totals.inflow)}, out ${formatCurrency(totals.outflow)}.`}>
											<div className="chart-grid" aria-hidden="true">
												{chart.axis.map((v, i) => (
													<span key={i} data-v={v} />
												))}
												<span data-v="0" />
											</div>
											{chart.bars.map((b) => (
												<div key={b.key} className="bar-grp" title={b.title}>
													<span className="bar in" style={{ height: b.inH }} />
													<span className="bar out" style={{ height: b.outH }} />
												</div>
											))}
										</div>
										<div className="chart-x" aria-hidden="true">
											{chart.bars.map((b) => (
												<span key={b.key}>{b.label}</span>
											))}
										</div>
									</>
								)}
							</div>

							<div className="stack-sm" style={span({ d: 5, t: 12 }, { gap: 16 })}>
								<div className="between">
									<p className="card-t">Outflow by category</p>
									{!loading && !trendsLoading && (
										<span className="amt t-sm">{formatCurrency(categories.total)}</span>
									)}
								</div>
								{loading || trendsLoading ? (
									Array.from({ length: 5 }, (_, i) => (
										<div key={i} className="stack-sm" style={{ gap: 6 }}>
											<span className="sk" style={{ height: 16 }} />
											<span className="sk" style={{ height: 6 }} />
										</div>
									))
								) : categories.rows.length === 0 ? (
									<p className="t-sm t-muted">
										No spending recorded in the last {periods.length} {gran.noun}.
									</p>
								) : (
									categories.rows.map((c) => (
										<div key={c.name} className="stack-sm" style={{ gap: 6 }}>
											<div className="cat-row">
												<i className="dot" style={{ background: c.color }} />
												<span className="grow trunc">{c.name}</span>
												<span className="t-muted t-xs">{c.share}</span>
												<span className="amt" style={{ minWidth: 92, textAlign: "right" }}>
													{formatCurrency(c.amount)}
												</span>
											</div>
											<div className="progress progress-thin">
												<span style={{ width: c.w, background: c.color }} />
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</section>

					{/* Period table */}
					<section className="card card-flush" aria-label="Period breakdown">
						<div className="card-h">
							<div>
								<p className="card-t">Period breakdown</p>
								<p className="card-s">Inflow, outflow and net per {gran.unit}</p>
							</div>
						</div>
						<div className="tbl-wrap">
							<table className="tbl">
								<thead>
									<tr>
										<th scope="col">Period</th>
										<th scope="col" className="num">Inflow</th>
										<th scope="col" className="num">Outflow</th>
										<th scope="col" className="num">Net</th>
									</tr>
								</thead>
								<tbody>
									{trendsLoading
										? Array.from({ length: 6 }, (_, i) => (
												<tr key={i}>
													<td colSpan={4}>
														<span className="sk" style={{ height: 18 }} />
													</td>
												</tr>
											))
										: [...periods].reverse().map((p) => {
												const net = p.inflow - p.outflow;
												return (
													<tr key={p.period}>
														<th scope="row" className="t-strong" style={rowHead}>
															{formatPeriod(p.period)}
														</th>
														<td className="num in">{formatCurrency(p.inflow)}</td>
														<td className="num out">{formatCurrency(p.outflow)}</td>
														<td className={`num t-strong ${net >= 0n ? "in" : "out"}`}>
															{signed(net)}
														</td>
													</tr>
												);
											})}
									{!trendsLoading && (
										<tr>
											<th scope="row" className="t-strong" style={{ ...rowHead, ...totalCell }}>
												Total
											</th>
											<td className="num in t-strong" style={totalCell}>
												{formatCurrency(totals.inflow)}
											</td>
											<td className="num out t-strong" style={totalCell}>
												{formatCurrency(totals.outflow)}
											</td>
											<td
												className={`num t-strong ${totals.net >= 0n ? "in" : "out"}`}
												style={totalCell}>
												{signed(totals.net)}
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</section>
				</>
			)}
		</main>
	);
}

// Row headers sit in <th> for screen readers but should look like the canvas's <td>.
const rowHead = {
	textAlign: "left",
	fontSize: 14,
	color: "var(--fg)",
	padding: "12px 16px",
	background: "transparent",
	borderBottom: "1px solid var(--border)",
} as const;
const totalCell = { background: "var(--surface-2)", borderBottom: 0 } as const;
