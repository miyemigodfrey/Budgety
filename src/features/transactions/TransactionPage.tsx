import { Edit, Settings, User, Wallet } from "lucide-react";
import { TableDemo } from "../dashboard/DashboardPage";
import { Button } from "@/components/ui/button";

function TransactionPage() {
	return (
		<>
			<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
				<header className="w-full max-w-5xl">
					<div className="flex items-center justify-between p-2">
						<h1 className="font-bold text-2xl">Budgety</h1>
						<Settings className="text-gray-500 size-6" />
					</div>
				</header>

				<div className="mt-8 w-full  bg-white rounded-xl shadow-md">
					<div className="bg-blue-700/70 rounded-t-xl p-4">
						<h3 className=" font-semibold text-white text-xl">Total Balance</h3>
						<p className="text-3xl font-semibold text-white ">£100,000 </p>
					</div>
					<TableDemo />
				</div>

				<div className="mt-8 w-full bg-white rounded-xl shadow-md">
					<h2 className="p-4 font-semibold text-gray-700">
						Recent Transactions
					</h2>
					
					<ul className="px-4">
						<li className="py-2 border-b flex items-center justify-between border-gray-200">
							<Wallet className="text-green-700" />
							<div>
								<p className="font-semibold">Salary</p>
								<p className="text-xs md:text-sm text-gray-500">
									Added on 1st Jan 2024
								</p>
							</div>
							<p className="text-green-700 font-semibold">+£8,000</p>
						</li>
						<li className="py-2 border-b flex items-center justify-between border-gray-200">
							<Wallet className="text-red-700" />
							<div>
								<p className="font-semibold">Grocery Shopping</p>
								<p className="text-xs md:text-sm text-gray-500">
									Added on 2nd Jan 2024
								</p>
							</div>
							<p className="text-red-700 font-semibold">-£200</p>
						</li>
						<li className="py-2 flex items-center justify-between">
							<Wallet className="text-green-700" />
							<div>
								<p className="font-semibold">Freelance Work</p>
								<p className="text-xs md:text-sm text-gray-500">
									Added on 3rd Jan 2024
								</p>
							</div>
							<p className="text-green-700 font-semibold">+£1,500</p>
						</li>
					</ul>
				</div>

				<div className="flex items-center justify-between mt-8 w-full">
					<Button variant="primary">
						<Edit size={16} className="text-gray-50" />
						<span className="text-gray-50">Edit Source</span>
					</Button>
					<Button variant="primary">
						<User size={16} className="text-gray-50" />
						<span className="text-gray-50">Reconcile</span>
					</Button>
				</div>
			</div>
		</>
	);
}

export default TransactionPage;
