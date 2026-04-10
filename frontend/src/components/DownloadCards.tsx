import {
	ClipboardList,
	FileSpreadsheet,
	FolderPlus,
	Download,
} from "lucide-react";
import { getPdf } from "@/api/export ";
import { Button } from "./ui/button";

const handleDownload = async () => {
	try {
		const data = await getPdf("2026-01-01", "2026-03-14");

		const url = window.URL.createObjectURL(new Blob([data]));
		const link = document.createElement("a");

		link.href = url;
		link.download = "transactions.pdf";
		document.body.appendChild(link);
		link.click();
		link.remove();
	} catch (error) {
		console.error(error);
	}
};

export function DownloardCards() {
	return (
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
					<Button className="bg-inherit border-none">
						<Download className="text-gray-400 size-6" />
					</Button>
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
	);
}
