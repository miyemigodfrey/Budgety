import {
	TotalTransactionBarChart,
	TransactionBreakdownChart,
} from "@/components/charts/TransactionChart";
import {
	ClipboardList,
	FileSpreadsheet,
	FolderPlus,
	Download,
} from "lucide-react";

export default function ReportPage() {
	return (
		<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
			<header className="w-full max-w-5xl">
				<h1 className="font-bold text-2xl">Report</h1>
			</header>

			<div className="w-full max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
				<div className="lg:col-span-4 bg-blue-700/70 rounded-xl shadow-md p-5 space-y-2">
					<h3 className="text-gray-50 text-[16px] font-semibold">Export CSV</h3>
					<FileSpreadsheet className="text-gray-50" />
					<div className="flex items-center justify-between">
						<p className="text-sm text-gray-50 mt-1">This month</p>
						<Download className="text-gray-200" />
					</div>
				</div>

				<div className="lg:col-span-4 bg-white rounded-xl shadow-md p-5 space-y-2">
					<h3 className="text-green-700 text-[16px] font-semibold">
						Generate PDF
					</h3>
					<ClipboardList className="text-green-700" />
					<div className="flex items-center justify-between">
						<p className="text-sm text-green-700 mt-1">This month</p>
						<Download className="text-gray-400" />
					</div>
				</div>

				<div className="lg:col-span-4 bg-red-700 rounded-xl shadow-md p-5 space-y-2">
					<h3 className="text-gray-50 text-[16px] font-semibold">Import CSV</h3>
					<FolderPlus className="text-gray-50" />
					<div className="flex items-center justify-between">
						<p className="text-sm text-gray-50 mt-1">This month</p>
						<Download className="text-gray-200" />
					</div>
				</div>
			</div>

			<div className="w-full max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
				<div className="lg:col-span-4 bg-white rounded-xl shadow-md p-5">
					<h3 className="text-gray-500 text-sm">Total Balance</h3>
					<p className="text-3xl font-bold mt-2">£12,450</p>
					<p className="text-sm text-gray-500 mt-1">Across all sources</p>
				</div>

				{/* INFLOW SUMMARY */}
				<div className="lg:col-span-4 bg-white rounded-xl shadow-md p-5">
					<h3 className="text-gray-500 text-sm">Total Inflow</h3>
					<p className="text-2xl font-semibold text-green-700 mt-2">+£9,200</p>
					<p className="text-sm text-gray-500 mt-1">This month</p>
				</div>

				{/* OUTFLOW SUMMARY */}
				<div className="lg:col-span-4 bg-white rounded-xl shadow-md p-5">
					<h3 className="text-gray-500 text-sm">Total Outflow</h3>
					<p className="text-2xl font-semibold text-red-700 mt-2">-£4,120</p>
					<p className="text-sm text-gray-500 mt-1">This month</p>
				</div>
			</div>

			<div className="mt-8 w-full bg-white rounded-xl shadow-md p-4">
				<p className="font-bold text-2xl py-2 ">Monthly Summary</p>

				<div className="grid gap-6 md:grid-cols-2 mt-8">
					<TotalTransactionBarChart />
					<TransactionBreakdownChart />
				</div>
			</div>
		</div>
	);
}
