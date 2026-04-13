import { Download, Ellipsis, Wallet } from "lucide-react";
import { TotalTransactionBarChart } from "@/components/charts/TransactionChart";
import { useParams } from "react-router-dom";
import { getSourceById } from "@/api/sources";
import { useEffect, useState } from "react";

function SourcesIdPage() {
	const { id } = useParams();
	const [data, setData] = useState<unknown>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchSourceId = async () => {
			try {
				if (!id) return;
				const result = await getSourceById(id);
				setData(result);
			} catch (error) {
				console.error("Failed to fetch source:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchSourceId();
	}, [id]);

	if (loading) return <p>Loading...</p>;

	return (
		<>
			<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
				<header className="w-full max-w-5xl">
					<div className="flex items-center justify-between p-2">
						<h1 className="font-bold text-2xl">My Opay</h1>
						<Download className="text-gray-500 size-6" />
						{/**Change to back button */}
					</div>
				</header>

				<div className="bg-blue-700/70 rounded-t-xl p-4 mt-4 w-full  rounded-xl shadow-md">
					<h3 className=" font-semibold text-white text-xl">My Opay</h3>
					<p className="text-3xl font-semibold text-white ">£100,000 </p>
					<p className="text-xl font-semibold text-end text-gray-200 ">
						£23,901
					</p>
				</div>

				<div className="w-full max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
					<div className="lg:col-span-4 bg-white rounded-xl shadow-md p-5">
						<h3 className="text-gray-500 text-sm">Total Balance</h3>
						<p className="text-3xl font-bold mt-2">£5,450</p>
						<p className="text-sm text-gray-500 mt-1">In Opay</p>
					</div>

					{/* INFLOW SUMMARY */}
					<div className="lg:col-span-4 bg-white rounded-xl shadow-md p-5">
						<h3 className="text-gray-500 text-sm">Total Inflow</h3>
						<p className="text-2xl font-semibold text-green-700 mt-2">
							+£2,207
						</p>
						<p className="text-sm text-gray-500 mt-1">This month</p>
					</div>

					{/* OUTFLOW SUMMARY */}
					<div className="lg:col-span-4 bg-white rounded-xl shadow-md p-5">
						<h3 className="text-gray-500 text-sm">Total Outflow</h3>
						<p className="text-2xl font-semibold text-red-700 mt-2">-£1,120</p>
						<p className="text-sm text-gray-500 mt-1">This month</p>
					</div>
				</div>

				<pre>{JSON.stringify(data, null, 2)}</pre>

				<div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-6 items-start mt-6">
					{/* LEFT SECTION */}
					<div className="w-full lg:col-span-2 bg-white rounded-xl shadow-md space-y-3 p-8">
						<div className="flex items-center justify-between">
							<h2 className=" font-semibold text-gray-700">
								Recent Transactions
							</h2>

							<Ellipsis />
						</div>

						<ul>
							{/* Transaction 1 */}
							<li className="pb-4 pt-2 border-b border-gray-200 flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-200">
										<Wallet className="text-green-700 w-5 h-5" />
									</div>

									<div className="space-y-1">
										<p className="font-semibold text-sm md:text-base">Salary</p>

										<p className="text-xs md:text-sm text-gray-500">
											Added on 1st Jan 2024
										</p>
									</div>
								</div>

								<p className="text-green-700 font-semibold text-sm md:text-base whitespace-nowrap">
									+£1,500
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
									</div>
								</div>

								<p className="text-red-700 font-semibold text-sm md:text-base whitespace-nowrap">
									-£209
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
									</div>
								</div>

								<p className="text-green-700 font-semibold text-sm md:text-base whitespace-nowrap">
									+£575
								</p>
							</li>

							<li className="pb-4 pt-2 border-b border-gray-200 flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-200">
										<Wallet className="text-red-700 w-5 h-5" />
									</div>

									<div className="space-y-1">
										<p className="font-semibold text-sm md:text-base">
											Jewellery Shopping
										</p>

										<p className="text-xs md:text-sm text-gray-500">
											Added on 31st Jan 2024
										</p>
									</div>
								</div>

								<p className="text-red-700 font-semibold text-sm md:text-base whitespace-nowrap">
									-£699
								</p>
							</li>
						</ul>
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

export default SourcesIdPage;
