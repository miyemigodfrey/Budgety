"use client";

import { useEffect, useMemo, useState } from "react";
import {
	ArrowDownLeft,
	ArrowLeft,
	ArrowLeftRight,
	ArrowUpDown,
	ArrowUpRight,
	Check,
	ChartColumn,
	Ellipsis,
	Pencil,
	Plus,
	Scale,
	Trash2,
	TrendingDown,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
	deleteSource,
	getSourceById,
	getSources,
	getSummary,
	type SourceDto,
	type SourceId,
	type SourceSummary,
} from "@/api/sources";
import { getReconciliationBySourceId } from "@/api/reconcilation";
import { getTrends, type Granularity, type TransactionDto } from "@/api/transaction";
import EditTransactionModal from "@/features/transactions/EditTransactionModal";
import UniversalModal from "@/components/ui/modal";
import { HeroRings } from "@/components/app/LogoMark";
import { span } from "@/components/app/grid";
import { useQuickAdd } from "@/components/app/QuickAdd";
import { useSpace } from "@/hooks/useSpace";
import { formatCurrency } from "@/lib/formatCurrency";
import { getErrorMessage } from "@/lib/apiError";
import { toMajor } from "@/lib/money";
import EditSourceModal from "./EditSourceModal";
import {
	BarPlot,
	ErrorCard,
	GRANULARITIES,
	granularityInfo,
	rowDate,
	shortDate,
	signed,
	sourceLook,
} from "./sourceUi";

type Period = SourceSummary["period"];

const PERIODS: { id: Period; label: string }[] = [
	{ id: "daily", label: "Daily" },
	{ id: "monthly", label: "Monthly" },
	{ id: "yearly", label: "Yearly" },
	{ id: "all", label: "All" },
];

/** Same windows the server's summary uses, so the counts match the totals. */
function periodStart(period: Period): Date {
	const now = new Date();
	if (period === "daily") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
	if (period === "monthly") return new Date(now.getFullYear(), now.getMonth(), 1);
	if (period === "yearly") return new Date(now.getFullYear(), 0, 1);
	return new Date(0);
}

