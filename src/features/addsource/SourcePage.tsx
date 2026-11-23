"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ArrowDownLeft,
	ArrowLeftRight,
	ArrowUpRight,
	ChevronDown,
	ChevronRight,
	Plus,
	Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import AddSourceModal from "./sourceModal";
import { getSources, type SourceDto } from "@/api/sources";
import { getTrends, type Granularity, type TrendsDto } from "@/api/transaction";
import { formatCurrency } from "@/lib/formatCurrency";
import { toMajor } from "@/lib/money";
import type { Status } from "@/lib/status";
import { useSpace } from "@/hooks/useSpace";
import { useQuickAdd } from "@/components/app/QuickAdd";
import { span } from "@/components/app/grid";
import {
	BarPlot,
	ErrorCard,
	GRANULARITIES,
	granularityInfo,
	shortDate,
	signed,
	sourceLook,
} from "./sourceUi";

type FlowKey = "inflow" | "outflow" | "transfer";

const FLOWS: {
	id: FlowKey;
	label: string;
	cls: "in" | "out" | "tr";
	Icon: typeof ArrowDownLeft;
	desc: string;
	emptyTitle: string;
	emptyDesc: string;
}[] = [
	{
		id: "inflow",
		label: "Inflow",
		cls: "in",
		Icon: ArrowDownLeft,
		desc: "Money in",
		emptyTitle: "No inflow yet",
		emptyDesc: "Record income and it'll show up here over time.",
	},
	{
		id: "outflow",
		label: "Outflow",
		cls: "out",
		Icon: ArrowUpRight,
		desc: "Money out",
		emptyTitle: "No outflow yet",
		emptyDesc: "Record spending and it'll show up here over time.",
	},
	{
		id: "transfer",
		label: "Transfer",
		cls: "tr",
		Icon: ArrowLeftRight,
		desc: "Between your sources",
		emptyTitle: "No transfers yet",
		emptyDesc: "Move money between sources and it'll show up here.",
	},
];

const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

