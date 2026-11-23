"use client";

import "./transactions.css";
import Link from "next/link";
import {
	AlertTriangle,
	ArrowDownLeft,
	ArrowLeftRight,
	ArrowUpDown,
	ArrowUpRight,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Database,
	Funnel,
	Pencil,
	Plus,
	Scale,
	Search,
	Wallet,
	type LucideIcon,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import EditTransactionModal from "./EditTransactionModal";
import { span } from "@/components/app/grid";
import { useQuickAdd } from "@/components/app/QuickAdd";
import { useSpace } from "@/hooks/useSpace";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatPeriod } from "@/lib/formatPeriod";
import { toMajor } from "@/lib/money";
import type { Status } from "@/lib/status";

import {
	getTransactions,
	type Granularity,
	type TransactionDto,
} from "@/api/transaction";
import {
	getTransactionOverview,
	type TransactionOverviewDto,
} from "@/api/overview";
import { getSources, type SourceDto } from "@/api/sources";
import { getSummary, type ReportSummary } from "@/api/export";

type TypeFilter = "all" | "inflow" | "outflow" | "transfer";
type Kind = "in" | "out" | "tr";

const PAGE_SIZE = 10;

const TYPE_CHIPS: { id: TypeFilter; label: string }[] = [
	{ id: "all", label: "All" },
	{ id: "inflow", label: "Inflow" },
	{ id: "outflow", label: "Outflow" },
	{ id: "transfer", label: "Transfer" },
];

const GRANULARITIES: { id: Granularity; label: string; noun: string }[] = [
	{ id: "weekly", label: "Weekly", noun: "week" },
	{ id: "biweekly", label: "Bi-weekly", noun: "fortnight" },
	{ id: "monthly", label: "Monthly", noun: "month" },
	{ id: "yearly", label: "Yearly", noun: "year" },
];

const KIND: Record<string, { kind: Kind; icon: LucideIcon; label: string; sign: string }> = {
	inflow: { kind: "in", icon: ArrowDownLeft, label: "Inflow", sign: "+" },
	outflow: { kind: "out", icon: ArrowUpRight, label: "Outflow", sign: "−" },
	transfer: { kind: "tr", icon: ArrowLeftRight, label: "Transfer", sign: "" },
};
const kindOf = (type: string) => KIND[type] ?? KIND.outflow!;

/** Whole naira without ".00" (stat tiles), kobo kept when there is some. */
const money = (minor: bigint | undefined) => {
	const major = minor == null ? 0 : toMajor(minor);
	const whole = Number.isInteger(major);
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: whole ? 0 : 2,
		maximumFractionDigits: 2,
	}).format(major);
};

const compactMoney = (major: number) =>
	new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(major);

const signed = (minor: bigint, sign: string) =>
	sign + formatCurrency(minor < 0n ? -minor : minor);

/** Local calendar day key, so rows group by the day the user sees. */
const dayKey = (value: Date | string) => {
	const d = new Date(value);
	return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const dayLabel = (value: Date | string) => {
	const d = new Date(value);
	const now = new Date();
	const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
	const label = d.toLocaleDateString("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		...(d.getFullYear() !== now.getFullYear() && { year: "numeric" }),
	});
	if (dayKey(d) === dayKey(now)) return `Today · ${label}`;
	if (dayKey(d) === dayKey(yesterday)) return `Yesterday · ${label}`;
	return label;
};

/** A round axis ceiling ≥ v: 1, 2, 2.5, 5 or 10 × a power of ten. */
const niceCeil = (v: number) => {
	if (v <= 0) return 1;
	const mag = 10 ** Math.floor(Math.log10(v));
	const step = [1, 2, 2.5, 5, 10].find((s) => s * mag >= v) ?? 10;
	return step * mag;
};

