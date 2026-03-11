import { Edit, Settings, User, Wallet } from "lucide-react";
import { TableDemo } from "../dashboard/DashboardPage";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TotalTransactionBarChart } from "@/components/charts/TransactionChart";

function TransactionPage() {
	const navigate = useNavigate();

	return (
		<>
			<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
				<header className="w-full max-w-5xl">
					<div className="flex items-center justify-between p-2">
						<h1 className="font-bold text-2xl">Transaction</h1>
						<Settings className="text-gray-500 size-6" />
					</div>
				</header>

				<div className="mt-8 w-full  bg-white rounded-xl shadow-md">
					<div className="bg-blue-700/70 rounded-t-xl p-4">
						<h3 className=" font-semibold text-white text-xl">Total Initial</h3>
						<p className="text-3xl font-semibold text-white ">£100,000 </p>
					</div>
					<TableDemo />
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
						<p className="text-2xl font-semibold text-green-700 mt-2">
							+£9,200
						</p>
						<p className="text-sm text-gray-500 mt-1">This month</p>
					</div>

					{/* OUTFLOW SUMMARY */}
					<div className="lg:col-span-4 bg-white rounded-xl shadow-md p-5">
						<h3 className="text-gray-500 text-sm">Total Outflow</h3>
						<p className="text-2xl font-semibold text-red-700 mt-2">-£4,120</p>
						<p className="text-sm text-gray-500 mt-1">This month</p>
					</div>
				</div>

				<div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-6 items-start mt-6">
					{/* LEFT SECTION */}
					<div className="lg:col-span-2 w-full">
						<div className="w-full bg-white rounded-xl shadow-md">
							<h2 className="p-4 font-semibold text-gray-700">
								Recent Transactions
							</h2>

							<ul className="px-4">
								{/* Transaction 1 */}
								<li className="pb-4 pt-2 border-b border-gray-200 flex items-start justify-between gap-3">
									<div className="flex items-start gap-3">
										<div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-200">
											<Wallet className="text-green-700 w-5 h-5" />
										</div>

										<div className="space-y-1">
											<p className="font-semibold text-sm md:text-base">
												Salary
											</p>

											<p className="text-xs md:text-sm text-gray-500">
												Added on 1st Jan 2024
											</p>

											<span className="inline-block font-semibold text-xs md:text-sm text-gray-700 bg-gray-200 px-3 py-1 rounded-full">
												Opay
											</span>
										</div>
									</div>

									<p className="text-green-700 font-semibold text-sm md:text-base whitespace-nowrap">
										+£8,000
									</p>
								</li>

								{/* Transaction 2 */}
								<li className="pb-4 pt-2 border-b border-gray-200 flex items-start justify-between gap-3">
									<div className="flex items-start gap-3">
										<div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-200">
											<Wallet className="text-red-700 w-5 h-5" />
										</div>

										<div className="space-y-1">
											<p className="font-semibold text-sm md:text-base">
												Grocery Shopping
											</p>

											<p className="text-xs md:text-sm text-gray-500">
												Added on 21st Jan 2024
											</p>

											<span className="inline-block font-semibold text-xs md:text-sm text-gray-700 bg-gray-200 px-3 py-1 rounded-full">
												Access
											</span>
										</div>
									</div>

									<p className="text-red-700 font-semibold text-sm md:text-base whitespace-nowrap">
										-£200
									</p>
								</li>

								{/* Transaction 3 */}
								<li className="pb-4 pt-2 border-b border-gray-200 flex items-start justify-between gap-3">
									<div className="flex items-start gap-3">
										<div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-200">
											<Wallet className="text-green-700 w-5 h-5" />
										</div>

										<div className="space-y-1">
											<p className="font-semibold text-sm md:text-base">
												Freelance
											</p>

											<p className="text-xs md:text-sm text-gray-500">
												Added on 1st Jan 2024
											</p>

											<span className="inline-block font-semibold text-xs md:text-sm text-gray-700 bg-gray-200 px-3 py-1 rounded-full">
												Cash
											</span>
										</div>
									</div>

									<p className="text-green-700 font-semibold text-sm md:text-base whitespace-nowrap">
										+£1,500
									</p>
								</li>
							</ul>
						</div>

						{/* Buttons */}
						<div className="flex items-center justify-between mt-4 w-full">
							<Button variant="primary">
								<Edit size={16} className="text-gray-50" />
								<span className="text-gray-50">Edit Source</span>
							</Button>

							<Button
								variant="primary"
								onClick={() => navigate("/reconcilation")}>
								<User size={16} className="text-gray-50" />
								<span className="text-gray-50">Reconcile</span>
							</Button>
						</div>
					</div>

					{/* RIGHT SECTION */}
					<div className="hidden md:block lg:col-span-3 w-full h-full">
						<TotalTransactionBarChart />
					</div>
				</div>
			</div>
		</>
	);
}

export default TransactionPage;
