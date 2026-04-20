import { Download, Ellipsis, Wallet } from "lucide-react";
import { TotalTransactionBarChart } from "@/components/charts/TransactionChart";
import { useParams } from "react-router-dom";
import {
	getSourceById,
	type SourceId,
	getSummary,
	type SourceSummary,
} from "@/api/sources";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/formatDate";

function SourcesIdPage() {
	const { id } = useParams();
	const [data, setData] = useState<SourceId | null>(null);
	const [period, setPeriod] = useState("monthly");
	const [summary, setSummary] = useState<SourceSummary | null>(null);
	const [loading, setLoading] = useState(true);

	const cards = [
		{
			title: "Total Balance",
			value: `${data?.currency} ${data?.balance}`,
			sub: `In: ${data?.name}`,
			color: "",
			showSelect: false,
		},
		{
			title: "Total Inflow",
			value: `+${data?.currency} ${summary?.inflow ?? 0}`,
			color: "text-green-700",
			showSelect: true,
		},
		{
			title: "Total Outflow",
			value: `-${data?.currency} ${summary?.outflow ?? 0}`,
			color: "text-red-700",
			showSelect: true,
		},
	];

	const getPeriodLabel = () => {
		switch (period) {
			case "daily":
				return "Today";
			case "monthly":
				return "month";
			case "yearly":
				return "year";
			default:
				return "period";
		}
	};

	useEffect(() => {
		const fetchSourceId = async () => {
			try {
				if (!id) {
					setLoading(false);
					return;
				}
				const result = await getSourceById(id);
				setData(result);
				console.log(result);
			} catch (error) {
				console.error("Failed to fetch source:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchSourceId();
	}, [id]);

	useEffect(() => {
		const fetchSummary = async () => {
			if (!id) return;
			try {
				const res = await getSummary(id);
				setSummary(res);
				console.log("Summary:", res);
			} catch (error) {
				console.error("Failed to fetch summary:", error);
			}
		};
		fetchSummary();
	}, [id]);

	if (loading) return <p>Loading...</p>;

	return (
		<>
			<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
				<header className="w-full max-w-5xl">
					<div className="flex items-center justify-between p-2">
						<h1 className="font-bold text-2xl"> {data?.name} </h1>
						<Download className="text-gray-500 size-6" />
						{/**Change to back button */}
					</div>
				</header>

				<div className="bg-blue-700/70 rounded-t-xl p-4 mt-4 w-full  rounded-xl shadow-md">
					<h3 className=" font-semibold text-white text-xl">My {data?.name}</h3>
					<p className="text-3xl font-semibold text-white ">
						{data?.currency}
						{data?.initialBalance}
					</p>
					<p className="text-xl font-semibold text-end text-gray-200 ">
						{data?.currency}
						{data?.balance}
					</p>
				</div>

				<div className="w-full max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
					{cards.map((card, index) => (
						<div
							key={index}
							className="lg:col-span-4 bg-white rounded-xl shadow-md p-5">
							<div className="flex items-center justify-between">
								<h3 className="text-gray-500 text-sm">{card.title}</h3>

								{card.showSelect && (
									<select
										value={period}
										onChange={(e) => setPeriod(e.target.value)}
										className="border p-2 rounded">
										<option value="daily">Daily</option>
										<option value="monthly">Monthly</option>
										<option value="yearly">Yearly</option>
										<option value="all">All</option>
									</select>
								)}
							</div>

							<p className={`text-2xl font-semibold mt-2 ${card.color}`}>
								{card.value}
							</p>

							{card.sub && (
								<p className="text-sm text-gray-500 mt-1">{card.sub}</p>
							)}

							<p className="text-sm text-gray-500 mt-1">{getPeriodLabel()}</p>
						</div>
					))}
				</div>

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
							{data?.transactions.map((sourcetrans) => {
								return (
									<li
										key={sourcetrans.id}
										className={
											`pb-4 pt-2 border-b border-gray-200 flex items-start justify-between gap-3` +
											(sourcetrans.type === "inflow"
												? " text-green-700"
												: " text-red-700")
										}>
										<div className="flex items-start gap-3">
											<div
												className={
													`flex items-center justify-center w-10 h-10 rounded-full bg-green-200"` +
													(sourcetrans.type === "inflow"
														? " bg-green-200"
														: " bg-red-200")
												}>
												<Wallet className=" w-5 h-5" />
											</div>

											<div className="space-y-1">
												<p className="font-semibold text-sm md:text-base">
													{sourcetrans.category}
												</p>

												<p className="text-xs md:text-sm text-gray-500">
													Added on {formatDate(sourcetrans.createdAt)}
												</p>
											</div>
										</div>

										<p className=" font-semibold text-sm md:text-base whitespace-nowrap">
											{data?.currency} {sourcetrans.amount}
										</p>
									</li>
								);
							})}
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
