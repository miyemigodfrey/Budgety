"use client";

import { Link } from "react-router-dom";
import {
	ArrowDownLeft,
	ArrowLeftRight,
	ArrowUpRight,
	Banknote,
	ChevronRight,
	Info,
	Landmark,
	Plus,
	Scale,
	ShoppingCart,
	Smartphone,
	TrendingDown,
	TrendingUp,
	Wallet,
	type LucideIcon,
} from "lucide-react";
import { HeroRings } from "@/components/app/LogoMark";
import { span } from "@/components/app/grid";
import { ErrorState } from "@/components/EmptyState";
import { formatPeriod } from "@/lib/formatPeriod";
import { toMajor } from "@/lib/money";
import type { Granularity, TrendPoint } from "@/api/transaction";
import type { TransactionOverviewDto } from "@/api/overview";
import type { SourceDto } from "@/api/sources";
import type { ShoppingList } from "@/api/shopping";
import {
	MINUS,
	PALETTE,
	compactMinor,
	compactNaira,
	money,
	moneyWhole,
	niceMax,
	relativeDay,
	signedMoney,
} from "./format";

type RecentTx = TransactionOverviewDto["recentTransactions"][number];

/* ------------------------------------------------------------------ */
/* Balance hero                                                        */
/* ------------------------------------------------------------------ */

export function BalanceHero({
	overview,
	sourceCount,
	spaceLabel,
	readOnly,
	onAdd,
}: {
	overview: TransactionOverviewDto;
	sourceCount: number;
	spaceLabel: string;
	readOnly: boolean;
	onAdd: (type?: "transfer") => void;
}) {
	const full = money(overview.totalBalance);
	const dot = full.lastIndexOf(".");
	const whole = dot === -1 ? full : full.slice(0, dot);
	const kobo = dot === -1 ? "" : full.slice(dot);
	const net = overview.monthly.net;
	const Trend = net < 0n ? TrendingDown : TrendingUp;

	return (
		<section className="hero" style={span({ d: 6, t: 12 })} aria-label="Total balance">
			<HeroRings />
			<div className="between" style={{ alignItems: "flex-start" }}>
				<div className="stack-sm" style={{ gap: 8 }}>
					<span className="t-over">Total balance · {spaceLabel}</span>
					<span className="t-display">
						{whole}
						{kobo && <span style={{ fontSize: "0.55em", opacity: 0.75 }}>{kobo}</span>}
					</span>
				</div>
			</div>
			<div className="row-f wrap" style={{ gap: 8 }}>
				<span className="hero-pill">
					<Trend className="ic ic-xs" aria-hidden="true" />
					{signedMoney(net, true)} this month
				</span>
				<span className="hero-pill">
					{sourceCount} {sourceCount === 1 ? "source" : "sources"}
				</span>
			</div>
			<div className="hero-split">
				<div className="hero-cell">
					<small>Opening balance</small>
					<strong>{money(overview.totalInitialBalance)}</strong>
				</div>
				<div className="hero-cell">
					<small>Net this month</small>
					<strong>{signedMoney(net)}</strong>
				</div>
			</div>
			<div className="hero-actions">
				{!readOnly && (
					<>
						<button className="hero-btn solid" type="button" onClick={() => onAdd()}>
							<Plus className="ic ic-sm" aria-hidden="true" />
							Add
						</button>
						<button className="hero-btn" type="button" onClick={() => onAdd("transfer")}>
							<ArrowLeftRight className="ic ic-sm" aria-hidden="true" />
							Transfer
						</button>
					</>
				)}
				<Link className="hero-btn" to="/reconcilation">
					<Scale className="ic ic-sm" aria-hidden="true" />
					Reconcile
				</Link>
			</div>
		</section>
	);
}

/* ------------------------------------------------------------------ */
/* Inflow / outflow stats                                              */
/* ------------------------------------------------------------------ */

function deltaPct(cur: bigint, prev: bigint) {
	if (prev <= 0n) return null;
	return Math.round(((toMajor(cur) - toMajor(prev)) / toMajor(prev)) * 100);
}

