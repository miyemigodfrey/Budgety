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

				<div className="w-full flex flex-col lg:flex-row">
					<div className="w-full flex-1">
						<div className="mt-8 w-full bg-white rounded-xl shadow-md">
							<h2 className="p-4 font-semibold text-gray-700">
								Recent Transactions
							</h2>

							<ul className="px-4">
								<li className="pb-4 pt-2 border-b flex items-start justify-between border-gray-200">
									<Wallet className="text-green-700" />
									<div className="space-y-1">
										<p className="font-semibold">Salary</p>
										<p className="text-xs md:text-sm text-gray-500">
											Added on 1st Jan 2024
										</p>
										<span className="font-semibold text-sm text-gray-600 bg-gray-300 shadow-2xl px-3 py-1 rounded-2xl border-gray-400">
											Opay
										</span>
									</div>
									<p className="text-green-700 font-semibold">+£8,000</p>
								</li>

								<li className="pb-4 pt-2 border-b flex items-center justify-between border-gray-200">
									<Wallet className="text-red-700" />
									<div className="space-y-1">
										<p className="font-semibold">Grocery Shopping</p>
										<p className="text-xs md:text-sm text-gray-500">
											Deducted on 2nd Jan 2024
										</p>
										<span className="font-semibold text-sm text-gray-600 bg-gray-300 shadow-2xl px-3 py-1 rounded-2xl border-gray-400">
											Access
										</span>
									</div>
									<p className="text-red-700 font-semibold">-£200</p>
								</li>

								<li className="pb-4 pt-2 flex items-center justify-between">
									<Wallet className="text-green-700" />
									<div className="space-y-1">
										<p className="font-semibold">Freelance Work</p>
										<p className="text-xs md:text-sm text-gray-500">
											Added on 3rd Jan 2024
										</p>
										<span className="font-semibold text-sm text-gray-600 bg-gray-300 shadow-2xl px-3 py-1 rounded-2xl border-gray-400">
											Cash
										</span>
									</div>
									<p className="text-green-700 font-semibold">+£1,500</p>
								</li>
							</ul>
						</div>

						<div className="flex items-center justify-between mt-4 w-full">
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
					<div className="flex-1"></div>
				</div>
			</div>
		</>
	);
}

export default TransactionPage;
