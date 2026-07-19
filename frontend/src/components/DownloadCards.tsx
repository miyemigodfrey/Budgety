import { ClipboardList, FileSpreadsheet, FolderPlus, Download } from "lucide-react";
import { getPdf, getCsv } from "@/api/export";
import { Button } from "./ui/button";
import { toast } from "react-toastify";

// Current-month date range (YYYY-MM-DD), used for both PDF and CSV export.
const getCurrentMonthRange = () => {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	const toIso = (d: Date) => d.toISOString().split("T")[0];
	return { startDate: toIso(start), endDate: toIso(end) };
};

const triggerBlobDownload = (data: BlobPart, filename: string) => {
	const url = window.URL.createObjectURL(new Blob([data]));
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.URL.revokeObjectURL(url);
};

const handlePdfDownload = async () => {
	const { startDate, endDate } = getCurrentMonthRange();
	try {
		const data = await getPdf(startDate, endDate);
		triggerBlobDownload(data, `budgety-report-${startDate}-to-${endDate}.pdf`);
	} catch (error) {
		console.error(error);
		toast.error("Failed to generate PDF.");
	}
};

const handleCsvDownload = async () => {
	const { startDate, endDate } = getCurrentMonthRange();
	try {
		const data = await getCsv(startDate, endDate);
		triggerBlobDownload(data, `budgety-report-${startDate}-to-${endDate}.csv`);
	} catch (error) {
		console.error(error);
		toast.error("Failed to export CSV.");
	}
};

export function DownloardCards() {
	return (
		<div className="w-full max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
			<div className="lg:col-span-4 bg-brand-emphasis rounded-xl shadow-md p-5 space-y-2">
				<h3 className="text-brand-foreground text-[16px] font-semibold">Export CSV</h3>
				<FileSpreadsheet className="text-brand-foreground" />
				<div className="flex items-center justify-between">
					<p className="text-sm text-brand-foreground mt-1">This month</p>
					<Button
						type="button"
						aria-label="Export transactions as CSV for this month"
						className="bg-inherit border-none hover:bg-brand/40"
						onClick={handleCsvDownload}>
						<Download className="text-brand-foreground size-6" />
					</Button>
				</div>
			</div>

			<div className="lg:col-span-4 bg-card rounded-xl shadow-md p-5 space-y-2">
				<h3 className="text-success text-[16px] font-semibold">
					Generate PDF
				</h3>
				<ClipboardList className="text-success" />
				<div className="flex items-center justify-between">
					<p className="text-sm text-success mt-1">This month</p>
					<Button
						type="button"
						aria-label="Generate PDF report for this month"
						className="bg-inherit border-none"
						onClick={handlePdfDownload}>
						<Download className="text-muted-foreground size-6" />
					</Button>
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