export function StatCard({
	kind,
	current,
	previous,
	previousMonth,
}: {
	kind: "in" | "out";
	current: bigint;
	previous: bigint;
	previousMonth: string;
}) {
	const pct = deltaPct(current, previous);
	// More inflow is good; less outflow is good.
	const good = pct == null ? true : kind === "in" ? pct >= 0 : pct <= 0;
	const Icon = kind === "in" ? ArrowDownLeft : ArrowUpRight;
	const value =
		current === 0n
			? moneyWhole(0n)
			: `${kind === "in" ? "+" : MINUS}${moneyWhole(current)}`;

	return (
		<section className="card stat" style={span({ d: 6, m: 6 })}>
			<div className="stat-top">
				<span className="stat-l">{kind === "in" ? "Inflow" : "Outflow"}</span>
				<span className={`ic-tile ${kind}`}>
					<Icon className="ic" aria-hidden="true" />
				</span>
			</div>
			<span className={`stat-v ${kind}`}>{value}</span>
			<span className="stat-d">
				{pct == null ? (
					<span>This month</span>
				) : (
					<>
						<span className={`delta ${good ? "in" : "out"}`}>
							{pct > 0 ? "+" : pct < 0 ? MINUS : ""}
							{Math.abs(pct)}%
						</span>
						<span className="hide-m">vs {previousMonth}</span>
					</>
				)}
			</span>
		</section>
	);
}

/* ------------------------------------------------------------------ */
/* Shopping progress                                                   */
/* ------------------------------------------------------------------ */

export function shoppingSummary(list: ShoppingList) {
	const items = list.items;
	const bought = items.filter((i) => i.bought);
	const line = (qty: number, unit: bigint) => BigInt(qty) * unit;
	const planned = items.reduce((s, i) => s + line(i.plannedQty, i.plannedUnit), 0n);
	const plannedBought = bought.reduce((s, i) => s + line(i.plannedQty, i.plannedUnit), 0n);
	const spent = bought.reduce(
		(s, i) => s + line(i.purchasedQty ?? i.plannedQty, i.purchasedUnit ?? i.plannedUnit),
		0n,
	);
	return {
		total: items.length,
		bought: bought.length,
		planned,
		spent,
		diff: plannedBought - spent,
	};
}

/** Picks the list touched most recently that has items in it. */
export function pickShoppingList(lists: ShoppingList[]) {
	const stamp = (l: ShoppingList) =>
		Math.max(
			new Date(l.updatedAt).getTime(),
			...l.items.map((i) => new Date(i.updatedAt).getTime()),
		);
	return [...lists].filter((l) => l.items.length > 0).sort((a, b) => stamp(b) - stamp(a))[0];
}

export function ShoppingCard({ list }: { list: ShoppingList }) {
	const s = shoppingSummary(list);
	const pct = s.total ? Math.round((s.bought / s.total) * 100) : 0;
	return (
		<section className="card stack-sm" style={span({ d: 12 }, { gap: 12 })} aria-label="Shopping list">
			<div className="between">
				<div className="row-f">
					<span className="ic-tile">
						<ShoppingCart className="ic" aria-hidden="true" />
					</span>
					<div style={{ minWidth: 0 }}>
						<p className="card-t trunc">{list.name}</p>
						<p className="card-s">
							{s.bought} of {s.total} {s.total === 1 ? "item" : "items"} bought
						</p>
					</div>
				</div>
				<Link className="card-link" to="/shopping">
					Open
					<ChevronRight className="ic ic-sm" aria-hidden="true" />
				</Link>
			</div>
			<div
				className="progress"
				role="progressbar"
				aria-label="Items bought"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={pct}>
				<span style={{ width: `${pct}%` }} />
			</div>
			<div className="between t-sm wrap">
				<span className="t-muted">
					Spent{" "}
					<strong className="amt" style={{ color: "var(--fg)" }}>
						{moneyWhole(s.spent)}
					</strong>{" "}
					of {moneyWhole(s.planned)} planned
				</span>
				{s.bought > 0 && s.diff !== 0n && (
					<span className={`badge ${s.diff > 0n ? "in" : "out"}`}>
						{moneyWhole(s.diff > 0n ? s.diff : -s.diff)} {s.diff > 0n ? "under" : "over"}
					</span>
				)}
			</div>
		</section>
	);
}

/* ------------------------------------------------------------------ */
/* Cash-flow chart                                                     */
/* ------------------------------------------------------------------ */

const GRANS: { value: Granularity; label: string; noun: string }[] = [
	{ value: "weekly", label: "Weekly", noun: "weeks" },
	{ value: "biweekly", label: "Bi-weekly", noun: "periods" },
	{ value: "monthly", label: "Monthly", noun: "months" },
	{ value: "yearly", label: "Yearly", noun: "years" },
];

