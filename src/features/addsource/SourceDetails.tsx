"use client";

import { ArrowLeft, ArrowUpDown, Pencil, Wallet } from "lucide-react";
import { TotalTransactionBarChart } from "@/components/charts/TransactionChart";
import { useNavigate, useParams } from "react-router-dom";
import {
	getSourceById,
	type SourceId,
	getSummary,
	type SourceSummary,
} from "@/api/sources";
import EditTransactionModal from "@/features/transactions/EditTransactionModal";
import {
	getTrends,
	type Granularity,
	type TransactionDto,
} from "@/api/transaction";
import {
	GranularitySelect,
	granularityLabel,
} from "@/components/charts/GranularitySelect";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/formatDate";
import { formatCurrency } from "@/lib/formatCurrency";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

function SourcesIdPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [data, setData] = useState<SourceId | null>(null);
	const [period, setPeriod] = useState<SourceSummary["period"]>("monthly");
	const [summary, setSummary] = useState<SourceSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	const [editing, setEditing] = useState<TransactionDto | null>(null);
	const [editOpen, setEditOpen] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);
	const [granularity, setGranularity] = useState<Granularity>("monthly");
	const [chartSeries, setChartSeries] = useState<
		{ period: string; total: bigint }[]
	>([]);

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
		const fetchData = async () => {
			if (!id) return;
			setLoading(true);
			setError(null);
			try {
				const [source, summaryData] = await Promise.all([
					getSourceById(id),
					getSummary(id, period),
				]);
				setData(source);
				setSummary(summaryData);
			} catch (err) {
				console.error("Failed to fetch data:", err);
				setError("Failed to load data. Please try again.");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [id, period, reloadKey]);

	// Per-source chart series, pulled from the space-wide trends (reuses the
	// backend's period windows) and narrowed to this source. Fixes the chart
	// that previously rendered with no data.
	useEffect(() => {
		if (!id) return;
		let cancelled = false;
		getTrends(6, granularity)
			.then((trends) => {
				if (cancelled) return;
				setChartSeries(
					trends.bySource.map((w) => ({
						period: w.period,
						total:
							w.values.find((v) => v.sourceId === id)?.total ?? BigInt(0),
					})),
				);
			})
			.catch((e) => console.error("Failed to load source chart:", e));
		return () => {
			cancelled = true;
		};
	}, [id, granularity, reloadKey]);

	if (loading) {
		return (
			<div className="min-h-screen w-full flex flex-col items-center py-6 px-4 gap-4">
				<Skeleton className="w-full max-w-5xl h-10" />
				<Skeleton className="w-full h-28 rounded-xl" />
				<div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
					{[0, 1, 2].map((i) => (
						<Skeleton key={i} className="w-full h-28 rounded-xl" />
					))}
				</div>
			</div>
		);
	}
	if (error || !data) {
		return (
			<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
				<ErrorState
					message={error ?? "This source couldn't be found."}
					onRetry={() => window.location.reload()}
				/>
			</div>
		);
	}

	const cards = [
		{
			title: "Total Balance",
			value: formatCurrency(data?.balance, data?.currency),
			sub: `In: ${data?.name}`,
			color: "",
			showSelect: false,
		},
		{
			title: "Total Inflow",
			value: `+${formatCurrency(summary?.inflow ?? 0, data?.currency)}`,
			color: "text-success",
			showSelect: true,
		},
		{
			title: "Total Outflow",
			value: `-${formatCurrency(summary?.outflow ?? 0, data?.currency)}`,
			color: "text-danger",
			showSelect: true,
		},
	];

	return (
		<>
			<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
				<header className="w-full max-w-5xl">
					<div className="flex items-center justify-between p-2">
						<button
							type="button"
							onClick={() => navigate(-1)}
							aria-label="Go back"
							className="text-muted-foreground hover:text-foreground">
							<ArrowLeft className="size-6" />
						</button>
						<h1 className="font-bold text-2xl"> {data?.name} </h1>
						<span className="size-6" aria-hidden="true" />
					</div>
				</header>

				<div className="bg-brand-emphasis p-4 mt-4 w-full rounded-xl shadow-md mb-6">
					<h3 className=" font-semibold text-brand-foreground text-xl">My {data?.name}</h3>
					<p className="text-3xl font-semibold text-brand-foreground ">
						{formatCurrency(data?.initialBalance, data?.currency)}
					</p>
					<p className="text-xl font-semibold text-end text-brand-foreground ">
						{formatCurrency(data?.balance, data?.currency)}
					</p>
				</div>

				<select
					value={period}
					onChange={(e) => setPeriod(e.target.value as SourceSummary["period"])}
					aria-label="Summary period"
					className="border p-2 rounded text-sm text-foreground w-40 self-end mb-2">
					<option value="daily">Daily</option>
					<option value="monthly">Monthly</option>
					<option value="yearly">Yearly</option>
					<option value="all">All</option>
				</select>

				<div className="w-full max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
					{cards.map((card, index) => (
						<div
							key={index}
							className="lg:col-span-4 bg-card rounded-xl shadow-md p-5">
							<h3 className="text-muted-foreground text-sm">{card.title}</h3>

							<p className={`text-2xl font-semibold mt-2 ${card.color}`}>
								{card.value}
							</p>

							{card.sub && (
								<p className="text-sm text-muted-foreground mt-1">{card.sub}</p>
							)}

							<p className="text-sm text-muted-foreground mt-1">{getPeriodLabel()}</p>
						</div>
					))}
				</div>

				<div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-6 items-start mt-6">
					{/* LEFT SECTION */}
					<div className="w-full lg:col-span-2 bg-card rounded-xl shadow-md space-y-3 p-8">
						<div className="flex items-center justify-between">
							<h2 className=" font-semibold text-foreground">
								Recent Transactions
							</h2>

							{data.transactions.length > 0 && (
								<button
									type="button"
									onClick={() =>
										setSortDir((d) => (d === "desc" ? "asc" : "desc"))
									}
									className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted"
									aria-label={`Sort by date ${sortDir === "desc" ? "ascending" : "descending"}`}>
									<ArrowUpDown size={13} />
									{sortDir === "desc" ? "Newest" : "Oldest"}
								</button>
							)}
						</div>
						{data.transactions.length === 0 && (
							<EmptyState
								icon={Wallet}
								title="No transactions yet"
								description={`Transactions for ${data.name} will appear here.`}
							/>
						)}
						<ul>
							{[...data.transactions]
								.sort((a, b) => {
									const byDate =
										new Date(a.date).getTime() - new Date(b.date).getTime();
									const key =
										byDate !== 0
											? byDate
											: new Date(a.createdAt).getTime() -
												new Date(b.createdAt).getTime();
									return sortDir === "desc" ? -key : key;
								})
								.map((sourcetrans) => {
									return (
										<li
											key={sourcetrans.id}
											className={cn(
												"pb-4 pt-2 border-b border-border flex items-start justify-between gap-3",
												sourcetrans.type === "inflow"
													? "text-success"
													: "text-danger",
											)}>
											<div className="flex items-start gap-3">
												<div
													className={cn(
														"flex items-center justify-center w-10 h-10 rounded-full",
														sourcetrans.type === "inflow"
															? "bg-success-surface"
															: "bg-danger-surface",
													)}>
													<Wallet className=" w-5 h-5" />
												</div>

												<div className="space-y-1">
													<p className="font-semibold text-sm md:text-base">
														{sourcetrans.category}
													</p>

													<p className="text-xs md:text-sm text-muted-foreground">
														{formatDate(sourcetrans.date)}
													</p>
												</div>
											</div>

											<div className="flex flex-col items-end gap-1">
												<p className=" font-semibold text-sm md:text-base whitespace-nowrap">
													{formatCurrency(sourcetrans.amount, data?.currency)}
												</p>
												<button
													type="button"
													aria-label="Edit transaction"
													onClick={() => {
														setEditing(sourcetrans as TransactionDto);
														setEditOpen(true);
													}}
													className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] text-muted-foreground transition hover:bg-muted hover:text-foreground">
													<Pencil size={10} />
													Edit
												</button>
											</div>
										</li>
									);
								})}
						</ul>
					</div>

					{/* RIGHT SECTION */}
					<div className="lg:col-span-3 w-full h-full">
						<div className="mb-2 flex items-center justify-end">
							<GranularitySelect
								value={granularity}
								onChange={setGranularity}
							/>
						</div>
						<TotalTransactionBarChart
							series={chartSeries}
							description={`${granularityLabel(granularity)} totals for ${data?.name ?? "this source"}`}
						/>
					</div>
				</div>
			</div>

			<EditTransactionModal
				transaction={editing}
				open={editOpen}
				setOpen={setEditOpen}
				onUpdated={() => setReloadKey((k) => k + 1)}
			/>
		</>
	);
}

export default SourcesIdPage;