function TransactionPage() {
	const { isAllView, activeSpace } = useSpace();
	const { openAddTransaction } = useQuickAdd();

	const [transactions, setTransaction] = useState<TransactionDto[]>([]);
	const [sources, setSources] = useState<SourceDto[]>([]);
	const [transactionOverview, setTransactionOverview] =
		useState<TransactionOverviewDto | null>(null);
	const [summary, setSummary] = useState<ReportSummary | null>(null);
	const [status, setStatus] = useState<Status>("loading");
	const [editing, setEditing] = useState<TransactionDto | null>(null);
	const [editOpen, setEditOpen] = useState(false);
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	const [granularity, setGranularity] = useState<Granularity>("monthly");
	const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
	const [sourceFilter, setSourceFilter] = useState("all");
	const [query, setQuery] = useState("");
	const [page, setPage] = useState(1);
	const [reloadKey, setReloadKey] = useState(0);

	const reload = useCallback(() => {
		setStatus("loading");
		setReloadKey((k) => k + 1);
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function fetchData() {
			try {
				const [transactionData, sourceData, transactionOverviewData] =
					await Promise.all([
						getTransactions(),
						getSources(),
						getTransactionOverview(),
					]);
				if (cancelled) return;
				setTransaction(transactionData);
				setSources(sourceData);
				setTransactionOverview(transactionOverviewData);
				setStatus("ready");
			} catch (error) {
				if (cancelled) return;
				console.error("Failed to fetch data:", error);
				setStatus("error");
			}
		}

		fetchData();
		return () => {
			cancelled = true;
		};
	}, [reloadKey]);

	// The chart refetches on its own when the granularity changes, so toggling
	// it doesn't reload the whole transaction list.
	useEffect(() => {
		let cancelled = false;
		getSummary(6, granularity)
			.then((data) => !cancelled && setSummary(data))
			.catch((e) => console.error("Failed to load chart summary:", e));
		return () => {
			cancelled = true;
		};
	}, [granularity, reloadKey]);

	const sourceName = useMemo(() => {
		const byId = new Map(sources.map((s) => [s.id, s.name]));
		return (id: string | null | undefined) => (id ? byId.get(id) : undefined);
	}, [sources]);

	const filtersOn = typeFilter !== "all" || sourceFilter !== "all" || query.trim() !== "";

	// Filter, then sort by transaction date with when-it-was-added as the
	// same-day tie-break.
	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return transactions
			.filter((t) => typeFilter === "all" || t.type === typeFilter)
			.filter(
				(t) =>
					sourceFilter === "all" ||
					t.sourceId === sourceFilter ||
					t.transferTargetId === sourceFilter,
			)
			.filter((t) => {
				if (!q) return true;
				return [t.category, t.note, sourceName(t.sourceId), sourceName(t.transferTargetId)]
					.filter(Boolean)
					.some((s) => s!.toLowerCase().includes(q));
			})
			.sort((a, b) => {
				const byDate = new Date(a.date).getTime() - new Date(b.date).getTime();
				const key =
					byDate !== 0
						? byDate
						: new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				return sortDir === "desc" ? -key : key;
			});
	}, [transactions, typeFilter, sourceFilter, query, sortDir, sourceName]);

	// Reset to the first page when the ordering, filters or data change.
	useEffect(() => {
		setPage(1);
	}, [sortDir, typeFilter, sourceFilter, query, transactions.length]);

	const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const currentPage = Math.min(page, pageCount);
	const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

	// Day net over every filtered row of that day, so a day split across two
	// pages still shows its full net.
	const dayNets = useMemo(() => {
		const nets = new Map<string, { net: bigint; onlyTransfers: boolean }>();
		for (const t of filtered) {
			const k = dayKey(t.date);
			const n = nets.get(k) ?? { net: 0n, onlyTransfers: true };
			if (t.type !== "transfer") {
				n.onlyTransfers = false;
				n.net += t.type === "inflow" ? t.amount : -t.amount;
			}
			nets.set(k, n);
		}
		return nets;
	}, [filtered]);

	const groups = useMemo(() => {
		const out: { key: string; label: string; rows: TransactionDto[] }[] = [];
		for (const t of paged) {
			const k = dayKey(t.date);
			let g = out[out.length - 1];
			if (!g || g.key !== k) {
				g = { key: k, label: dayLabel(t.date), rows: [] };
				out.push(g);
			}
			g.rows.push(t);
		}
		return out;
	}, [paged]);

	const clearFilters = () => {
		setTypeFilter("all");
		setSourceFilter("all");
		setQuery("");
	};

	const openEdit = (t: TransactionDto) => {
		setEditing(t);
		setEditOpen(true);
	};

	const loading = status === "loading";
	const overview = status === "ready" ? transactionOverview : null;
	const sinceOpening =
		overview != null ? overview.totalBalance - overview.totalInitialBalance : 0n;
	const spaceName = activeSpace?.name ?? "this space";
	const monthLabel = new Date().toLocaleDateString("en-GB", {
		month: "long",
		year: "numeric",
	});

	const footer =
		`Page ${currentPage} of ${pageCount} · ` +
		(filtersOn
			? `${filtered.length} shown · filtered from ${transactions.length}`
			: `${transactions.length} total`);

	const statValue = (value: ReactNode) =>
		loading ? <span className="sk" style={{ height: 30, width: "70%" }} /> : value;

	const rowView = (t: TransactionDto) => {
		const k = kindOf(t.type);
		const isTransfer = t.type === "transfer";
		const source = sourceName(t.sourceId) ?? "Unknown source";
		const target = isTransfer ? (sourceName(t.transferTargetId) ?? "Unknown") : undefined;
		const title = isTransfer ? source : t.category;
		const sub = t.note || (isTransfer ? t.category : "");
		return {
			k,
			source,
			title,
			to: target ? `→ ${target}` : "",
			sub,
			mobileSub: [source, t.note].filter(Boolean).join(" · "),
			amount: signed(t.amount, k.sign),
		};
	};

	return (
		<main className="page">
			<div className="page-h">
				<div className="page-h-text">
					<p className="t-over">{monthLabel}</p>
					<h1 className="t-h1">Transactions</h1>
					<p className="t-muted">
						{isAllView ? (
							<>
								Every inflow, outflow and transfer across{" "}
								<strong className="t-fg2">all spaces</strong>.
							</>
						) : (
							<>
								Every inflow, outflow and transfer in{" "}
								<strong className="t-fg2">{spaceName}</strong>.
							</>
						)}
					</p>
				</div>
				<div className="page-h-actions">
					<Link className="btn btn-soft" href="/reconcilation">
						<Scale className="ic ic-sm" />
						Reconcile
					</Link>
				</div>
			</div>

			{/* Summary strip */}
			<div className="g g-stretch">
				<section className="card stat" style={span({ d: 3, t: 6, m: 6 })}>
					<div className="stat-top">
						<span className="stat-l">Total balance</span>
						<span className="ic-tile">
							<Wallet className="ic" />
						</span>
					</div>
					{statValue(
						<span className="stat-v trunc" title={money(overview?.totalBalance)}>
							{overview ? money(overview.totalBalance) : "—"}
						</span>,
					)}
					<span className="stat-d">
						Across {sources.length} source{sources.length === 1 ? "" : "s"}
					</span>
				</section>
				<section className="card stat" style={span({ d: 3, t: 6, m: 6 })}>
					<div className="stat-top">
						<span className="stat-l">Inflow</span>
						<span className="ic-tile in">
							<ArrowDownLeft className="ic" />
						</span>
					</div>
					{statValue(
						<span className="stat-v in trunc">
							{overview ? `+${money(overview.monthly.inflow)}` : "—"}
						</span>,
					)}
					<span className="stat-d">This month</span>
				</section>
				<section className="card stat" style={span({ d: 3, t: 6, m: 6 })}>
					<div className="stat-top">
						<span className="stat-l">Outflow</span>
						<span className="ic-tile out">
							<ArrowUpRight className="ic" />
						</span>
					</div>
					{statValue(
						<span className="stat-v out trunc">
							{overview ? `−${money(overview.monthly.outflow)}` : "—"}
						</span>,
					)}
					<span className="stat-d">This month</span>
				</section>
				<section className="card stat" style={span({ d: 3, t: 6, m: 6 })}>
					<div className="stat-top">
						<span className="stat-l">Opening balance</span>
						<span className="ic-tile neutral">
							<Database className="ic" />
						</span>
					</div>
					{statValue(
						<span className="stat-v trunc">
							{overview ? money(overview.totalInitialBalance) : "—"}
						</span>,
					)}
					<span className="stat-d">
						{overview && (
							<>
								<span className={`delta ${sinceOpening < 0n ? "out" : "in"}`}>
									{sinceOpening < 0n ? "−" : "+"}
									{money(sinceOpening < 0n ? -sinceOpening : sinceOpening)}
								</span>
								<span className="hide-m">since opening</span>
							</>
						)}
					</span>
				</section>
			</div>

			<div className="g">
				{/* Ledger */}
				<section
					className="card card-flush"
					style={span({ d: 8, t: 12 })}
					aria-label="Transaction list">
					<div className="tx-filters">
						<div className="row-f wrap" style={{ gap: 10 }}>
							<div className="control grow" style={{ minWidth: 220 }}>
								<Search className="ic ic-sm" />
								<input
									className="input has-ic"
									type="search"
									placeholder="Search category or note"
									aria-label="Search transactions"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
								/>
							</div>
							<div className="control" style={{ width: 170 }}>
								<select
									className="input select"
									aria-label="Filter by source"
									value={sourceFilter}
									onChange={(e) => setSourceFilter(e.target.value)}>
									<option value="all">All sources</option>
									{sources.map((s) => (
										<option key={s.id} value={s.id}>
											{s.name}
										</option>
									))}
								</select>
								<ChevronDown className="ic ic-sm ic-end" />
							</div>
							<button
								className="btn btn-secondary"
								type="button"
								onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
								aria-label={`Sort by date, currently ${sortDir === "desc" ? "newest" : "oldest"} first`}>
								<ArrowUpDown className="ic ic-sm" />
								{sortDir === "desc" ? "Newest first" : "Oldest first"}
							</button>
						</div>
						<div
							className="row-f"
							style={{ gap: 8, overflowX: "auto" }}
							role="group"
							aria-label="Filter by type">
							{TYPE_CHIPS.map((c) => (
								<button
									key={c.id}
									className={`chip${typeFilter === c.id ? " on" : ""}`}
									type="button"
									aria-pressed={typeFilter === c.id}
									onClick={() => setTypeFilter(c.id)}>
									{c.label}
								</button>
							))}
						</div>
					</div>

					{loading && (
						<div className="list" aria-busy="true" aria-label="Loading transactions">
							{[0, 1, 2, 3, 4].map((i) => (
								<div className="li" key={i}>
									<span className="sk" style={{ width: 40, height: 40, borderRadius: 12 }} />
									<div className="li-main">
										<span className="sk" style={{ height: 14, width: "45%" }} />
										<span className="sk" style={{ height: 12, width: "30%" }} />
									</div>
									<span className="sk" style={{ height: 14, width: 80 }} />
								</div>
							))}
						</div>
					)}

					{status === "error" && (
						<div className="empty" role="alert">
							<span
								className="empty-ic"
								style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
								<AlertTriangle className="ic ic-lg" />
							</span>
							<p className="t-h3" style={{ color: "var(--fg)" }}>
								Couldn&apos;t load your transactions
							</p>
							<p>Check your connection and try again.</p>
							<button className="btn btn-secondary btn-sm" type="button" onClick={reload}>
								Try again
							</button>
						</div>
					)}

					{status === "ready" && transactions.length === 0 && (
						<div className="empty">
							<span className="empty-ic">
								<Wallet className="ic ic-lg" />
							</span>
							<p className="t-h3" style={{ color: "var(--fg)" }}>
								No transactions yet
							</p>
							<p>
								{isAllView
									? "Open a space to record an inflow, outflow or transfer."
									: "Record an inflow, outflow or transfer and it'll show up here."}
							</p>
							{!isAllView && (
								<button
									className="btn btn-primary btn-sm"
									type="button"
									onClick={openAddTransaction}>
									<Plus className="ic ic-sm" />
									Add transaction
								</button>
							)}
						</div>
					)}

					{status === "ready" && transactions.length > 0 && groups.length > 0 && (
						<>
							{/* Desktop / tablet: column layout */}
							<div className="hide-m" style={{ display: "flex", flexDirection: "column" }}>
								<div className="tx-cols tx-head">
									<span className="t-xs t-muted t-strong">Details</span>
									<span className="t-xs t-muted t-strong">Source</span>
									<span className="t-xs t-muted t-strong">Type</span>
									<span className="t-xs t-muted t-strong t-right">Amount</span>
									<span />
								</div>
								{groups.map((g) => {
									const n = dayNets.get(g.key);
									return (
										<Fragment key={g.key}>
											<DayHeader label={g.label} net={n} />
											{g.rows.map((t) => {
												const r = rowView(t);
												const Icon = r.k.icon;
												return (
													<div className="tx-cols" key={t.id}>
														<div className="row-f" style={{ gap: 12 }}>
															<span className={`li-ic ${r.k.kind}`}>
																<Icon className="ic" />
															</span>
															<div className="li-main">
																<span className="li-t">
																	<span className="trunc">{r.title}</span>
																	{r.to && (
																		<span
																			className="t-muted"
																			style={{ fontWeight: 500, whiteSpace: "nowrap" }}>
																			{r.to}
																		</span>
																	)}
																</span>
																{r.sub && (
																	<span className="li-s">
																		<span className="trunc">{r.sub}</span>
																	</span>
																)}
															</div>
														</div>
														<span className="t-sm t-fg2 trunc">{r.source}</span>
														<span>
															<span className={`badge ${r.k.kind}`}>{r.k.label}</span>
														</span>
														<span className={`amt t-right ${r.k.kind}`}>{r.amount}</span>
														{isAllView ? (
															<span />
														) : (
															<button
																className="btn btn-ghost btn-icon btn-sm"
																type="button"
																aria-label={`Edit ${r.title} transaction`}
																onClick={() => openEdit(t)}>
																<Pencil className="ic ic-sm" />
															</button>
														)}
													</div>
												);
											})}
										</Fragment>
									);
								})}
							</div>

							{/* Mobile: compact rows, tap a row to edit */}
							<div className="show-m" style={{ flexDirection: "column" }}>
								{groups.map((g) => (
									<Fragment key={g.key}>
										<DayHeader label={g.label} net={dayNets.get(g.key)} />
										<ul className="list tx-list">
											{g.rows.map((t) => {
												const r = rowView(t);
												const Icon = r.k.icon;
												const body = (
													<>
														<span className={`li-ic ${r.k.kind}`}>
															<Icon className="ic" />
														</span>
														<div className="li-main">
															<span className="li-t">
																<span className="trunc">{r.title}</span>
																{r.to && (
																	<span
																		className="t-muted"
																		style={{ fontWeight: 500, whiteSpace: "nowrap" }}>
																		{r.to}
																	</span>
																)}
															</span>
															<span className="li-s">
																<span className="trunc">{r.mobileSub}</span>
															</span>
														</div>
														<div className="li-end">
															<span className={`amt ${r.k.kind}`}>{r.amount}</span>
														</div>
													</>
												);
												return (
													<li key={t.id}>
														{isAllView ? (
															<div className="li">{body}</div>
														) : (
															<button
																type="button"
																className="li tx-tap"
																aria-label={`${r.title}${r.to ? ` ${r.to}` : ""}, ${r.amount}. Edit`}
																onClick={() => openEdit(t)}>
																{body}
															</button>
														)}
													</li>
												);
											})}
										</ul>
									</Fragment>
								))}
							</div>

							<div className="card-foot">
								<span className="t-sm t-muted">{footer}</span>
								<div className="row-f" style={{ gap: 6 }}>
									<button
										className="btn btn-secondary btn-icon btn-sm"
										type="button"
										aria-label="Previous page"
										disabled={currentPage <= 1}
										onClick={() => setPage((p) => Math.max(1, p - 1))}>
										<ChevronLeft className="ic ic-sm" />
									</button>
									<button
										className="btn btn-secondary btn-icon btn-sm"
										type="button"
										aria-label="Next page"
										disabled={currentPage >= pageCount}
										onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
										<ChevronRight className="ic ic-sm" />
									</button>
								</div>
							</div>
						</>
					)}

					{status === "ready" && transactions.length > 0 && groups.length === 0 && (
						<div className="empty">
							<span className="empty-ic">
								<Funnel className="ic ic-lg" />
							</span>
							<p className="t-h3" style={{ color: "var(--fg)" }}>
								No transactions match
							</p>
							<p>Try another search, type or source, or clear the filters to see everything.</p>
							<button className="btn btn-secondary btn-sm" type="button" onClick={clearFilters}>
								Clear filters
							</button>
						</div>
					)}
				</section>

				{/* Side column */}
				<div className="stack" style={span({ d: 4, t: 12 })}>
					<MoneyMovedChart
						summary={summary}
						granularity={granularity}
						onGranularity={setGranularity}
					/>

					<section className="card stack-sm" style={{ gap: 12 }}>
						<div className="row-f" style={{ alignItems: "flex-start", gap: 12 }}>
							<span className="ic-tile">
								<Scale className="ic" />
							</span>
							<div className="grow">
								<p className="card-t">Do the numbers match?</p>
								<p className="t-sm t-muted" style={{ marginTop: 2 }}>
									Count your cash or open your bank app and compare it with what
									Budgety expects.
								</p>
							</div>
						</div>
						<Link className="btn btn-secondary btn-block" href="/reconcilation">
							Reconcile a source
							<ChevronRight className="ic ic-sm" />
						</Link>
					</section>
				</div>
			</div>

			<EditTransactionModal
				transaction={editing}
				open={editOpen}
				setOpen={setEditOpen}
				onUpdated={reload}
			/>
		</main>
	);
}