export function CashFlowCard({
	granularity,
	onGranularity,
	series,
	error,
	onRetry,
}: {
	granularity: Granularity;
	onGranularity: (g: Granularity) => void;
	/** undefined while loading */
	series: TrendPoint[] | undefined;
	error: boolean;
	onRetry: () => void;
}) {
	const gran = GRANS.find((g) => g.value === granularity) ?? GRANS[2]!;
	const points = (series ?? []).map((p) => ({
		label: formatPeriod(p.period),
		inflow: toMajor(p.inflow),
		outflow: toMajor(p.outflow),
	}));
	const max = niceMax(Math.max(0, ...points.flatMap((p) => [p.inflow, p.outflow])));
	const h = (v: number) => `${Math.max(1.5, (v / max) * 100).toFixed(1)}%`;
	const ticks = [1, 0.75, 0.5, 0.25].map((f) => compactNaira(max * f));

	return (
		<section
			className="card chart"
			style={span({ d: 8, t: 12, mo: 5 })}
			aria-label="Cash flow chart">
			<div className="card-h" style={{ marginBottom: 4, flexWrap: "wrap" }}>
				<div>
					<p className="card-t">Cash flow</p>
					<p className="card-s">
						Inflow vs outflow ·{" "}
						{points.length ? `last ${points.length} ${gran.noun}` : gran.label.toLowerCase()}
					</p>
				</div>
				<div className="seg" role="group" aria-label="Granularity">
					{GRANS.map((g) => (
						<button
							key={g.value}
							type="button"
							className={`seg-i${g.value === granularity ? " on" : ""}`}
							aria-pressed={g.value === granularity}
							onClick={() => onGranularity(g.value)}>
							{g.label}
						</button>
					))}
				</div>
			</div>
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
			{error ? (
				<ErrorState message="Couldn't load the chart." onRetry={onRetry} />
			) : series === undefined ? (
				<span className="sk" style={{ height: 250 }} />
			) : (
				<>
					<div className="chart-plot">
						<div className="chart-grid" aria-hidden="true">
							{ticks.map((t, i) => (
								<span key={i} data-v={t} />
							))}
							<span data-v="0" />
						</div>
						{points.map((p, i) => {
							const title = `${p.label}: in ${compactNaira(p.inflow)}, out ${compactNaira(p.outflow)}`;
							return (
								<div key={i} className="bar-grp" title={title} role="img" aria-label={title}>
									<span className="bar in" style={{ height: h(p.inflow) }} />
									<span className="bar out" style={{ height: h(p.outflow) }} />
								</div>
							);
						})}
					</div>
					<div className="chart-x" aria-hidden="true">
						{points.map((p, i) => (
							<span key={i} className="trunc">
								{p.label}
							</span>
						))}
					</div>
				</>
			)}
		</section>
	);
}

/* ------------------------------------------------------------------ */
/* Spending by category                                                */
/* ------------------------------------------------------------------ */

export type CategorySlice = { name: string; amount: bigint };