export default function SourcePage() {
	const { openAddTransaction } = useQuickAdd();
	const { isAllView, activeSpace } = useSpace();
	const [open, setOpen] = useState(false);
	const [sources, setSources] = useState<SourceDto[]>([]);
	const [trends, setTrends] = useState<TrendsDto | null>(null);
	const [status, setStatus] = useState<Status>("loading");
	const [granularity, setGranularity] = useState<Granularity>("monthly");
	const [flow, setFlow] = useState<FlowKey>("inflow");

	const hasSources = sources.length > 0;
	const spaceName = isAllView ? "all spaces" : (activeSpace?.name ?? "this space");

	// Bumping this re-runs the fetch effect (used by retry and after a create).
	const [reloadKey, setReloadKey] = useState(0);

	const reload = useCallback(() => {
		setStatus("loading");
		setReloadKey((k) => k + 1);
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function fetchSources() {
			try {
				const sourcesData = await getSources();
				if (cancelled) return;
				setSources(sourcesData);
				setStatus("ready");
			} catch (error) {
				if (cancelled) return;
				console.error("Failed to fetch sources:", error);
				setStatus("error");
			}
		}

		fetchSources();
		return () => {
			cancelled = true;
		};
	}, [reloadKey]);

	// Trends refetch on their own so changing the chart granularity doesn't
	// reload the source list.
	useEffect(() => {
		let cancelled = false;
		setTrends(null);
		getTrends(6, granularity)
			.then((data) => !cancelled && setTrends(data))
			.catch((e) => {
				console.error("Failed to load trends:", e);
				// Fall back to the chart's empty state rather than a stuck skeleton.
				if (!cancelled) setTrends({ months: 0, totalsByMonth: [], bySource: [] });
			});
		return () => {
			cancelled = true;
		};
	}, [granularity, reloadKey]);

	const currency = sources[0]?.currency ?? "NGN";
	const money = (v: bigint) => formatCurrency(v, currency);

	const totals = useMemo(() => {
		const balance = sources.reduce((s, x) => s + x.remainingBalance, 0n);
		const opening = sources.reduce((s, x) => s + x.initialBalance, 0n);
		const growth = balance - opening;
		return {
			balance,
			opening,
			growth,
			growthPct: opening > 0n ? (Number(growth) / Number(opening)) * 100 : null,
		};
	}, [sources]);

	const addDisabled = isAllView;
	const addTitle = isAllView ? "Open a space to add a source" : undefined;

	return (
		<main className="page">
			<div className="page-h">
				<div className="page-h-text">
					<h1 className="t-h1">Sources</h1>
					<p className="t-muted">
						Bank accounts, wallets and cash in <strong className="t-fg2">{spaceName}</strong>.
						{hasSources && " Open one to see its history."}
					</p>
				</div>
				<div className="page-h-actions hide-m">
					<button
						type="button"
						className="btn btn-primary"
						disabled={addDisabled}
						title={addTitle}
						onClick={() => setOpen(true)}>
						<Plus className="ic ic-sm" />
						Add source
					</button>
				</div>
				<div className="page-h-actions show-m" style={{ width: "100%", flexWrap: "nowrap" }}>
					<button
						type="button"
						className="btn btn-secondary"
						style={{ flex: 1 }}
						disabled={isAllView}
						title={isAllView ? "Open a space to add transactions" : undefined}
						onClick={openAddTransaction}>
						<ArrowLeftRight className="ic ic-sm" />
						Transaction
					</button>
					<button
						type="button"
						className="btn btn-primary"
						style={{ flex: 1 }}
						disabled={addDisabled}
						title={addTitle}
						onClick={() => setOpen(true)}>
						<Plus className="ic ic-sm" />
						Add source
					</button>
				</div>
			</div>

			{status === "error" && <ErrorCard message="Couldn't load your sources." onRetry={reload} />}

			{status === "loading" && (
				<div className="g">
					<div className="stack" style={span({ d: 7, l: 7, t: 12 })} aria-busy="true" aria-label="Loading sources">
						<span className="sk" style={{ height: 84, borderRadius: 16 }} />
						{[0, 1, 2].map((i) => (
							<span key={i} className="sk" style={{ height: 112, borderRadius: 16 }} />
						))}
					</div>
					<span className="sk" style={span({ d: 5, l: 5, t: 12 }, { height: 460, borderRadius: 16 })} />
				</div>
			)}

			{status === "ready" && !hasSources && (
				<section className="card empty">
					<span className="empty-ic">
						<Wallet className="ic ic-lg" />
					</span>
					<p className="t-h3">No sources yet</p>
					<p>
						{isAllView
							? "Open a space to add a money source to it."
							: "Add a money source — a bank account, cash, or savings — to start tracking your balance."}
					</p>
					<button
						type="button"
						className="btn btn-primary"
						disabled={addDisabled}
						title={addTitle}
						onClick={() => setOpen(true)}>
						<Plus className="ic ic-sm" />
						Add your first source
					</button>
				</section>
			)}

			{status === "ready" && hasSources && (
				<div className="g">
					{/* Left: summary + source cards */}
					<div className="stack" style={span({ d: 7, l: 7, t: 12 })}>
						<section className="card" aria-label="Sources summary" style={{ padding: "18px 20px" }}>
							<div className="g" style={{ gap: 16 }}>
								<div className="stack-sm" style={span({ d: 4, m: 6 }, { gap: 4 })}>
									<span className="stat-l">Total balance</span>
									<span className="amt amt-md">{money(totals.balance)}</span>
								</div>
								<div className="stack-sm" style={span({ d: 4, m: 6 }, { gap: 4 })}>
									<span className="stat-l">Opening balances</span>
									<span className="amt amt-md t-fg2">{money(totals.opening)}</span>
								</div>
								<div className="stack-sm" style={span({ d: 4, m: 12 }, { gap: 4 })}>
									<span className="stat-l">Growth since opening</span>
									<span className="row-f" style={{ gap: 8 }}>
										<span className={`amt amt-md ${totals.growth < 0n ? "out" : "in"}`}>
											{signed(totals.growth, money)}
										</span>
										{totals.growthPct !== null && (
											<span className={`delta ${totals.growth < 0n ? "out" : "in"}`}>
												{totals.growthPct >= 0 ? "+" : "−"}
												{Math.abs(totals.growthPct).toFixed(1)}%
											</span>
										)}
									</span>
								</div>
							</div>
						</section>

						<ul className="stack-sm" style={{ gap: 12 }} aria-label="Your sources">
							{sources.map((s, i) => {
								const { Icon, color } = sourceLook(s.name, i);
								const change = s.remainingBalance - s.initialBalance;
								const changePct =
									s.initialBalance > 0n ? (Number(change) / Number(s.initialBalance)) * 100 : null;
								const share = Math.round(
									pct(Math.max(0, toMajor(s.remainingBalance)), toMajor(totals.balance)),
								);
								return (
									<li key={s.id}>
										<Link
											to={`/sources/${s.id}`}
											className="card stack-sm src-card"
											aria-label={`Open ${s.name}`}>
											<div className="row-f" style={{ gap: 14 }}>
												<span className="li-ic" style={{ color }}>
													<Icon className="ic" />
												</span>
												<div className="li-main">
													<span className="li-t">
														<span className="trunc">{s.name}</span>
													</span>
													<span className="li-s">
														Opened at {formatCurrency(s.initialBalance, s.currency)}
														<span className="hide-m">· since {shortDate(s.createdAt)}</span>
													</span>
												</div>
												<div className="li-end">
													<span className="amt amt-md">
														{formatCurrency(s.remainingBalance, s.currency)}
													</span>
													{change === 0n ? (
														<span className="t-xs t-muted">No change</span>
													) : (
														<span
															className={`t-xs ${change < 0n ? "out" : "in"}`}
															style={{ fontWeight: 650 }}>
															{signed(change, (v) => formatCurrency(v, s.currency))}
															{changePct !== null &&
																` · ${changePct >= 0 ? "+" : "−"}${Math.abs(changePct).toFixed(1)}%`}
														</span>
													)}
												</div>
												<ChevronRight className="ic ic-sm t-muted" />
											</div>
											<div className="row-f" style={{ gap: 12 }}>
												<div className="progress progress-thin grow">
													<span style={{ width: `${share}%`, background: color }} />
												</div>
												<span className="t-xs t-muted" style={{ whiteSpace: "nowrap" }}>
													{share}% of {isAllView ? "total" : spaceName}
												</span>
											</div>
										</Link>
									</li>
								);
							})}
						</ul>

						<button
							type="button"
							className="card src-add"
							disabled={addDisabled}
							title={addTitle}
							onClick={() => setOpen(true)}>
							<span className="ic-tile">
								<Plus className="ic" />
							</span>
							<span className="stack-sm" style={{ gap: 2 }}>
								<span className="t-h3">Add a source</span>
								<span className="t-xs t-muted">
									A bank account, mobile wallet, savings or cash — with its opening balance.
								</span>
							</span>
						</button>
					</div>

					{/* Right: flow trend */}
					<FlowTrendCard
						trends={trends}
						sources={sources}
						flow={flow}
						setFlow={setFlow}
						granularity={granularity}
						setGranularity={setGranularity}
						currency={currency}
					/>
				</div>
			)}

			<AddSourceModal open={open} setOpen={setOpen} onCreated={reload} />
		</main>
	);
}

