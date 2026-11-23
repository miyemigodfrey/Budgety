"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
	Banknote,
	Check,
	ChevronDown,
	Info,
	Landmark,
	type LucideIcon,
	Plus,
	Scale,
	Smartphone,
	Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import { span } from "@/components/app/grid";
import { getSources, type SourceDto } from "@/api/sources";
import {
	createReconciliation,
	getDiscrepancies,
	type Discrepancy,
	type ReconcileResult,
} from "@/api/reconcilation";
import { createTransaction } from "@/api/transaction";
import { useSpace } from "@/hooks/useSpace";
import { getErrorMessage } from "@/lib/apiError";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatMoneyInput, parseMoneyInput, toMajor } from "@/lib/money";
import type { Status } from "@/lib/status";

const SOURCE_COLORS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)"];

/** Rough icon for a source from its name — the model has no source "kind". */
const sourceIcon = (name: string): LucideIcon => {
	const n = name.toLowerCase();
	if (/cash|wallet|purse/.test(n)) return Banknote;
	if (/bank|access|gtb|zenith|uba|first|stanbic|fidelity|wema|sterling/.test(n)) return Landmark;
	if (/opay|kuda|palm|moniepoint|chipper|mobile|pay/.test(n)) return Smartphone;
	return Wallet;
};

const currencySymbol = (currency = "NGN") =>
	new Intl.NumberFormat("en-NG", { style: "currency", currency })
		.formatToParts(0)
		.find((p) => p.type === "currency")?.value ?? currency;

/** Signed amount with a real minus sign. */
const signed = (minor: bigint, currency?: string) =>
	(minor > 0n ? "+" : minor < 0n ? "−" : "") +
	formatCurrency(minor < 0n ? -minor : minor, currency);

/** Local "today" as YYYY-MM-DD, the same date shape the transaction form sends. */
const todayStr = () => {
	const d = new Date();
	return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0]!;
};