export function CategoryCard({
	slices,
	total,
	monthLabel,
}: {
	slices: CategorySlice[];
	total: bigint;
	monthLabel: string;
}) {
	const totalMajor = toMajor(total);
	let acc = 0;
	const cats = slices.map((c, i) => {
		const pct = totalMajor > 0 ? (toMajor(c.amount) / totalMajor) * 100 : 0;
		const item = {
			...c,
			color: PALETTE[i % PALETTE.length]!,
			pct: `${Math.round(pct)}%`,
			dash: `${Math.max(0.1, pct - 0.8).toFixed(2)} ${(100 - pct + 0.8).toFixed(2)}`,
			offset: (-acc).toFixed(2),
		};
		acc += pct;
		return item;
	});

	return (
		<section className="card" style={span({ d: 4, t: 12, mo: 6 })} aria-label="Spending by category">
			<div className="card-h">
				<div>
					<p className="card-t">Spending by category</p>
					<p className="card-s">{monthLabel} · outflow</p>
				</div>
				<Link className="card-link" to="/report">
					Report
				</Link>
			</div>
			{cats.length === 0 ? (
				<div className="empty" style={{ padding: "24px 8px" }}>
					<span className="empty-ic">
						<ArrowUpRight className="ic ic-lg" aria-hidden="true" />
					</span>
					<h3 className="t-h3">No spending this month</h3>
					<p>Outflows you record in {monthLabel} are grouped by category here.</p>
				</div>
			) : (
				<div className="donut-wrap" style={{ flexDirection: "column", alignItems: "stretch" }}>
					<div className="donut" style={{ alignSelf: "center" }}>
						<svg viewBox="0 0 36 36" aria-hidden="true">
							{cats.map((c) => (
								<circle
									key={c.name}
									cx="18"
									cy="18"
									r="15.9155"
									fill="none"
									style={{ stroke: c.color }}
									strokeWidth="4.2"
									strokeDasharray={c.dash}
									strokeDashoffset={c.offset}
								/>
							))}
						</svg>
						<div className="donut-c">
							<span className="t-xs t-muted">Spent</span>
							<span className="amt" style={{ fontSize: 17 }}>
								{moneyWhole(total)}
							</span>
						</div>
					</div>
					<div className="cat-list">
						{cats.map((c) => (
							<div key={c.name} className="cat-row">
								<i className="dot" style={{ background: c.color }} />
								<span className="grow trunc">{c.name}</span>
								<span className="t-muted t-xs">{c.pct}</span>
								<span className="amt" style={{ minWidth: 76, textAlign: "right" }}>
									{moneyWhole(c.amount)}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</section>
	);
}

/* ------------------------------------------------------------------ */
/* Recent transactions                                                 */
/* ------------------------------------------------------------------ */

const KIND = { inflow: "in", outflow: "out", transfer: "tr" } as const;
const KIND_ICON: Record<"in" | "out" | "tr", LucideIcon> = {
	in: ArrowDownLeft,
	out: ArrowUpRight,
	tr: ArrowLeftRight,
};
const KIND_LABEL = { in: "Inflow", out: "Outflow", tr: "Transfer" } as const;

export function TxRow({ tx }: { tx: RecentTx }) {
	const kind = KIND[tx.type];
	const Icon = KIND_ICON[kind];
	const isTr = kind === "tr";
	const title = isTr ? tx.sourceName : tx.category || KIND_LABEL[kind];
	const amount =
		kind === "in" ? `+${money(tx.amount)}` : kind === "out" ? `${MINUS}${money(tx.amount)}` : money(tx.amount);
	return (
		<li className="li">
			<span className={`li-ic ${kind}`}>
				<Icon className="ic" aria-hidden="true" />
			</span>
			<div className="li-main">
				<span className="li-t">
					<span className="trunc">{title}</span>
					{isTr && (
						<span className="t-muted" style={{ fontWeight: 500, whiteSpace: "nowrap" }}>
							→ {tx.transferTargetName ?? "Unknown"}
						</span>
					)}
				</span>
				<span className="li-s">
					<span>{isTr ? "Transfer" : tx.sourceName}</span>
					<span aria-hidden="true">·</span>
					<span>{relativeDay(tx.date)}</span>
					{tx.note && <span className="hide-m">· {tx.note}</span>}
				</span>
			</div>
			<div className="li-end">
				<span className={`amt ${kind}`}>{amount}</span>
				<span className={`badge ${kind} hide-m`}>{KIND_LABEL[kind]}</span>
			</div>
		</li>
	);
}

export function RecentCard({
	txs,
	spaceLabel,
	isAllView,
}: {
	txs: RecentTx[];
	spaceLabel: string;
	isAllView: boolean;
}) {
	return (
		<section className="card card-flush" style={span({ d: 7, t: 12, mo: 3 })} aria-label="Recent transactions">
			<div className="card-h">
				<div>
					<p className="card-t">Recent transactions</p>
					<p className="card-s">
						{isAllView ? "Across all spaces" : `Across all sources in ${spaceLabel}`}
					</p>
				</div>
				<Link className="card-link" to="/transaction">
					View all
					<ChevronRight className="ic ic-sm" aria-hidden="true" />
				</Link>
			</div>
			<ul className="list">
				{txs.map((t) => (
					<TxRow key={t.id} tx={t} />
				))}
			</ul>
		</section>
	);
}

/* ------------------------------------------------------------------ */
/* Sources                                                             */
/* ------------------------------------------------------------------ */

export function sourceIcon(name: string): LucideIcon {
	if (/cash/i.test(name)) return Banknote;
	if (/bank|gtb|zenith|uba|access|fidelity|first|wema|stanbic|sterling/i.test(name)) return Landmark;
	if (/opay|kuda|palm|moniepoint|wallet|chipper|paga/i.test(name)) return Smartphone;
	return Wallet;
}

export function daysAgoLabel(at: Date | null | undefined) {
	if (at === undefined) return null;
	if (at === null) return "No balances reconciled yet";
	const days = Math.floor((Date.now() - new Date(at).getTime()) / 86400000);
	if (days <= 0) return "Last reconciled today";
	if (days === 1) return "Last reconciled yesterday";
	return `Last reconciled ${days} days ago`;
}

export function SourcesCard({
	sources,
	totalBalance,
	lastReconciled,
	style,
}: {
	sources: SourceDto[];
	totalBalance: bigint;
	/** undefined = unknown, null = never */
	lastReconciled?: Date | null;
	style?: React.CSSProperties;
}) {
	const shares = sources.map((s, i) => ({
		s,
		color: PALETTE[i % PALETTE.length]!,
		share: Math.max(0, toMajor(s.balance)),
	}));
	const anyShare = shares.some((x) => x.share > 0);
	const reconciled = daysAgoLabel(lastReconciled);

	return (
		<section className="card card-flush" style={style ?? span({ d: 5, t: 12, mo: 4 })} aria-label="Sources">
			<div className="card-h">
				<div>
					<p className="card-t">Sources</p>
					<p className="card-s">Where your {compactMinor(totalBalance)} sits</p>
				</div>
				<Link className="card-link" to="/source">
					Manage
					<ChevronRight className="ic ic-sm" aria-hidden="true" />
				</Link>
			</div>
			<div style={{ padding: "8px 20px 6px" }}>
				<div className="share" aria-hidden="true">
					{anyShare ? (
						shares
							.filter((x) => x.share > 0)
							.map((x) => <span key={x.s.id} style={{ flex: x.share, background: x.color }} />)
					) : (
						<span style={{ flex: 1, background: "var(--sunken)" }} />
					)}
				</div>
			</div>
			<ul className="list">
				{shares.map(({ s, color }) => {
					const Icon = sourceIcon(s.name);
					const change = s.balance - s.initialBalance;
					return (
						<li key={s.id} className="li">
							<span className="li-ic" style={{ color }}>
								<Icon className="ic" aria-hidden="true" />
							</span>
							<div className="li-main">
								<Link className="li-t" to={`/sources/${s.id}`}>
									<span className="trunc">{s.name}</span>
								</Link>
								<span className="li-s">Opened at {moneyWhole(s.initialBalance)}</span>
							</div>
							<div className="li-end">
								<span className="amt">{money(s.balance)}</span>
								{change !== 0n && (
									<span className={`t-xs ${change > 0n ? "in" : "out"}`} style={{ fontWeight: 650 }}>
										{signedMoney(change, true)}
									</span>
								)}
							</div>
						</li>
					);
				})}
			</ul>
			<div className="card-foot">
				<span className="row-f t-sm t-muted">
					<Info className="ic ic-sm" aria-hidden="true" />
					{reconciled ?? "Check your balances against the real figures"}
				</span>
				<Link className="card-link" to="/reconcilation">
					Reconcile
				</Link>
			</div>
		</section>
	);
}

/* ------------------------------------------------------------------ */
/* Loading skeleton                                                    */
/* ------------------------------------------------------------------ */

export function DashboardSkeleton() {
	return (
		<main className="page" aria-busy="true" aria-label="Loading your dashboard">
			<div className="page-h">
				<div className="page-h-text" style={{ gap: 8 }}>
					<span className="sk" style={{ height: 12, width: 140 }} />
					<span className="sk" style={{ height: 28, width: 260 }} />
					<span className="sk" style={{ height: 14, width: 300 }} />
				</div>
			</div>
			<div className="g g-stretch">
				<span className="sk" style={span({ d: 6, t: 12 }, { height: 300, borderRadius: "var(--r-xl)" })} />
				<div style={span({ d: 6, t: 12 })}>
					<div className="g g-stretch">
						<span className="sk" style={span({ d: 6, m: 6 }, { height: 140, borderRadius: "var(--r-lg)" })} />
						<span className="sk" style={span({ d: 6, m: 6 }, { height: 140, borderRadius: "var(--r-lg)" })} />
						<span className="sk" style={span({ d: 12 }, { height: 140, borderRadius: "var(--r-lg)" })} />
					</div>
				</div>
				<span className="sk" style={span({ d: 8, t: 12 }, { height: 340, borderRadius: "var(--r-lg)" })} />
				<span className="sk" style={span({ d: 4, t: 12 }, { height: 340, borderRadius: "var(--r-lg)" })} />
				<span className="sk" style={span({ d: 7, t: 12 }, { height: 420, borderRadius: "var(--r-lg)" })} />
				<span className="sk" style={span({ d: 5, t: 12 }, { height: 420, borderRadius: "var(--r-lg)" })} />
			</div>
		</main>
	);
}