function FlowTrendCard({
	trends,
	sources,
	flow,
	setFlow,
	granularity,
	setGranularity,
	currency,
}: {
	trends: TrendsDto | null;
	sources: SourceDto[];
	flow: FlowKey;
	setFlow: (f: FlowKey) => void;
	granularity: Granularity;
	setGranularity: (g: Granularity) => void;
	currency: string;
}) {
	const cur = FLOWS.find((f) => f.id === flow)!;
	const gran = granularityInfo(granularity);
	const money = (v: bigint) => formatCurrency(v, currency);

	const series = trends?.totalsByMonth ?? [];
	const points = series.map((p) => ({ period: p.period, value: toMajor(p[flow]) }));
	const sum = series.reduce((s, p) => s + p[flow], 0n);
	const hasData = points.some((p) => p.value > 0);
	const sign = cur.cls === "in" ? "+" : cur.cls === "out" ? "−" : "";

	// This period's split by source (the last trend window is the current one).
	const lastWindow = trends?.bySource[trends.bySource.length - 1];
	const bySource = (lastWindow?.values ?? [])
		.filter((v) => v[flow] > 0n)
		.sort((a, b) => (b[flow] > a[flow] ? 1 : b[flow] < a[flow] ? -1 : 0))
		.map((v) => {
			const index = sources.findIndex((s) => s.id === v.sourceId);
			return {
				id: v.sourceId,
				name: v.sourceName,
				color: sourceLook(v.sourceName, Math.max(0, index)).color,
				amount: v[flow],
			};
		});
	const thisPeriod = granularity === "biweekly" ? "this period" : `this ${gran.per}`;

	return (
		<section className="card chart" style={span({ d: 5, l: 5, t: 12 })} aria-label="Flow trend">
			<div className="card-h" style={{ marginBottom: 6, alignItems: "flex-start" }}>
				<div>
					<p className="card-t">Flow trend</p>
					<p className="card-s">
						{cur.desc}, per {gran.per}
					</p>
				</div>
				<div className="control" style={{ width: 132 }}>
					<label className="sr-only" htmlFor="src-gran-sel">
						Granularity
					</label>
					<select
						id="src-gran-sel"
						className="input select input-sm"
						value={granularity}
						onChange={(e) => setGranularity(e.target.value as Granularity)}>
						{GRANULARITIES.map((g) => (
							<option key={g.id} value={g.id}>
								{g.label}
							</option>
						))}
					</select>
					<ChevronDown className="ic ic-sm ic-end" />
				</div>
			</div>

			<div className="seg seg-block" role="group" aria-label="Flow type">
				{FLOWS.map((f) => {
					const on = f.id === flow;
					return (
						<button
							key={f.id}
							type="button"
							className={`seg-i${on ? ` on ${f.cls}` : ""}`}
							aria-pressed={on}
							onClick={() => setFlow(f.id)}>
							<f.Icon className="ic ic-sm" />
							{f.label}
						</button>
					);
				})}
			</div>

			{!trends ? (
				<div className="stack-sm" aria-busy="true" aria-label="Loading chart" style={{ marginTop: 6 }}>
					<span className="sk" style={{ height: 14, width: 140 }} />
					<span className="sk" style={{ height: 28, width: 180 }} />
					<span className="sk" style={{ height: 200 }} />
				</div>
			) : !hasData ? (
				<div className="empty" style={{ padding: "32px 12px" }}>
					<span className="empty-ic">
						<cur.Icon className="ic ic-lg" />
					</span>
					<p className="t-h3">{cur.emptyTitle}</p>
					<p>{cur.emptyDesc}</p>
				</div>
			) : (
				<>
					<div className="stack-sm" style={{ gap: 2, marginTop: 6 }}>
						<span className="t-over">
							{cur.label} · last {points.length} {gran.noun}
						</span>
						<span className={`amt amt-lg ${cur.cls}`}>
							{sign}
							{money(sum)}
						</span>
					</div>
					<BarPlot
						points={points}
						barClass={cur.cls === "tr" ? "" : cur.cls}
						height={200}
						currency={currency}
						label={`${cur.label} per ${gran.per}`}
					/>
				</>
			)}

			{trends && (
				<div
					className="stack-sm"
					style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 14 }}>
					<span className="t-xs t-muted t-strong">
						{cur.label} by source · {thisPeriod}
					</span>
					{bySource.length === 0 ? (
						<span className="t-sm t-muted">Nothing {thisPeriod} yet.</span>
					) : (
						<div className="cat-list">
							{bySource.map((r) => (
								<div key={r.id} className="cat-row">
									<i className="dot" style={{ background: r.color }} />
									<span className="grow trunc">{r.name}</span>
									<span className={`amt ${cur.cls}`}>
										{sign}
										{money(r.amount)}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</section>
	);
}