function periodLabel(period: Period, since: Date | string) {
	const now = new Date();
	if (period === "daily")
		return `Today · ${now.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
	if (period === "monthly")
		return `This month · ${now.toLocaleDateString("en-GB", { month: "long" })}`;
	if (period === "yearly") return `This year · ${now.getFullYear()}`;
	return `All time · since ${shortDate(since)}`;
}

const txCount = (n: number) => `${n} ${n === 1 ? "transaction" : "transactions"}`;

const RECENT_LIMIT = 6;

function SourcesIdPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { openAddTransaction } = useQuickAdd();
	const { isAllView, activeSpace, refreshSpaces } = useSpace();

	const [data, setData] = useState<SourceId | null>(null);
	const [period, setPeriod] = useState<Period>("monthly");
	const [summary, setSummary] = useState<SourceSummary | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	const [showAll, setShowAll] = useState(false);
	const [editing, setEditing] = useState<TransactionDto | null>(null);
	const [editOpen, setEditOpen] = useState(false);
	const [editSourceOpen, setEditSourceOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);
	const [granularity, setGranularity] = useState<Granularity>("monthly");
	const [chartSeries, setChartSeries] = useState<{ period: string; total: bigint }[] | null>(null);
	const [siblings, setSiblings] = useState<SourceDto[]>([]);
	const [lastReconciledAt, setLastReconciledAt] = useState<Date | null>(null);

	const reload = () => {
		setError(null);
		setReloadKey((k) => k + 1);
	};

	// The source itself (balance + its transactions).
	useEffect(() => {
		if (!id) return;
		let cancelled = false;
		getSourceById(id)
			.then((source) => !cancelled && setData(source))
			.catch((err) => {
				if (cancelled) return;
				console.error("Failed to fetch data:", err);
				setError("Failed to load data. Please try again.");
			});
		return () => {
			cancelled = true;
		};
	}, [id, reloadKey]);

	// The period summary refetches on its own so switching period doesn't
	// blank the whole page.
	useEffect(() => {
		if (!id) return;
		let cancelled = false;
		setSummary(null);
		getSummary(id, period)
			.then((s) => !cancelled && setSummary(s))
			.catch((err) => {
				if (cancelled) return;
				console.error("Failed to fetch summary:", err);
				setError("Failed to load data. Please try again.");
			});
		return () => {
			cancelled = true;
		};
	}, [id, period, reloadKey]);

	// Per-source chart series, pulled from the space-wide trends (reuses the
	// backend's period windows) and narrowed to this source.
	useEffect(() => {
		if (!id) return;
		let cancelled = false;
		setChartSeries(null);
		getTrends(6, granularity)
			.then((trends) => {
				if (cancelled) return;
				setChartSeries(
					trends.bySource.map((w) => ({
						period: w.period,
						total: w.values.find((v) => v.sourceId === id)?.total ?? BigInt(0),
					})),
				);
			})
			.catch((e) => {
				console.error("Failed to load source chart:", e);
				if (!cancelled) setChartSeries([]);
			});
		return () => {
			cancelled = true;
		};
	}, [id, granularity, reloadKey]);

	// Extras that only decorate the page: sibling names (for transfer rows and
	// the share pill) and the last reconciliation. Failures are non-fatal.
	useEffect(() => {
		if (!id) return;
		let cancelled = false;
		getSources()
			.then((list) => !cancelled && setSiblings(list))
			.catch((e) => console.error("Failed to load sources:", e));
		getReconciliationBySourceId(id)
			.then((r) => !cancelled && setLastReconciledAt(r.lastReconciledAt ?? null))
			.catch((e) => console.error("Failed to load reconciliation:", e));
		return () => {
			cancelled = true;
		};
	}, [id, reloadKey]);

	const sorted = useMemo(
		() =>
			[...(data?.transactions ?? [])].sort((a, b) => {
				const byDate = new Date(a.date).getTime() - new Date(b.date).getTime();
				const key =
					byDate !== 0 ? byDate : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				return sortDir === "desc" ? -key : key;
			}),
		[data, sortDir],
	);

	const back = (
		<Link to="/source" className="back">
			<ArrowLeft className="ic ic-sm" />
			Sources
		</Link>
	);

	if (error) {
		return (
			<main className="page">
				<div className="page-h">
					<div className="page-h-text">
						{back}
						<h1 className="t-h1">Source</h1>
					</div>
				</div>
				<ErrorCard message={error} onRetry={reload} />
			</main>
		);
	}

	if (!data) {
		return (
			<main className="page" aria-busy="true" aria-label="Loading source">
				<div className="page-h">
					<div className="page-h-text">
						{back}
						<div className="row-f" style={{ gap: 14 }}>
							<span className="sk" style={{ width: 48, height: 48, borderRadius: 14 }} />
							<div className="stack-sm" style={{ gap: 8 }}>
								<span className="sk" style={{ height: 26, width: 180 }} />
								<span className="sk" style={{ height: 14, width: 240 }} />
							</div>
						</div>
					</div>
				</div>
				<div className="g g-stretch">
					<span className="sk" style={span({ d: 5, l: 5, t: 12 }, { height: 240, borderRadius: 22 })} />
					<span className="sk" style={span({ d: 7, l: 7, t: 12 }, { height: 240, borderRadius: 16 })} />
					<span className="sk" style={span({ d: 5, l: 5, t: 12 }, { height: 380, borderRadius: 16 })} />
					<span className="sk" style={span({ d: 7, l: 7, t: 12 }, { height: 380, borderRadius: 16 })} />
				</div>
			</main>
		);
	}

	const currency = data.currency ?? "NGN";
	const money = (v: bigint) => formatCurrency(v, currency);
	const index = siblings.findIndex((s) => s.id === data.id);
	const { Icon } = sourceLook(data.name, Math.max(0, index));

	// Hero
	const balanceText = money(data.balance);
	const dot = balanceText.lastIndexOf(".");
	const whole = dot === -1 ? balanceText : balanceText.slice(0, dot);
	const decimals = dot === -1 ? "" : balanceText.slice(dot);
	const change = data.balance - data.initialBalance;
	const spaceTotal = siblings.reduce((s, x) => s + x.remainingBalance, 0n);
	const share =
		index !== -1 && spaceTotal > 0n
			? Math.round((Math.max(0, toMajor(data.balance)) / toMajor(spaceTotal)) * 100)
			: null;

	// Summary counts, matching the server's period window
	const start = periodStart(period);
	const inPeriod = data.transactions.filter((t) => new Date(t.date) >= start && t.sourceId === data.id);
	const inCount = inPeriod.filter((t) => t.type === "inflow").length;
	const outCount = inPeriod.filter((t) => t.type === "outflow").length;

	const nameOf = (sourceId: string | null | undefined) =>
		siblings.find((s) => s.id === sourceId)?.name ?? "another source";

	const visible = showAll ? sorted : sorted.slice(0, RECENT_LIMIT);
	const total = data.transactions.length;
	const gran = granularityInfo(granularity);
	const chartHasData = (chartSeries ?? []).some((p) => p.total > 0n);

	const handleDelete = async () => {
		try {
			setDeleting(true);
			await deleteSource(data.id);
			toast.warning("Source deleted successfully");
			void refreshSpaces();
			setDeleteOpen(false);
			navigate("/source", { replace: true });
		} catch (err) {
			console.error("Failed to delete source:", err);
			toast.error(getErrorMessage(err, "Failed to delete source"));
		} finally {
			setDeleting(false);
		}
	};

	return (
		<>
			<main className="page">
				<div className="page-h">
					<div className="page-h-text">
						{back}
						<div className="row-f" style={{ gap: 14 }}>
							<span className="ic-tile ic-tile-lg">
								<Icon className="ic ic-lg" />
							</span>
							<div style={{ minWidth: 0 }}>
								<h1 className="t-h1 trunc">{data.name}</h1>
								<p className="t-sm t-muted">
									Added {shortDate(data.createdAt)} · {txCount(total)}
								</p>
							</div>
						</div>
					</div>
					<div className="page-h-actions">
						<button type="button" className="btn btn-secondary" onClick={() => setEditSourceOpen(true)}>
							<Pencil className="ic ic-sm" />
							Edit source
						</button>
						<Link to="/reconcilation" className="btn btn-secondary">
							<Scale className="ic ic-sm" />
							Reconcile
						</Link>
						<DropdownMenu.Root modal={false}>
							<DropdownMenu.Trigger asChild>
								<button type="button" className="btn btn-secondary btn-icon" aria-label="More actions">
									<Ellipsis className="ic" />
								</button>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" sideOffset={8} className="card src-menu">
								<DropdownMenu.Item
									className="nav-i"
									disabled={isAllView}
									onSelect={openAddTransaction}>
									<Plus className="ic" />
									<span>Add transaction</span>
								</DropdownMenu.Item>
								<DropdownMenu.Separator className="src-menu-sep" />
								<DropdownMenu.Item className="nav-i out" onSelect={() => setDeleteOpen(true)}>
									<Trash2 className="ic" />
									<span className="stack-sm" style={{ gap: 2 }}>
										<span>Delete source</span>
										<span className="t-xs t-muted" style={{ fontWeight: 500 }}>
											{total > 0 ? `Also removes its ${txCount(total)}` : "It has no transactions"}
										</span>
									</span>
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>
				</div>

				<div className="g g-stretch">
					{/* Balance hero */}
					<section className="hero" style={span({ d: 5, l: 5, t: 12 })} aria-label={`${data.name} balance`}>
						<HeroRings />
						<div className="stack-sm" style={{ gap: 8 }}>
							<span className="t-over">Current balance</span>
							<span className="t-display">
								{whole}
								<span style={{ fontSize: "0.55em", opacity: 0.75 }}>{decimals}</span>
							</span>
						</div>
						{(share !== null || lastReconciledAt) && (
							<div className="row-f wrap" style={{ gap: 8 }}>
								{share !== null && (
									<span className="hero-pill">
										{share}% of {isAllView ? "all spaces" : (activeSpace?.name ?? "this space")}
									</span>
								)}
								{lastReconciledAt && (
									<span className="hero-pill">
										<Check className="ic ic-xs" />
										Reconciled {rowDate(lastReconciledAt)}
									</span>
								)}
							</div>
						)}
						<div className="hero-split">
							<div className="hero-cell">
								<small>Opening balance</small>
								<strong>{money(data.initialBalance)}</strong>
							</div>
							<div className="hero-cell">
								<small>
									{change < 0n ? <TrendingDown className="ic ic-xs" /> : <TrendingUp className="ic ic-xs" />}
									Change
								</small>
								<strong>{signed(change, money)}</strong>
							</div>
						</div>
					</section>

					{/* Period summary */}
					<section className="card stack" style={span({ d: 7, l: 7, t: 12 }, { gap: 18 })} aria-label="Period summary">
						<div className="between wrap">
							<div>
								<p className="card-t">Summary</p>
								<p className="card-s">{periodLabel(period, data.createdAt)}</p>
							</div>
							<div className="seg seg-fit" role="group" aria-label="Summary period">
								{PERIODS.map((p) => (
									<button
										key={p.id}
										type="button"
										className={`seg-i${p.id === period ? " on" : ""}`}
										aria-pressed={p.id === period}
										onClick={() => setPeriod(p.id)}>
										{p.label}
									</button>
								))}
							</div>
						</div>
						<div className="g" style={{ gap: 14 }}>
							<SummaryStat
								label="Total inflow"
								tile="in"
								icon={<ArrowDownLeft className="ic" />}
								value={summary && `+${money(summary.inflow)}`}
								cls="in"
								sub={inCount ? txCount(inCount) : "No inflow"}
								style={span({ d: 4, m: 6 })}
							/>
							<SummaryStat
								label="Total outflow"
								tile="out"
								icon={<ArrowUpRight className="ic" />}
								value={summary && `−${money(summary.outflow)}`}
								cls="out"
								sub={outCount ? txCount(outCount) : "No outflow"}
								style={span({ d: 4, m: 6 })}
							/>
							<SummaryStat
								label="Net"
								tile="neutral"
								icon={<Scale className="ic" />}
								value={summary && signed(summary.net, money)}
								cls={summary && summary.net < 0n ? "out" : "in"}
								sub="Inflow minus outflow"
								style={span({ d: 4, m: 12 })}
							/>
						</div>
					</section>

					{/* Recent transactions */}
					<section className="card card-flush" style={span({ d: 5, l: 5, t: 12 })} aria-label="Recent transactions">
						<div className="card-h">
							<div>
								<p className="card-t">Recent transactions</p>
								<p className="card-s">{data.name} only</p>
							</div>
							{total > 0 && (
								<button
									type="button"
									className="btn btn-secondary btn-sm"
									onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
									aria-label={`Sort by date, currently ${sortDir === "desc" ? "newest" : "oldest"} first`}>
									<ArrowUpDown className="ic ic-sm" />
									{sortDir === "desc" ? "Newest" : "Oldest"}
								</button>
							)}
						</div>
						{total === 0 ? (
							<div className="empty">
								<span className="empty-ic">
									<Wallet className="ic ic-lg" />
								</span>
								<p className="t-h3">No transactions yet</p>
								<p>Transactions for {data.name} will appear here.</p>
							</div>
						) : (
							<>
								<ul className="list">
									{visible.map((t) => {
										const kind = t.type === "inflow" ? "in" : t.type === "outflow" ? "out" : "tr";
										const RowIcon =
											kind === "in" ? ArrowDownLeft : kind === "out" ? ArrowUpRight : ArrowLeftRight;
										const title =
											t.type === "transfer"
												? t.sourceId === data.id
													? `Transfer → ${nameOf(t.transferTargetId)}`
													: `Transfer ← ${nameOf(t.sourceId)}`
												: t.category;
										const amount =
											kind === "in" ? `+${money(t.amount)}` : kind === "out" ? `−${money(t.amount)}` : money(t.amount);
										return (
											<li key={t.id} className="li">
												<span className={`li-ic ${kind}`}>
													<RowIcon className="ic" />
												</span>
												<div className="li-main">
													<span className="li-t">
														<span className="trunc">{title}</span>
													</span>
													<span className="li-s">
														<span>{rowDate(t.date)}</span>
														{t.note && <span className="trunc">· {t.note}</span>}
													</span>
												</div>
												<div className="li-end">
													<span className={`amt ${kind}`}>{amount}</span>
													<span className={`badge ${kind} hide-m`}>
														{kind === "in" ? "Inflow" : kind === "out" ? "Outflow" : "Transfer"}
													</span>
												</div>
												<button
													type="button"
													className="btn btn-ghost btn-sm btn-icon"
													aria-label={`Edit ${title}`}
													onClick={() => {
														setEditing(t as unknown as TransactionDto);
														setEditOpen(true);
													}}>
													<Pencil className="ic ic-sm" />
												</button>
											</li>
										);
									})}
								</ul>
								<div className="card-foot">
									<span className="t-sm t-muted">
										Showing {visible.length} of {total}
									</span>
									{total > RECENT_LIMIT && (
										<button
											type="button"
											className="card-link btn-link"
											aria-expanded={showAll}
											onClick={() => setShowAll((v) => !v)}>
											{showAll ? "Show fewer" : `Show all ${total}`}
										</button>
									)}
								</div>
							</>
						)}
					</section>

					{/* Totals chart */}
					<section className="card chart" style={span({ d: 7, l: 7, t: 12 })} aria-label="Totals chart">
						<div className="card-h" style={{ marginBottom: 4, flexWrap: "wrap" }}>
							<div>
								<p className="card-t">Totals</p>
								<p className="card-s">
									{gran.label} totals for {data.name}
								</p>
							</div>
							<div className="seg seg-fit" role="group" aria-label="Granularity">
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
						{!chartSeries ? (
							<span className="sk" style={{ height: 290 }} aria-hidden="true" />
						) : !chartHasData ? (
							<div className="empty">
								<span className="empty-ic">
									<ChartColumn className="ic ic-lg" />
								</span>
								<p className="t-h3">No activity yet</p>
								<p>Money moving through {data.name} will show up here, per {gran.per}.</p>
							</div>
						) : (
							<>
								<BarPlot
									points={chartSeries.map((p) => ({ period: p.period, value: toMajor(p.total) }))}
									height={260}
									barMaxWidth={34}
									currency={currency}
									label={`${gran.label} totals for ${data.name}`}
								/>
								<div className="legend" style={{ marginTop: 6 }}>
									<span>
										<i className="dot" style={{ background: "var(--brand)" }} />
										All money moved through {data.name} (in + out + transfers)
									</span>
								</div>
							</>
						)}
					</section>
				</div>
			</main>

			<EditTransactionModal
				transaction={editing}
				open={editOpen}
				setOpen={setEditOpen}
				onUpdated={() => setReloadKey((k) => k + 1)}
			/>

			<EditSourceModal
				open={editSourceOpen}
				setOpen={setEditSourceOpen}
				source={data}
				onUpdated={() => setReloadKey((k) => k + 1)}
			/>

			<UniversalModal
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				title={`Delete ${data.name}?`}
				description="This can’t be undone."
				footer={
					<>
						<button type="button" className="btn btn-secondary btn-lg grow" onClick={() => setDeleteOpen(false)}>
							Keep it
						</button>
						<button
							type="button"
							className="btn btn-danger-fill btn-lg grow"
							disabled={deleting}
							onClick={handleDelete}>
							<Trash2 className="ic ic-sm" />
							{deleting ? "Deleting…" : "Yes, delete"}
						</button>
					</>
				}>
				<p className="t-sm t-fg2">
					{total > 0
						? `Deleting ${data.name} also deletes its ${txCount(total)}, including transfers to or from it.`
						: `${data.name} has no transactions, so only the source is removed.`}
				</p>
			</UniversalModal>
		</>
	);
}

function SummaryStat({
	label,
	tile,
	icon,
	value,
	cls,
	sub,
	style,
}: {
	label: string;
	tile: "in" | "out" | "neutral";
	icon: React.ReactNode;
	value: string | null;
	cls: string;
	sub: string;
	style: React.CSSProperties;
}) {
	return (
		<div className="stat src-stat" style={style}>
			<div className="stat-top">
				<span className="stat-l">{label}</span>
				<span className={`ic-tile ${tile}`}>{icon}</span>
			</div>
			{value === null ? (
				<span className="sk" style={{ height: 26, width: "70%" }} />
			) : (
				<span className={`stat-v ${cls}`}>{value}</span>
			)}
			<span className="stat-d">{sub}</span>
		</div>
	);
}

export default SourcesIdPage;
