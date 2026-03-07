import { ChevronRight, Edit, Settings, User, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OutflowOverviewChart } from "@/components/charts/OutflowChart";
import { TransferOverviewChart } from "@/components/charts/TransferChart";
import InflowOverviewChart from "@/components/charts/InflowChart";

export default function SourcePage() {
	const criteriaMet = false;
	const labels = ["Housing", "Food", "Transport", "Savings", "Entertainment"];

	const data = [500, 250, 150, 300, 100];

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
				<ul className=" w-full">
					<li className="mt-2.5 w-full bg-white rounded-xl shadow-md p-3 border border-gray-200 divide-y divide-gray-300">
						<div className=" flex items-center justify-between py-1">
							<div className="flex items-center space-x-2">
								<Wallet className="text-green-700 size-4.5" />
								<p className="font-semibold">Salary</p>
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

				{!criteriaMet && (
					<div className="mt-2.5 w-full bg-white rounded-xl shadow-md p-3 border border-gray-200">
						<Tabs defaultValue="account" className="w-100">
							<TabsList>
								<TabsTrigger value="inflow" >Inflow</TabsTrigger>
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
			</div>
		</div>
	);
}