function DayHeader({
	label,
	net,
}: {
	label: string;
	net?: { net: bigint; onlyTransfers: boolean };
}) {
	const text = !net
		? ""
		: net.onlyTransfers
			? "Transfers only"
			: signed(net.net, net.net < 0n ? "−" : "+");
	const cls = !net || net.onlyTransfers ? "t-muted" : net.net < 0n ? "out" : "in";
	return (
		<div className="day">
			<span>{label}</span>
			<span className={`amt ${cls}`}>{text}</span>
		</div>
	);
}

function MoneyMovedChart({
	summary,
	granularity,
	onGranularity,
}: {
	summary: ReportSummary | null;
	granularity: Granularity;
	onGranularity: (g: Granularity) => void;
}) {
	const gran = GRANULARITIES.find((g) => g.id === granularity) ?? GRANULARITIES[2]!;
	const series = (summary?.charts.totalTransactionsSeries ?? []).map((p) => ({
		label: formatPeriod(p.period),
		value: toMajor(p.total),
	}));
	const last = series[series.length - 1];
	const max = niceCeil(Math.max(0, ...series.map((s) => s.value)));
	const hasData = series.some((s) => s.value > 0);
	const sub = last
		? granularity === "weekly" || granularity === "biweekly"
			? `moved since ${last.label}`
			: `moved in ${last.label}`
		: "";

	return (
		<section className="card chart" aria-label="Totals chart">
			<div>
				<p className="card-t">Money moved</p>
				<p className="card-s">Total of all transactions per {gran.noun}</p>
			</div>
			<div className="row-f" style={{ alignItems: "baseline", gap: 8 }}>
				{summary ? (
					<>
						<span className="amt amt-lg">{formatCurrency(last?.value ?? 0)}</span>
						<span className="t-sm t-muted">{sub}</span>
					</>
				) : (
					<span className="sk" style={{ height: 30, width: "55%" }} />
				)}
			</div>
			<div className="seg seg-block" role="group" aria-label="Granularity">
				{GRANULARITIES.map((g) => (
					<button
						key={g.id}
						className={`seg-i${g.id === granularity ? " on" : ""}`}
						type="button"
						aria-pressed={g.id === granularity}
						onClick={() => onGranularity(g.id)}>
						{g.label}
					</button>
				))}
			</div>
			{!summary ? (
				<span className="sk" style={{ height: 180 }} />
			) : !hasData ? (
				<div className="empty" style={{ padding: "28px 12px" }}>
					<p>No money moved in this range yet.</p>
				</div>
			) : (
				<>
					<div
						className="chart-plot"
						style={{ height: 180 }}
						role="img"
						aria-label={`Money moved per ${gran.noun}: ${series
							.map((s) => `${s.label} ${compactMoney(s.value)}`)
							.join(", ")}`}>
						<div className="chart-grid" aria-hidden="true">
							{[1, 0.75, 0.5, 0.25].map((f) => (
								<span key={f} data-v={compactMoney(max * f)} />
							))}
							<span data-v="0" />
						</div>
						{series.map((s, i) => (
							<div
								className="bar-grp"
								key={`${s.label}-${i}`}
								title={`${s.label}: ${compactMoney(s.value)}`}>
								<span
									className={i === series.length - 1 ? "bar" : "bar soft"}
									style={{
										height: `${Math.max(1.5, (s.value / max) * 100).toFixed(1)}%`,
										maxWidth: 28,
									}}
								/>
							</div>
						))}
					</div>
					<div className="chart-x" aria-hidden="true">
						{series.map((s, i) => (
							<span key={`${s.label}-${i}`}>{s.label}</span>
						))}
					</div>
				</>
			)}
		</section>
	);
}

export default TransactionPage;
