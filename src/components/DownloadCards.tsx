"use client";

import { ClipboardList, FileSpreadsheet, FolderPlus, Download } from "lucide-react";
import { pdfHref, csvHref } from "@/api/export";

// Current-month date range (YYYY-MM-DD), used for both PDF and CSV export.
const getCurrentMonthRange = () => {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	const toIso = (d: Date) => d.toISOString().split("T")[0]!;
	return { startDate: toIso(start), endDate: toIso(end) };
};

export function DownloardCards() {
	// Same-origin downloads via a plain anchor — the session cookie is sent
	// automatically and the browser handles the file save natively.
	const { startDate, endDate } = getCurrentMonthRange();
	return (
		<div className="w-full max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
			<div className="lg:col-span-4 bg-brand-emphasis rounded-xl shadow-md p-5 space-y-2">
				<h3 className="text-brand-foreground text-[16px] font-semibold">Export CSV</h3>
				<FileSpreadsheet className="text-brand-foreground" />
				<div className="flex items-center justify-between">
					<p className="text-sm text-brand-foreground mt-1">This month</p>
					<a
						href={csvHref(startDate, endDate)}
						download
						aria-label="Export transactions as CSV for this month"
						className="rounded p-1 hover:bg-brand/40">
						<Download className="text-brand-foreground size-6" />
					</a>
				</div>
			</div>

			<div className="lg:col-span-4 bg-card rounded-xl shadow-md p-5 space-y-2">
				<h3 className="text-success text-[16px] font-semibold">
					Generate PDF
				</h3>
				<ClipboardList className="text-success" />
				<div className="flex items-center justify-between">
					<p className="text-sm text-success mt-1">This month</p>
					<a
						href={pdfHref(startDate, endDate)}
						download
						aria-label="Generate PDF report for this month"
						className="rounded p-1 hover:bg-muted">
						<Download className="text-muted-foreground size-6" />
					</a>
				</div>
			</div>

			<div
				className="lg:col-span-4 bg-danger/60 rounded-xl shadow-md p-5 space-y-2 opacity-70"
				title="CSV import is not available yet">
				<h3 className="text-brand-foreground text-[16px] font-semibold">Import CSV</h3>
				<FolderPlus className="text-brand-foreground" />
				<div className="flex items-center justify-between">
					<p className="text-sm text-brand-foreground mt-1">Coming soon</p>
					<Download className="text-brand-foreground" aria-hidden="true" />
				</div>
			</div>
		</div>
	);
}