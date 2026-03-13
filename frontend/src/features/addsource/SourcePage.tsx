import { ChevronRight, Edit, Settings, User, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OutflowOverviewChart } from "@/components/charts/OutflowChart";
import { TransferOverviewChart } from "@/components/charts/TransferChart";
import InflowOverviewChart from "@/components/charts/InflowChart";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AddSourceModal from "./sourceModal";
import AddTransactionModal from "../transactions/transactionModal";
import { getSources, type SourceDto } from "@/api/sources";

export default function SourcePage() {
	const criteriaMet = false;
	const labels = ["Housing", "Food", "Transport", "Savings", "Entertainment"];

	const data = [500, 250, 150, 300, 100];

	const [open, setOpen] = useState(false);
	const [transactionOpen, setTransactionOpen] = useState(false);
	const [source, setSource] = useState<SourceDto[]>([]);

	const sourceList = async () => {
		try {
			const data = await getSources({
				id: "",
				name: "",
				balance: 0,
				currency: "",
				createdAt: "",
				updatedAt: "",
				userId: "",
			});
			setSource(data);
		} catch (error) {
			console.error("Failed to fetch sources:", error);
		}
	};

	return (
		<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
			<header className="w-full max-w-5xl">
				<div className="flex items-center justify-between p-2">
					<h1 className="font-bold text-2xl">Set Up Your Source</h1>
					<Settings className="text-gray-500 size-6" />
				</div>
			</header>

			<div className=" w-full flex flex-col lg:flex-row items-start gap-4 mt-8">
				{/**Source List populated based on the user's sources in modal */}
				<div className=" w-full">
					{/**not -working ----------- MAP THROUGH SOURCES AND DISPLAY IN A CARD FORMAT  */}
					<ul className=" w-full">
						{source.map((item) => (
							<li
								key={item.id}
								className="mt-2.5 w-full bg-white rounded-xl shadow-md p-3 border border-gray-200 divide-y divide-gray-300">
								<div className=" flex items-center justify-between py-1">
									<div className="flex items-center space-x-2">
										<Wallet className="text-green-700 size-4.5" />
										<p className="font-semibold">{item.name}</p>
									</div>

									<p className="text-lg md:text-xl text-gray-700 font-semibold">
										{/**remaining balance */} £2369
									</p>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1">
										<span className="text-gray-500 text-xs md:text-sm py-3">
											{/**initial Amount */} Initial Amount | £{item.balance}
										</span>
										<Edit className="size-4 text-gray-500" />
									</div>

									{/**LINK TO GO SOURCE DETAILS */}
									<ChevronRight className="text-gray-500 size-4.5" />
								</div>
							</li>
						))}
					</ul>

					<ul className=" w-full">
						<li className="mt-2.5 w-full bg-white rounded-xl shadow-md p-3 border border-gray-200 divide-y divide-gray-300">
							<div className=" flex items-center justify-between py-1">
								<div className="flex items-center space-x-2">
									<Wallet className="text-green-700 size-4.5" />
									<p className="font-semibold">{sourceList.name}</p>
								</div>

								<p className="text-lg md:text-xl text-gray-700 font-semibold">
									{/**remaining balance */} £2369
								</p>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-1">
									<span className="text-gray-500 text-xs md:text-sm py-3">
										{/**initial Amount */} Initial Amount | £40,000
									</span>
									<Edit className="size-4 text-gray-500" />
								</div>

								{/**LINK TO GO SOURCE DETAILS */}
								<ChevronRight className="text-gray-500 size-4.5" />
							</div>
						</li>

						<li className="mt-2.5 w-full bg-white rounded-xl shadow-md p-3 border border-gray-200 divide-y divide-gray-300">
							<div className=" flex items-center justify-between py-1">
								<div className="flex items-center space-x-2">
									<Edit className="text-green-700 size-4.5" />
									<p className="font-semibold">Opay</p>
								</div>
								<p className="text-lg md:text-xl text-gray-700 font-semibold">
									{/**remaining balance */} £12,009
								</p>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-1">
									<span className="text-gray-500 text-xs md:text-sm py-3">
										{/**initial Amount */} Initial Amount | £60,000
									</span>
									<Edit className="size-4 text-gray-500" />
								</div>

								{/**LINK TO GO SOURCE DETAILS */}
								<ChevronRight className="text-gray-500 size-4.5" />
							</div>
						</li>

						<li className="mt-2.5 w-full bg-white rounded-xl shadow-md p-3 border border-gray-200 divide-y divide-gray-300">
							<div className=" flex items-center justify-between py-1">
								<div className="flex items-center space-x-2">
									<User className="text-green-700 size-4.5" />
									<p className="font-semibold">Access</p>
								</div>
								<p className="text-lg md:text-xl text-gray-700 font-semibold">
									{/**remaining balance */} £4069
								</p>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-1">
									<span className="text-gray-500 text-xs md:text-sm py-3">
										{/**initial Amount */} Initial Amount | £30,000
									</span>
									<Edit className="size-4 text-gray-500" />
								</div>

								{/**LINK TO GO SOURCE DETAILS */}
								<ChevronRight className="text-gray-500 size-4.5" />
							</div>
						</li>
					</ul>

					<div className="hidden md:flex items-center justify-between gap-2 mt-4">
						<Button
							onClick={() => setOpen(true)}
							variant="outline"
							className="border-gray-300 shadow-xl py-5 px-10 hover:bg-green-700/70 hover:text-gray-200 hover:border-green-700 ">
							Add Source
						</Button>
						<Button
							onClick={() => setTransactionOpen(true)}
							variant="outline"
							className="border-gray-300 shadow-xl py-5 px-10 hover:bg-green-700/70 hover:text-gray-200 hover:border-green-700 ">
							Add Transaction
						</Button>
					</div>
				</div>

				{!criteriaMet && (
					<div className="mt-2.5 w-full lg:max-w-md min-w-0 bg-white rounded-xl shadow-md p-3 border border-gray-200">
						<Tabs defaultValue="inflow" className="w-full">
							<TabsList className="w-full grid grid-cols-3">
								<TabsTrigger value="inflow">Inflow</TabsTrigger>
								<TabsTrigger value="outflow">Outflow</TabsTrigger>
								<TabsTrigger value="transfer">Transfer</TabsTrigger>
							</TabsList>

							<TabsContent value="inflow">
								<InflowOverviewChart labels={labels} data={data} />
							</TabsContent>

							<TabsContent value="outflow">
								<OutflowOverviewChart />
							</TabsContent>

							<TabsContent value="transfer">
								<TransferOverviewChart />
							</TabsContent>
						</Tabs>
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
