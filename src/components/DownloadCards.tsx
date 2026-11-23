"use client";

import { Download, FileText, Upload } from "lucide-react";
import { pdfHref, csvHref } from "@/api/export";
import { span } from "@/components/app/grid";

// Current-month date range (YYYY-MM-DD, local time), used for both PDF and CSV export.
const getCurrentMonthRange = () => {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	const toIso = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	return {
		startDate: toIso(start),
		endDate: toIso(end),
		monthName: now.toLocaleString("en-US", { month: "long" }),
	};
};

const cardStyle = span({ d: 4, t: 4 }, { gap: 14 });

/** Export CSV / Generate PDF / Import CSV (coming soon) cards on the Reports page. */
export function DownloardCards() {
	// Same-origin downloads via a plain anchor — the session cookie is sent
	// automatically and the browser handles the file save natively.
	const { startDate, endDate, monthName } = getCurrentMonthRange();
	return (
		<div className="g g-stretch">
			<section className="card stack" style={cardStyle} aria-label="Export CSV">
				<div className="between">
					<span className="ic-tile ic-tile-lg">
						<Download className="ic ic-lg" aria-hidden="true" />
					</span>
					<span className="badge">This month</span>
				</div>
				<div className="stack-sm" style={{ gap: 4 }}>
					<p className="card-t">Export CSV</p>
					<p className="t-sm t-muted">
						Every {monthName} transaction as a spreadsheet you can open anywhere.
					</p>
				</div>
				<a
					className="btn btn-secondary btn-block"
					style={{ marginTop: "auto" }}
					href={csvHref(startDate, endDate)}
					download
					aria-label="Download this month's transactions as CSV">
					<Download className="ic ic-sm" aria-hidden="true" />
					Download CSV
				</a>
			</section>

			<section className="card stack" style={cardStyle} aria-label="Generate PDF">
				<div className="between">
					<span className="ic-tile ic-tile-lg in">
						<FileText className="ic ic-lg" aria-hidden="true" />
					</span>
					<span className="badge">This month</span>
				</div>
				<div className="stack-sm" style={{ gap: 4 }}>
					<p className="card-t">Generate PDF</p>
					<p className="t-sm t-muted">
						A tidy statement with totals per source and your category breakdown.
					</p>
				</div>
				<a
					className="btn btn-secondary btn-block"
					style={{ marginTop: "auto" }}
					href={pdfHref(startDate, endDate)}
					download
					aria-label="Generate a PDF report for this month">
					<FileText className="ic ic-sm" aria-hidden="true" />
					Generate PDF
				</a>
			</section>

			<section
				className="card stack"
				style={{ ...cardStyle, background: "var(--surface-2)", boxShadow: "none" }}
				aria-label="Import CSV, coming soon">
				<div className="between">
					<span className="ic-tile ic-tile-lg neutral">
						<Upload className="ic ic-lg" aria-hidden="true" />
					</span>
					<span className="badge outline">Coming soon</span>
				</div>
				<div className="stack-sm" style={{ gap: 4 }}>
					<p className="card-t t-fg2">Import CSV</p>
					<p className="t-sm t-muted">
						Bring in transactions from your bank statement. Not available yet.
					</p>
				</div>
				<button
					className="btn btn-secondary btn-block"
					type="button"
					disabled
					style={{ marginTop: "auto" }}>
					<Upload className="ic ic-sm" aria-hidden="true" />
					Import CSV
				</button>
			</section>
		</div>
	);
}
