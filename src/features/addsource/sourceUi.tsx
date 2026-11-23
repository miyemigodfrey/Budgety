"use client";

import {
	Banknote,
	Landmark,
	PiggyBank,
	Smartphone,
	Wallet,
	type LucideIcon,
} from "lucide-react";
import type { Granularity } from "@/api/transaction";
import { formatPeriod } from "@/lib/formatPeriod";
import "./sources.css";

/** The five chart colours, cycled per source so each one keeps its own colour. */
const COLORS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)"];

/**
 * Icon and colour for a source. Sources have no "kind" in the data, so the icon
 * is a best guess from the name (cash, savings, mobile wallet, bank); anything
 * unrecognised gets the generic wallet.
 */
export function sourceLook(name: string, index: number): { Icon: LucideIcon; color: string } {
	const n = name.toLowerCase();
	let Icon: LucideIcon = Wallet;
	if (/\bcash\b/.test(n)) Icon = Banknote;
	else if (/sav|piggy|vault/.test(n)) Icon = PiggyBank;
	else if (/opay|kuda|palm ?pay|monie|wallet|mobile|momo|paga|chipper/.test(n)) Icon = Smartphone;
	else if (/bank|access|gtb|gtco|zenith|uba|first|wema|fidelity|stanbic|sterling|union|polaris|ecobank|fcmb/.test(n))
		Icon = Landmark;
	return { Icon, color: COLORS[index % COLORS.length]! };
}

/** "14 Aug 2025" */
export const shortDate = (d: Date | string) =>
	new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** "Today", "22 Nov", or "22 Nov 2025" for another year. */
export const rowDate = (d: Date | string) => {
	const date = new Date(d);
	const now = new Date();
	if (date.toDateString() === now.toDateString()) return "Today";
	return date.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
	});
};

/** Compact axis label, e.g. ₦450K. */
export const compactMoney = (major: number, currency = "NGN") =>
	new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency,
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(major);

export const GRANULARITIES: { id: Granularity; label: string; per: string; noun: string }[] = [
	{ id: "weekly", label: "Weekly", per: "week", noun: "weeks" },
	{ id: "biweekly", label: "Bi-weekly", per: "two weeks", noun: "periods" },
	{ id: "monthly", label: "Monthly", per: "month", noun: "months" },
	{ id: "yearly", label: "Yearly", per: "year", noun: "years" },
];

export const granularityInfo = (g: Granularity) =>
	GRANULARITIES.find((x) => x.id === g) ?? GRANULARITIES[2]!;

/**
 * The canvas CSS bar chart (.chart-plot / .chart-grid / .bar) for one series.
 * Values are major units; the y axis rounds the peak up to a tidy number.
 */
export function BarPlot({
	points,
	barClass = "",
	height = 220,
	barMaxWidth = 28,
	currency = "NGN",
	label,
}: {
	points: { period: string; value: number }[];
	barClass?: string;
	height?: number;
	barMaxWidth?: number;
	currency?: string;
	/** Accessible name, e.g. "Inflow per month". */
	label: string;
}) {
	const peak = Math.max(...points.map((p) => p.value), 1);
	const mag = Math.pow(10, Math.floor(Math.log10(peak)));
	const max = Math.ceil((peak * 1.1) / (mag / 2)) * (mag / 2);
	const full = (v: number) =>
		new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format(v);
	const summary = points.map((p) => `${formatPeriod(p.period)} ${full(p.value)}`).join(", ");

	return (
		<>
			<div className="chart-plot" style={{ height }} role="img" aria-label={`${label}: ${summary}`}>
				<div className="chart-grid" aria-hidden="true">
					{[1, 0.75, 0.5, 0.25].map((f) => (
						<span key={f} data-v={compactMoney(max * f, currency)} />
					))}
					<span data-v="0" />
				</div>
				{points.map((p) => (
					<div
						key={p.period}
						className="bar-grp"
						title={`${formatPeriod(p.period)}: ${full(p.value)}`}
						aria-hidden="true">
						<span
							className={`bar ${barClass}`}
							style={{ height: `${Math.max(1.5, (p.value / max) * 100).toFixed(1)}%`, maxWidth: barMaxWidth }}
						/>
					</div>
				))}
			</div>
			<div className="chart-x" aria-hidden="true">
				{points.map((p) => (
					<span key={p.period}>{formatPeriod(p.period)}</span>
				))}
			</div>
		</>
	);
}

/** Load failure with a retry, in the canvas card style. */
export function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
	return (
		<section className="card empty" role="alert">
			<p className="t-h3 out">{message}</p>
			{onRetry && (
				<button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
					Try again
				</button>
			)}
		</section>
	);
}

/** "+₦1,000.00" / "−₦1,000.00" from a signed minor-unit amount. */
export function signed(amount: bigint, format: (v: bigint) => string) {
	return amount < 0n ? `−${format(-amount)}` : `+${format(amount)}`;
}
