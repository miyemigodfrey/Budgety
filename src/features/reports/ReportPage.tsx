"use client";

import { useCallback, useEffect, useState } from "react";
import {
	TotalTransactionBarChart,
	TransactionBreakdownChart,
} from "@/components/charts/TransactionChart";
import { DownloardCards } from "@/components/DownloadCards";
import { getSummary, type ReportSummary } from "@/api/export";
import { formatCurrency } from "@/lib/formatCurrency";
import { ErrorState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { Status } from "@/lib/status";

export default function ReportPage() {
	const [summary, setSummary] = useState<ReportSummary | null>(null);
	const [status, setStatus] = useState<Status>("loading");

	const [reloadKey, setReloadKey] = useState(0);

	const reload = useCallback(() => {
		setStatus("loading");
		setReloadKey((k) => k + 1);
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function fetchSummary() {
			try {
				const data = await getSummary(6);
				if (cancelled) return;
				setSummary(data);
				setStatus("ready");
			} catch (error) {
				if (cancelled) return;
				console.error("Failed to load report summary:", error);
				setStatus("error");
			}
		}

		fetchSummary();
		return () => {
			cancelled = true;
		};
	}, [reloadKey]);

	return (
		<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
			<header className="w-full max-w-5xl">
				<h1 className="font-bold text-2xl">Report</h1>
			</header>
			<DownloardCards />

			{status === "error" ? (
				<div className="w-full max-w-7xl mx-auto px-4 py-6">
					<ErrorState message="Couldn't load your report." onRetry={reload} />
				</div>
			) : (
				<div className="w-full max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
					<div className="lg:col-span-4 bg-card rounded-xl shadow-md p-5">
						<h3 className="text-muted-foreground text-sm">Total Balance</h3>
						{status === "loading" ? (
							<Skeleton className="h-9 w-40 mt-2" />
						) : (
							<p className="text-3xl font-bold mt-2">
								{formatCurrency(summary?.totalBalance)}
							</p>
						)}
						<p className="text-sm text-muted-foreground mt-1">Across all sources</p>
					</div>

					{/* INFLOW SUMMARY */}
					<div className="lg:col-span-4 bg-card rounded-xl shadow-md p-5">
						<h3 className="text-muted-foreground text-sm">Total Inflow</h3>
						{status === "loading" ? (
							<Skeleton className="h-8 w-32 mt-2" />
						) : (
							<p className="text-2xl font-semibold text-success mt-2">
								+{formatCurrency(summary?.monthly.inflow)}
							</p>
						)}
						<p className="text-sm text-muted-foreground mt-1">This month</p>
					</div>

					{/* OUTFLOW SUMMARY */}
					<div className="lg:col-span-4 bg-card rounded-xl shadow-md p-5">
						<h3 className="text-muted-foreground text-sm">Total Outflow</h3>
						{status === "loading" ? (
							<Skeleton className="h-8 w-32 mt-2" />
						) : (
							<p className="text-2xl font-semibold text-danger mt-2">
								-{formatCurrency(summary?.monthly.outflow)}
							</p>
						)}
						<p className="text-sm text-muted-foreground mt-1">This month</p>
					</div>
				</div>
			)}

			<div className="mt-8 w-full bg-card rounded-xl shadow-md p-4">
				<p className="font-bold text-2xl py-2 ">Monthly Summary</p>

				<div className="grid gap-6 md:grid-cols-2 mt-8">
					<TotalTransactionBarChart
						series={summary?.charts.totalTransactionsSeries}
					/>
					<TransactionBreakdownChart
						series={summary?.charts.breakdownSeries}
					/>
				</div>
			</div>
		</div>
	);
}