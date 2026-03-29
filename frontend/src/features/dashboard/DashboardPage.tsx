import { Button } from "@/components/ui/button";
import { FileText, Plus, Settings } from "lucide-react";
import AddSourceModal from "@/features/addsource/sourceModal";
import budgetydash from "@/assets/budgety-dashboard.png";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import AddTransactionModal from "../transactions/transactionModal";
import { getSources, type SourceDto } from "@/api/sources";

export function TableDemo() {
	const [sources, setSources] = useState<SourceDto[]>([]);

	useEffect(() => {
		async function fetchData() {
			try {
				const [sourceData] = await Promise.all([getSources()]);
				setSources(sourceData);
			} catch (error) {
				console.error("Failed to fetch data:", error);
			}
		}
		fetchData();
	}, []);

	return (
		<>
			<Table>
				<TableBody>
					{sources.map((source) => {
						return (
							<TableRow key={source.id}>
								<TableCell className="font-semibold flex items-center gap-x-1.5">
									<FileText size={16} className="text-green-700" />
									{source.name}
								</TableCell>
								<TableCell className="text-gray-500 text-xs">
									{source.createdAt}
								</TableCell>
								<TableCell className="text-right font-semibold">
									{source.currency} {source.initialBalance}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</>
	);
}

function Dashboard() {
	const criteriaMet = true;
	const [open, setOpen] = useState(false);
	const [transactionOpen, setTransactionOpen] = useState(false);

	return (
		<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
			{/* HEADER */}
			<header className="w-full max-w-5xl">
				<div className="flex items-center justify-between p-2">
					<h1 className="font-bold text-2xl">Budgety</h1>
					<Settings className="text-gray-500 size-6" />
				</div>
			</header>

			<div className="flex-1 w-full max-w-5xl flex flex-col items-center mt-6">
				{/* IMAGE + SETUP SECTION */}
				<div className="w-full flex flex-col lg:flex-row gap-8 items-center lg:items-start">
					{/* IMAGE */}

					<img
						src={budgetydash}
						alt="Dashboard illustration"
						className="w-full md:w-[90%] lg:w-[45%] drop-shadow-2xl rounded-xl border border-gray-100 contrast-125 saturate-125"
					/>

					{/* SETUP CARD */}
					<div className="w-full md:w-full p-5 bg-white md:bg-inherit rounded-3xl shadow-2xl md:shadow-none flex flex-col items-center gap-y-3 text-center">
						<div className="space-y-2">
							<h2 className="text-2xl md:text-[34px] lg:text-[50px] font-semibold">
								Set Up your Budget Workspace
							</h2>
							<span className="text-gray-500 md:text-xl">
								A smart way to manage your budget with budgety
							</span>
						</div>
						<Button
							className="w-full bg-blue-800"
							onClick={() => setOpen(true)}>
							Start Setup
						</Button>
					</div>
				</div>

				{/* TABLE BELOW */}
				{criteriaMet && (
					<div className="mt-8 w-full p-6 bg-white rounded-xl shadow-md">
						<h3 className="font-semibold md:text-3xl mb-3">
							Set Up Your Sources
						</h3>
						<TableDemo />
						<div className="w-full mt-4">
							<Button
								onClick={() => setTransactionOpen(true)}
								className="w-full bg-blue-800 md:py-3">
								<Plus size={26} className="text-white" />
								<span className="md:hidden">Add Transaction</span>
								<span className="hidden md:block">Continue to Dashboard</span>
							</Button>
						</div>
					</div>
				)}

				<AddSourceModal open={open} setOpen={setOpen} />
				<AddTransactionModal
					open={transactionOpen}
					setOpen={setTransactionOpen}
				/>
			</div>
		</div>
	);
}

export default Dashboard;