const checkedLabel = (at: Date | string) => {
	const d = new Date(at);
	if (Date.now() - d.getTime() < 2 * 60 * 1000) return "Checked just now";
	return `Last checked ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
};

export default function ReconcilationPage() {
	const { isAllView, activeSpace } = useSpace();
	const spaceName = isAllView ? "all spaces" : (activeSpace?.name ?? "this space");

	const [sources, setSources] = useState<SourceDto[]>([]);
	const [records, setRecords] = useState<Discrepancy[]>([]);
	const [status, setStatus] = useState<Status>("loading");
	const [reloadKey, setReloadKey] = useState(0);

	const [sourceId, setSourceId] = useState("");
	const [actual, setActual] = useState("");
	const [result, setResult] = useState<ReconcileResult | null>(null);
	const [adjusted, setAdjusted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isAdjusting, setIsAdjusting] = useState(false);

	const actualRef = useRef<HTMLInputElement>(null);

	const refresh = useCallback(
		() =>
			Promise.all([getSources(), getDiscrepancies()]).then(([srcs, recs]) => {
				setSources(srcs);
				setRecords(recs);
				return srcs;
			}),
		[],
	);

	useEffect(() => {
		let cancelled = false;
		setStatus("loading");
		Promise.all([getSources(), getDiscrepancies()])
			.then(([srcs, recs]) => {
				if (cancelled) return;
				setSources(srcs);
				setRecords(recs);
				// Start on the first source so the form is ready to use.
				setSourceId((cur) => cur || srcs[0]?.id || "");
				setStatus("ready");
			})
			.catch((error) => {
				if (cancelled) return;
				console.error("Failed to load sources:", error);
				setStatus("error");
			});
		return () => {
			cancelled = true;
		};
	}, [reloadKey]);

	const selectedSource = useMemo(
		() => sources.find((s) => s.id === sourceId),
		[sources, sourceId],
	);
	const currency = selectedSource?.currency;

	// Any prior result goes stale once the inputs change.
	const clearResult = () => {
		setResult(null);
		setAdjusted(false);
	};
	const pickSource = (id: string) => {
		setSourceId(id);
		setActual("");
		clearResult();
	};

	const handleReconcile = async (e?: FormEvent) => {
		e?.preventDefault();
		// "All" is a read-only overview — reconcile inside the source's own space.
		if (isAllView) {
			toast.error("Open a space first, then reconcile its sources.");
			return;
		}
		if (!sourceId) {
			toast.error("Please select a source.");
			return;
		}
		const actualBalance = parseMoneyInput(actual);
		if (actual === "" || Number.isNaN(actualBalance)) {
			toast.error("Please enter a valid actual balance.");
			return;
		}

		try {
			setIsSubmitting(true);
			const [reconciled] = await createReconciliation([{ sourceId, actualBalance }]);
			if (reconciled) {
				setResult(reconciled);
				setAdjusted(false);
			}
			toast.success("Reconciliation recorded.");
			refresh().catch((error) => console.error("Failed to refresh reconciliations:", error));
		} catch (error) {
			console.error("Failed to reconcile:", error);
			toast.error(getErrorMessage(error, "Failed to reconcile. Please try again."));
		} finally {
			setIsSubmitting(false);
		}
	};

	// Book the gap as an inflow/outflow so the app balance matches the count.
	const handleAdjust = async () => {
		if (!result || result.discrepancy === 0n) return;
		if (isAllView) {
			toast.error("Open a space first, then record the adjustment.");
			return;
		}
		const diff = result.discrepancy;
		try {
			setIsAdjusting(true);
			await createTransaction({
				sourceId: result.sourceId,
				type: diff > 0n ? "inflow" : "outflow",
				amount: toMajor(diff < 0n ? -diff : diff),
				category: "Adjustment",
				note: "Reconciliation adjustment",
				date: todayStr(),
			});
			setAdjusted(true);
			toast.success("Adjustment recorded.");
			refresh().catch((error) => console.error("Failed to refresh sources:", error));
		} catch (error) {
			console.error("Failed to record adjustment:", error);
			toast.error(getErrorMessage(error, "Failed to record the adjustment."));
		} finally {
			setIsAdjusting(false);
		}
	};

	const recordBySource = useMemo(
		() => new Map(records.map((r) => [r.sourceId, r])),
		[records],
	);

	const srcName = selectedSource?.name ?? "";
	const resultSource = result ? sources.find((s) => s.id === result.sourceId) : undefined;
	const resultName = resultSource?.name ?? result?.sourceName ?? srcName;
	const resultCurrency = resultSource?.currency;
	const showMismatch = !!result && result.discrepancy !== 0n && !adjusted;
	const showMatch = !!result && (result.discrepancy === 0n || adjusted);
	const cantReconcile = isSubmitting || isAllView || !sourceId || actual === "";

	return (
		<main className="page">
			<div className="page-h">
				<div className="page-h-text">
					<p className="t-over">Money</p>
					<h1 className="t-h1">Reconcile</h1>
					<p className="t-muted">Check what Budgety expects against what you actually hold.</p>
				</div>
			</div>

			{status === "error" ? (
				<section className="card">
					<div className="empty" role="alert">
						<p className="card-t">Couldn&rsquo;t load your sources.</p>
						<p>Check your connection and try again.</p>
						<button className="btn btn-secondary" type="button" onClick={() => setReloadKey((k) => k + 1)}>
							Try again
						</button>
					</div>
				</section>
			) : status === "ready" && sources.length === 0 ? (
				<section className="card">
					<div className="empty">
						<span className="empty-ic">
							<Wallet className="ic ic-lg" aria-hidden="true" />
						</span>
						<p className="t-h3">Nothing to reconcile yet</p>
						<p>
							Add a money source first, then come back to check its balance against what you
							actually have.
						</p>
						<Link className="btn btn-primary" href="/source">
							Go to sources
						</Link>
					</div>
				</section>
			) : (
				<div className="g">
					{/* Left: count + result */}
					<div className="stack" style={span({ d: 7, l: 7, t: 12 })}>
						<form className="card stack" style={{ gap: 18 }} aria-label="Count a source" onSubmit={handleReconcile} noValidate>
							<div>
								<p className="card-t">Count a source</p>
								<p className="card-s">Pick a source, enter what you really have, then reconcile.</p>
							</div>

							<div className="field">
								<label className="label" htmlFor="rec-source">
									Source
								</label>
								<div className="control">
									<select
										id="rec-source"
										className="input select"
										value={sourceId}
										disabled={status === "loading"}
										onChange={(e) => pickSource(e.target.value)}>
										{!sourceId && (
											<option value="" disabled>
												{status === "loading" ? "Loading sources…" : "Select a source"}
											</option>
										)}
										{sources.map((src) => (
											<option key={src.id} value={src.id}>
												{src.name}
											</option>
										))}
									</select>
									<ChevronDown className="ic ic-sm ic-end" aria-hidden="true" />
								</div>
							</div>

							<div
								className="between"
								style={{
									background: "var(--surface-2)",
									border: "1px solid var(--border)",
									borderRadius: 12,
									padding: "14px 16px",
								}}>
								<div className="stack-sm" style={{ gap: 2 }}>
									<span className="label">App balance</span>
									<span className="hint">
										{selectedSource
											? `Opening ${formatCurrency(selectedSource.initialBalance, currency)} plus recorded transactions`
											: "Pick a source to see what Budgety expects"}
									</span>
								</div>
								{status === "loading" ? (
									<span className="sk" style={{ height: 22, width: 110 }} />
								) : (
									<span className="amt amt-md tr">
										{selectedSource ? formatCurrency(selectedSource.balance, currency) : "—"}
									</span>
								)}
							</div>

							<div className="field">
								<label className="label" htmlFor="rec-actual">
									Actual (counted) balance
								</label>
								<div className="control">
									<span className="cur" aria-hidden="true">
										{currencySymbol(currency)}
									</span>
									<input
										ref={actualRef}
										id="rec-actual"
										className="input input-amt"
										inputMode="decimal"
										autoComplete="off"
										placeholder="0.00"
										aria-describedby="rec-actual-hint"
										value={actual}
										onChange={(e) => {
											setActual(formatMoneyInput(e.target.value));
											clearResult();
										}}
									/>
								</div>
								<div className="between">
									<span className="hint" id="rec-actual-hint">
										Count notes and coins, or read it off your bank app.
									</span>
									<button
										className="btn btn-ghost btn-sm"
										type="button"
										style={{ color: "var(--brand)" }}
										disabled={!selectedSource}
										onClick={() => {
											if (!selectedSource) return;
											setActual(formatMoneyInput(String(toMajor(selectedSource.balance))));
											clearResult();
										}}>
										Use app balance
									</button>
								</div>
							</div>

							{isAllView && (
								<p className="row-f t-sm t-muted" role="note">
									<Info className="ic ic-sm" aria-hidden="true" />
									You&rsquo;re viewing all spaces. Open a space to reconcile its sources.
								</p>
							)}

							<button className="btn btn-primary btn-lg btn-block" type="submit" disabled={cantReconcile}>
								<Scale className="ic ic-sm" aria-hidden="true" />
								{isSubmitting ? "Reconciling…" : `Reconcile ${srcName}`.trim()}
							</button>
						</form>

						{showMismatch && result && (
							<section
								className="card stack"
								style={{
									gap: 14,
									background: "var(--danger-soft)",
									borderColor: "color-mix(in oklch, var(--danger) 30%, transparent)",
								}}
								aria-live="polite">
								<div className="row-f" style={{ alignItems: "flex-start", gap: 14 }}>
									<span className="ic-tile out ic-tile-lg" style={{ background: "var(--surface)" }}>
										<Scale className="ic ic-lg" aria-hidden="true" />
									</span>
									<div className="stack-sm grow" style={{ gap: 4 }}>
										<span className="t-over" style={{ color: "var(--danger)" }}>
											Difference
										</span>
										<span className="amt amt-lg out">{signed(result.discrepancy, resultCurrency)}</span>
										<p className="t-strong">
											{result.discrepancy > 0n
												? "You have more cash than the app expects."
												: "You have less cash than the app expects."}
										</p>
										<p className="t-sm t-muted">
											Counted {formatCurrency(result.actualBalance, resultCurrency)} · App{" "}
											{formatCurrency(result.appBalance, resultCurrency)}
										</p>
									</div>
								</div>
								<div className="row-f wrap" style={{ gap: 8 }}>
									<button
										className="btn btn-primary"
										type="button"
										disabled={isAdjusting || isAllView}
										onClick={handleAdjust}>
										<Plus className="ic ic-sm" aria-hidden="true" />
										{isAdjusting
											? "Recording…"
											: `Record ${signed(result.discrepancy, resultCurrency)} adjustment`}
									</button>
									<button className="btn btn-ghost" type="button" onClick={clearResult}>
										Dismiss
									</button>
								</div>
							</section>
						)}

						{showMatch && result && (
							<section
								className="card stack"
								style={{
									gap: 14,
									background: "var(--success-soft)",
									borderColor: "color-mix(in oklch, var(--success) 30%, transparent)",
								}}
								aria-live="polite">
								<div className="row-f" style={{ alignItems: "flex-start", gap: 14 }}>
									<span className="ic-tile in ic-tile-lg" style={{ background: "var(--surface)" }}>
										<Check className="ic ic-lg" aria-hidden="true" />
									</span>
									<div className="stack-sm grow" style={{ gap: 4 }}>
										<span className="t-over" style={{ color: "var(--success)" }}>
											Balances match
										</span>
										<span className="amt amt-lg in">{formatCurrency(0, resultCurrency)}</span>
										<p className="t-strong">
											{adjusted
												? `Adjustment recorded. ${resultName} now matches what you counted.`
												: `No discrepancy. ${resultName} is exactly where it should be.`}
										</p>
										<p className="t-sm t-muted">Saved as {resultName}&rsquo;s latest reconciliation.</p>
									</div>
								</div>
							</section>
						)}
					</div>

					{/* Right: status of every source */}
					<div className="stack" style={span({ d: 5, l: 5, t: 12 })}>
						<section className="card card-flush" aria-label="Reconciliation status">
							<div className="card-h">
								<div>
									<p className="card-t">Reconciliation status</p>
									<p className="card-s">Latest check for each source in {spaceName}</p>
								</div>
							</div>
							<ul className="list">
								{status === "loading"
									? Array.from({ length: 4 }, (_, i) => (
											<li key={i} className="li">
												<span className="sk" style={{ width: 40, height: 40, borderRadius: 12 }} />
												<div className="li-main">
													<span className="sk" style={{ height: 14, width: "50%" }} />
													<span className="sk" style={{ height: 12, width: "35%" }} />
												</div>
											</li>
										))
									: sources.map((s, i) => {
											const rec = recordBySource.get(s.id);
											const Icon = sourceIcon(s.name);
											const d = rec?.discrepancy;
											return (
												<li key={s.id} className="li">
													<span className="li-ic" style={{ color: SOURCE_COLORS[i % SOURCE_COLORS.length] }}>
														<Icon className="ic" aria-hidden="true" />
													</span>
													<div className="li-main">
														<span className="li-t">{s.name}</span>
														<span className="li-s">
															{rec ? checkedLabel(rec.reconciledAt) : "Never reconciled"}
														</span>
													</div>
													<div className="li-end">
														<span
															className={`badge ${d === undefined ? "outline" : d === 0n ? "in" : "out"}`}>
															{d === undefined ? "Not checked" : d === 0n ? "Matched" : signed(d, s.currency)}
														</span>
														<button
															className="btn btn-ghost btn-sm"
															type="button"
															style={{ height: 26, padding: "0 8px", color: "var(--brand)" }}
															aria-label={`Check ${s.name}`}
															onClick={() => {
																pickSource(s.id);
																actualRef.current?.focus();
															}}>
															Check
														</button>
													</div>
												</li>
											);
										})}
							</ul>
							<div className="card-foot">
								<span className="row-f t-sm t-muted">
									<Info className="ic ic-sm" aria-hidden="true" />
									One record per source. Reconciling again replaces it.
								</span>
							</div>
						</section>

						<section className="card stack-sm" style={{ gap: 12 }}>
							<p className="card-t">How it works</p>
							{[
								"Count the cash, or check your bank or wallet app.",
								"Enter that figure. Budgety shows the gap against its own balance.",
								"Record an adjustment so the app matches real life again.",
							].map((text, i) => (
								<div key={i} className="row-f" style={{ alignItems: "flex-start", gap: 12 }}>
									<span className="badge tr" style={{ width: 22, justifyContent: "center", padding: 0 }}>
										{i + 1}
									</span>
									<p className="t-sm t-fg2">{text}</p>
								</div>
							))}
						</section>
					</div>
				</div>
			)}
		</main>
	);
}
