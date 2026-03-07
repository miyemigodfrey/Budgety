import DonutChart from "@/components/charts/DonutChart";
import {
	ClipboardList,
	Settings,
	FileSpreadsheet,
	FolderPlus,
} from "lucide-react";

export default function ReportPage() {
	const labels = ["Housing", "Food", "Transport", "Savings", "Entertainment"];

	const data = [500, 250, 150, 300, 100];

	return (
		<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
			<header className="w-full max-w-5xl">
				<div className="flex items-center justify-between p-2">
					<h1 className="font-bold text-2xl">Report</h1>
					<Settings className="text-gray-500 size-6" />
				</div>
			</header>

			<div className="mt-8 w-full bg-white rounded-xl shadow-md p-2">
				<ul className="grid grid-cols-[auto_auto_auto] items-center justify-center gap-2">
					<li className="bg-blue-700/70 flex flex-col rounded-lg p-4 mb-4 items-center justify-center gap-1">
						<FileSpreadsheet className="text-gray-50" />
						<p className="font-semibold text-gray-50">Export CSV</p>
					</li>
					<li className="bg-gray-500/70 flex flex-col rounded-lg p-4 mb-4 items-center justify-center gap-1">
						<ClipboardList className="text-gray-50" />
						<p className="font-semibold text-gray-50">Generate PDF</p>
					</li>
					<li className="bg-green-500/70 flex flex-col rounded-lg p-4 mb-4 items-center justify-center gap-1">
						<FolderPlus className="text-gray-50" />
						<p className="font-semibold text-gray-50">Import CSV</p>
					</li>
				</ul>
			</div>

			<div className="mt-8 w-full bg-white rounded-xl shadow-md ">
				<p className="text-bold text-xl">Monthly Summary</p>
				<DonutChart labels={labels} data={data} />
			</div>
		</div>
	);
}
