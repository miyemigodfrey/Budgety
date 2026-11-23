"use client";

import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
	ArrowLeftRight,
	Banknote,
	Check,
	ChartColumn,
	Landmark,
	Layers,
	Plus,
	Smartphone,
	Wallet,
	type LucideIcon,
} from "lucide-react";
import { HeroRings } from "@/components/app/LogoMark";
import { span } from "@/components/app/grid";
import { initialOf } from "@/components/layout/Sidebar";
import { useSpace } from "@/hooks/useSpace";
import { useQuickAdd } from "@/components/app/QuickAdd";
import { createSource, type SourceDto } from "@/api/sources";
import { parseMoneyInput, formatMoneyInput } from "@/lib/money";
import { getErrorMessage } from "@/lib/apiError";
import { SourcesCard } from "./cards";
import { money, todayOver } from "./format";

const PICKS: [string, LucideIcon][] = [
	["Access Bank", Landmark],
	["Opay", Smartphone],
	["Kuda", Smartphone],
	["Cash", Banknote],
];

const STEPS = [
	{ title: "Add your first source", desc: "A bank account, wallet or cash — with what’s in it today" },
	{ title: "Record a transaction", desc: "An inflow, an outflow, or a transfer between sources" },
	{ title: "Plan and review", desc: "Start a shopping list or open your reports" },
];

/**
 * Home for a brand-new space: no sources yet (step 1), or sources but no
 * transactions (step 2). Mirrors the FirstRun canvas.
 */
