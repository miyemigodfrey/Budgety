"use client";

import { User, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableDemo } from "../dashboard/DashboardPage";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TotalTransactionBarChart } from "@/components/charts/TransactionChart";
import { useCallback, useEffect, useState } from "react";
import { formatDate } from "@/lib/formatDate";
import { formatCurrency } from "@/lib/formatCurrency";
import { EmptyState, ErrorState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { Status } from "@/lib/status";

import { getTransactions, type TransactionDto } from "@/api/transaction";
import {
	getTransactionOverview,
	type TransactionOverviewDto,
} from "@/api/overview";
import { getSources } from "@/api/sources";
import { getSummary, type ReportSummary } from "@/api/export";

type Source = {
	id: string;
	name: string;
	balance?: bigint;
};

function TransactionPage() {
	const navigate = useNavigate();
	const [transactions, setTransaction] = useState<TransactionDto[]>([]);
	const [sources, setSources] = useState<Source[]>([]);
	const [transactionOverview, setTransactionOverview] =
		useState<TransactionOverviewDto | null>(null);
	const [summary, setSummary] = useState<ReportSummary | null>(null);
	const [status, setStatus] = useState<Status>("loading");

	const [reloadKey, setReloadKey] = useState(0);

	const reload = useCallback(() => {
		setStatus("loading");
		setReloadKey((k) => k + 1);
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function fetchData() {
			try {
				const [
					transactionData,
					sourceData,
					transactionOverviewData,
					summaryData,
				] = await Promise.all([
					getTransactions(),
					getSources(),
					getTransactionOverview(),
					getSummary(6),
				]);
				if (cancelled) return;
				setTransaction(transactionData);
				setSources(sourceData);
				setTransactionOverview(transactionOverviewData);
				setSummary(summaryData);
				setStatus("ready");
			} catch (error) {
				if (cancelled) return;
				console.error("Failed to fetch data:", error);
				setStatus("error");
			}
		}

		fetchData();
		return () => {
			cancelled = true;
		};
	}, [reloadKey]);

	return (
		<>
			<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
				<header className="w-full max-w-5xl">
					<div className="flex items-center justify-between p-2">
						<h1 className="font-bold text-2xl">Transaction</h1>
					</div>
				</header>

				<div className="mt-8 w-full  bg-card rounded-xl shadow-md">
					<div className="bg-brand-emphasis rounded-t-xl p-4">
						<h3 className=" font-semibold text-brand-foreground text-xl">Total Initial</h3>
						<p className="text-3xl font-semibold text-brand-foreground ">
							{formatCurrency(transactionOverview?.totalInitialBalance)}
						</p>
					</div>
					<TableDemo />
				</div>

				<div className="w-full max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
					<div className="lg:col-span-4 bg-card rounded-xl shadow-md p-5">
						<h3 className="text-muted-foreground text-sm">Total Balance</h3>
						<p className="text-3xl font-bold mt-2">
							{formatCurrency(transactionOverview?.totalBalance)}
						</p>
						<p className="text-sm text-muted-foreground mt-1">Across all sources</p>
					</div>

					{/* INFLOW SUMMARY */}
					<div className="lg:col-span-4 bg-card rounded-xl shadow-md p-5">
						<h3 className="text-muted-foreground text-sm">Total Inflow</h3>
						<p className="text-2xl font-semibold text-success mt-2">
							+{formatCurrency(transactionOverview?.monthly.inflow)}
						</p>
						<p className="text-sm text-muted-foreground mt-1">This month</p>
					</div>

					{/* OUTFLOW SUMMARY */}
					<div className="lg:col-span-4 bg-card rounded-xl shadow-md p-5">
						<h3 className="text-muted-foreground text-sm">Total Outflow</h3>
						<p className="text-2xl font-semibold text-danger mt-2">
							-{formatCurrency(transactionOverview?.monthly.outflow)}
						</p>
						<p className="text-sm text-muted-foreground mt-1">This month</p>
					</div>
				</div>

				<div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-6 items-start mt-6">
					{/* LEFT SECTION */}
					<div className="lg:col-span-2 w-full">
						<div className="w-full bg-card rounded-xl shadow-md">
							<h2 className="p-4 font-semibold text-foreground">
								Recent Transactions
							</h2>

							{status === "loading" && (
								<div className="px-4 pb-4 space-y-3">
									{[0, 1, 2, 3].map((i) => (
										<Skeleton key={i} className="w-full h-16" />
									))}
								</div>
							)}

							{status === "error" && (
								<div className="px-4 pb-4">
									<ErrorState
										message="Couldn't load your transactions."
										onRetry={reload}
									/>
								</div>
							)}

							{status === "ready" && transactions.length === 0 && (
								<div className="px-4 pb-4">
									<EmptyState
										icon={Wallet}
										title="No transactions yet"
										description="Record an inflow, outflow or transfer and it'll show up here."
									/>
								</div>
							)}

							<ul className="overflow-y-auto max-h-125">
								{transactions.map((transaction) => {
									const source = sources.find(
										(src) => src.id === transaction.sourceId,
									);
									const isInflow = transaction.type === "inflow";
									return (
										<li
											key={transaction.id}
											className={cn(
												"mx-4 pb-4 pt-2 border-b border-border flex items-start justify-between gap-3",
												isInflow ? "text-success" : "text-danger",
											)}>
											<div className="flex items-start gap-3">
												<div
													className={cn(
														"flex items-center justify-center w-10 h-10 rounded-full",
														isInflow ? "bg-success-surface" : "bg-danger-surface",
													)}>
													<Wallet className=" w-5 h-5" />
												</div>

												<div className="space-y-1">
													<p className="font-semibold text-foreground text-sm md:text-base">
														{source?.name || "Unknown Source"}
													</p>

													<p className="text-xs md:text-sm text-muted-foreground">
														Added on {formatDate(transaction.createdAt)}
													</p>

													<div className="flex items-center gap-2.5">
														{transaction.category && (
															<span className="inline-block font-semibold text-xs md:text-sm text-foreground bg-surface-sunken px-3 py-1 rounded-full">
																{transaction.category}
															</span>
														)}
														<span
															className={cn(
																"inline-block font-semibold text-xs md:text-sm border px-3 py-1 rounded-full",
																isInflow
																	? "bg-success-surface border-success"
																	: "bg-danger-surface border-danger",
															)}>
															{transaction.type}
														</span>
													</div>
												</div>
											</div>

											<p className="font-semibold text-sm md:text-base whitespace-nowrap">
												{formatCurrency(transaction.amount)}
											</p>
										</li>
									);
								})}
							</ul>
						</div>

						{/* Buttons */}
						<div className="flex items-center justify-end mt-4 w-full">
							<Button
								variant="primary"
								onClick={() => navigate("/reconcilation")}>
								<User size={16} className="text-brand-foreground" />
								<span className="text-brand-foreground">Reconcile</span>
							</Button>
						</div>
					</div>

					{/* RIGHT SECTION */}
					<div className="hidden md:block lg:col-span-3 w-full h-full">
						<TotalTransactionBarChart
							series={summary?.charts.totalTransactionsSeries}
						/>
					</div>
				</div>
			</div>
		</>
	);
}

export default TransactionPage;