export function FirstRun({
	name,
	sources,
	totalBalance,
	onChanged,
}: {
	name: string;
	sources: SourceDto[];
	totalBalance: bigint;
	/** Called after a source is created so the dashboard refetches. */
	onChanged: () => void;
}) {
	const { activeSpaceId, activeSpace, isAllView, spaces, refreshSpaces } = useSpace();
	const { openAddTransaction } = useQuickAdd();
	const hasSources = sources.length > 0;
	const current = hasSources ? 1 : 0;
	const spaceName = isAllView ? "All spaces" : (activeSpace?.name ?? "your");

	const [srcName, setSrcName] = useState("");
	const [opening, setOpening] = useState("");
	const [saving, setSaving] = useState(false);
	const [formOpen, setFormOpen] = useState(!hasSources);
	const nameRef = useRef<HTMLInputElement>(null);

	const showForm = () => {
		setFormOpen(true);
		requestAnimationFrame(() => {
			nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
			nameRef.current?.focus({ preventScroll: true });
		});
	};

	const handleAddSource = async () => {
		// A source must live in one space; you can't add from the "All" view.
		if (isAllView || !activeSpaceId) {
			toast.error("Open a space first, then add a source to it.");
			return;
		}
		if (!srcName.trim()) {
			toast.error("Please enter a source name.");
			return;
		}
		// An empty opening balance means "start at zero".
		const parsed = opening.trim() === "" ? 0 : parseMoneyInput(opening);
		if (Number.isNaN(parsed) || parsed < 0) {
			toast.error("Please enter a valid opening balance.");
			return;
		}
		try {
			setSaving(true);
			await createSource({ name: srcName.trim(), balance: parsed, spaceId: activeSpaceId });
			toast.success("Source created successfully");
			void refreshSpaces();
			setSrcName("");
			setOpening("");
			onChanged();
		} catch (error) {
			console.error("Failed to create source:", error);
			toast.error(getErrorMessage(error, "Failed to create source"));
		} finally {
			setSaving(false);
		}
	};

	const steps = STEPS.map((s, i) => {
		const done = i < current;
		const now = i === current;
		return {
			...s,
			no: i + 1,
			done,
			badge: done ? "Done" : now ? "Now" : i === current + 1 ? "Next" : "Later",
			badgeCls: done ? "in" : now ? "brand" : "outline",
			border: now ? "var(--brand-line)" : "var(--border)",
			bg: now ? "var(--brand-soft)" : "transparent",
			numBg: done ? "var(--success-soft)" : now ? "var(--brand)" : "var(--sunken)",
			numFg: done ? "var(--success)" : now ? "var(--brand-fg)" : "var(--muted-ink)",
		};
	});
	const pct = `${Math.round((current / 3) * 100)}%`;

	return (
		<main className="page">
			<div className="page-h">
				<div className="page-h-text">
					<p className="t-over">{todayOver()}</p>
					<h1 className="t-h1">Welcome to Budgety{name ? `, ${name}` : ""}</h1>
					<p className="t-muted">
						{isAllView ? (
							<>You’re viewing <strong className="t-fg2">all spaces</strong>. Open a space to set it up.</>
						) : hasSources ? (
							<>Your sources are in. Record a transaction in <strong className="t-fg2">{spaceName}</strong> to fill in Home.</>
						) : (
							<>Let’s set up your <strong className="t-fg2">{spaceName}</strong> space. It takes about a minute.</>
						)}
					</p>
				</div>
			</div>

			<div className="g g-stretch">
				{/* Welcome hero */}
				<section className="hero" style={span({ d: 7, t: 12 })} aria-label="Set up your budget workspace">
					<HeroRings />
					<div className="stack-sm" style={{ gap: 10, maxWidth: 520 }}>
						<span className="t-over">Getting started · step {current + 1} of 3</span>
						<h2 className="t-h1" style={{ color: "#ffffff" }}>
							{hasSources ? "Record your first transaction" : "Set up your budget workspace"}
						</h2>
						<p className="hero-sub" style={{ fontSize: 14 }}>
							{hasSources
								? "Log money coming in, going out, or moving between sources — every balance updates as you save."
								: "Add the places your money lives — a bank account, Opay, cash — and Budgety keeps every balance current as you record transactions."}
						</p>
					</div>
					<div className="hero-split">
						<div className="hero-cell">
							<small>Total balance</small>
							<strong>{money(totalBalance)}</strong>
						</div>
						<div className="hero-cell">
							<small>Sources</small>
							<strong>{hasSources ? sources.length : "None yet"}</strong>
						</div>
					</div>
					<div className="hero-actions">
						{isAllView ? (
							<Link className="hero-btn solid" to="/spaces">
								<Layers className="ic ic-sm" aria-hidden="true" />
								Choose a space
							</Link>
						) : hasSources ? (
							<>
								<button className="hero-btn solid" type="button" onClick={openAddTransaction}>
									<Plus className="ic ic-sm" aria-hidden="true" />
									Add a transaction
								</button>
								<button className="hero-btn" type="button" onClick={showForm}>
									<Wallet className="ic ic-sm" aria-hidden="true" />
									Add another source
								</button>
							</>
						) : (
							<>
								<button className="hero-btn solid" type="button" onClick={showForm}>
									<Plus className="ic ic-sm" aria-hidden="true" />
									Add your first source
								</button>
								<Link className="hero-btn" to="/spaces">
									<Layers className="ic ic-sm" aria-hidden="true" />
									How spaces work
								</Link>
							</>
						)}
					</div>
				</section>

				{/* Setup checklist */}
				<section className="card stack" style={span({ d: 5, t: 12 }, { gap: 14 })} aria-label="Setup checklist">
					<div className="between">
						<div>
							<p className="card-t">Setup checklist</p>
							<p className="card-s">{current} of 3 done</p>
						</div>
						<span className="badge tr">{pct}</span>
					</div>
					<div
						className="progress progress-thin"
						role="progressbar"
						aria-label="Setup progress"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={Math.round((current / 3) * 100)}>
						<span style={{ width: pct }} />
					</div>
					<ol className="stack-sm" style={{ gap: 10 }}>
						{steps.map((s) => (
							<li
								key={s.no}
								className="row-f"
								aria-current={s.badge === "Now" ? "step" : undefined}
								style={{ gap: 14, padding: 14, borderRadius: 14, border: `1px solid ${s.border}`, background: s.bg }}>
								<span
									style={{
										width: 32,
										height: 32,
										borderRadius: 999,
										display: "grid",
										placeItems: "center",
										fontWeight: 700,
										fontSize: 13,
										flex: "none",
										background: s.numBg,
										color: s.numFg,
									}}>
									{s.done ? <Check className="ic ic-sm" aria-label="Done" /> : s.no}
								</span>
								<div className="li-main">
									<span className="li-t">{s.title}</span>
									<span className="li-s">{s.desc}</span>
								</div>
								<span className={`badge ${s.badgeCls}`}>{s.badge}</span>
							</li>
						))}
					</ol>
				</section>

				{/* Add source form — or, once sources exist, the sources list */}
				{formOpen ? (
					<section id="add-source" className="card stack" style={span({ d: 7, t: 12 }, { gap: 18 })} aria-label="Add a source">
						<div className="row-f" style={{ gap: 12 }}>
							<span className="ic-tile ic-tile-lg">
								<Wallet className="ic ic-lg" aria-hidden="true" />
							</span>
							<div>
								<p className="card-t" style={{ fontSize: 17 }}>
									{hasSources ? "Add another source" : "Add your first source"}
								</p>
								<p className="card-s">
									{isAllView
										? "Open a space first — sources belong to a single space."
										: "A source is anywhere you keep money. You can add more later."}
								</p>
							</div>
						</div>
						<div className="field">
							<label className="label" htmlFor="fr-name">
								Source name
							</label>
							<input
								ref={nameRef}
								id="fr-name"
								className="input"
								type="text"
								placeholder="e.g. Opay, Access Bank, Cash"
								value={srcName}
								disabled={isAllView}
								onChange={(e) => setSrcName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !saving) {
										e.preventDefault();
										void handleAddSource();
									}
								}}
							/>
							<div className="row-f wrap" style={{ gap: 8, marginTop: 4 }}>
								<span className="t-xs t-muted">Quick pick:</span>
								{PICKS.map(([label, Icon]) => (
									<button
										key={label}
										type="button"
										className={`chip${srcName === label ? " on" : ""}`}
										style={{ height: 30, padding: "0 12px", fontSize: 12 }}
										aria-pressed={srcName === label}
										disabled={isAllView}
										onClick={() => setSrcName(label)}>
										<Icon className="ic ic-xs" aria-hidden="true" />
										{label}
									</button>
								))}
							</div>
						</div>
						<div className="field">
							<label className="label" htmlFor="fr-opening">
								Opening balance
							</label>
							<div className="control">
								<span className="cur" aria-hidden="true">
									₦
								</span>
								<input
									id="fr-opening"
									className="input input-amt"
									inputMode="decimal"
									placeholder="0.00"
									value={opening}
									disabled={isAllView}
									aria-describedby="fr-opening-hint"
									onChange={(e) => setOpening(formatMoneyInput(e.target.value))}
									onKeyDown={(e) => {
										if (e.key === "Enter" && !saving) {
											e.preventDefault();
											void handleAddSource();
										}
									}}
								/>
							</div>
							<span id="fr-opening-hint" className="hint">
								What’s in it right now. You can reconcile against the real figure any time.
							</span>
						</div>
						<div className="row-f wrap" style={{ gap: 10 }}>
							<button
								className="btn btn-primary btn-lg"
								type="button"
								disabled={isAllView || saving || !srcName.trim()}
								onClick={handleAddSource}>
								<Plus className="ic ic-sm" aria-hidden="true" />
								{saving ? "Adding…" : "Add source"}
							</button>
							{isAllView ? (
								<Link className="btn btn-secondary btn-lg" to="/spaces">
									Choose a space
								</Link>
							) : (
								<button className="btn btn-ghost btn-lg" type="button" onClick={() => setFormOpen(false)}>
									Maybe later
								</button>
							)}
						</div>
					</section>
				) : hasSources ? (
					<SourcesCard sources={sources} totalBalance={totalBalance} style={span({ d: 7, t: 12 })} />
				) : (
					<section className="card" style={span({ d: 7, t: 12 })} aria-label="Sources">
						<div className="empty">
							<span className="empty-ic">
								<Wallet className="ic ic-xl" aria-hidden="true" />
							</span>
							<h3 className="t-h3">No sources yet</h3>
							<p>Add a bank account, wallet or cash whenever you’re ready.</p>
							<button className="btn btn-primary btn-sm" type="button" onClick={showForm}>
								<Plus className="ic ic-sm" aria-hidden="true" />
								Add source
							</button>
						</div>
					</section>
				)}

				{/* Space tip */}
				<section className="card stack" style={span({ d: 5, t: 12 }, { gap: 14 })} aria-label="Your space">
					<div className="row-f" style={{ gap: 12 }}>
						<span className="space-dot" style={{ width: 44, height: 44, borderRadius: 12, fontSize: 17 }}>
							{isAllView ? "A" : initialOf(activeSpace?.name)}
						</span>
						<div>
							<p className="card-t">{isAllView ? "You’re viewing all spaces" : `You’re in ${spaceName}`}</p>
							<p className="card-s">
								{isAllView
									? "A read-only overview of every space"
									: activeSpace?.isDefault
										? "Your default space, created for you"
										: `${spaces.length} ${spaces.length === 1 ? "space" : "spaces"} in your account`}
							</p>
						</div>
					</div>
					<p className="t-sm t-fg2">
						Spaces keep money separate by purpose. Sources and transactions in one space never mix with
						another’s — add Business or Savings whenever you need them.
					</p>
					{spaces.length > 0 && (
						<div className="row-f wrap" style={{ gap: 8 }}>
							{spaces.slice(0, 6).map((s) => (
								<span key={s.id} className={`badge ${s.id === activeSpaceId ? "brand" : "outline"}`}>
									{s.name}
								</span>
							))}
						</div>
					)}
					<div>
						<Link className="btn btn-secondary btn-sm" to="/spaces">
							<Layers className="ic ic-sm" aria-hidden="true" />
							Manage spaces
						</Link>
					</div>
				</section>

				{/* Recent transactions — empty */}
				<section className="card card-flush" style={span({ d: 7, t: 12 })} aria-label="Recent transactions">
					<div className="card-h">
						<div>
							<p className="card-t">Recent transactions</p>
							<p className="card-s">
								{isAllView ? "Across all spaces" : `Across all sources in ${spaceName}`}
							</p>
						</div>
					</div>
					<div className="empty">
						<span className="empty-ic">
							<ArrowLeftRight className="ic ic-xl" aria-hidden="true" />
						</span>
						<h3 className="t-h3">No transactions yet</h3>
						<p>
							{hasSources
								? "Record an inflow, outflow or transfer and it’ll show up here."
								: "Once you’ve added a source, record an inflow, outflow or transfer and it’ll show up here."}
						</p>
						<button
							className="btn btn-secondary btn-sm"
							type="button"
							disabled={!hasSources || isAllView}
							onClick={openAddTransaction}>
							<Plus className="ic ic-sm" aria-hidden="true" />
							Add transaction
						</button>
					</div>
				</section>

				{/* Cash flow — empty */}
				<section className="card chart" style={span({ d: 5, t: 12 })} aria-label="Cash flow">
					<div className="card-h" style={{ marginBottom: 4 }}>
						<div>
							<p className="card-t">Cash flow</p>
							<p className="card-s">Inflow vs outflow · monthly</p>
						</div>
					</div>
					<div className="chart-plot" style={{ height: 150, paddingLeft: 0 }} aria-hidden="true">
						{[
							[30, 18],
							[42, 26],
							[36, 30],
							[55, 34],
							[48, 28],
							[62, 40],
						].map(([a, b], i) => (
							<div key={i} className="bar-grp">
								<span className="bar" style={{ height: `${a}%`, background: "var(--sunken)" }} />
								<span className="bar" style={{ height: `${b}%`, background: "var(--sunken)" }} />
							</div>
						))}
					</div>
					<div className="row-f" style={{ gap: 10, alignItems: "flex-start" }}>
						<span className="ic-tile neutral">
							<ChartColumn className="ic" aria-hidden="true" />
						</span>
						<p className="t-sm t-muted">
							Your chart fills in after your first few transactions — monthly by default, or weekly,
							bi-weekly and yearly.
						</p>
					</div>
				</section>
			</div>
		</main>
	);
}
