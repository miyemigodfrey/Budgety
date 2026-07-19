import { ChevronRight, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OutflowOverviewChart } from "@/components/charts/OutflowChart";
import { TransferOverviewChart } from "@/components/charts/TransferChart";
import InflowOverviewChart from "@/components/charts/InflowChart";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import AddSourceModal from "./sourceModal";
import AddTransactionModal from "../transactions/transactionModal";
import { getSources, type SourceDto } from "@/api/sources";
import { getTrends, type TrendPoint } from "@/api/transaction";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/formatCurrency";
import { EmptyState, ErrorState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { Status } from "@/lib/status";

export default function SourcePage() {
	const [open, setOpen] = useState(false);
	const [transactionOpen, setTransactionOpen] = useState(false);
	const [source, setSource] = useState<SourceDto[]>([]);
	const [trends, setTrends] = useState<TrendPoint[]>([]);
	const [status, setStatus] = useState<Status>("loading");

	// Distribution of current balances across sources, used by the overview chart.
	const hasSources = source.length > 0;
	const labels = source.map((s) => s.name);
	const data = source.map((s) => s.remainingBalance);

	// Bumping this re-runs the fetch effect (used by retry and after a create).
	const [reloadKey, setReloadKey] = useState(0);

	const reload = useCallback(() => {
		setStatus("loading");
		setReloadKey((k) => k + 1);
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function fetchSources() {
			try {
				const [sourcesData, trendsData] = await Promise.all([
					getSources(),
					getTrends(6),
				]);
				if (cancelled) return;
				setSource(sourcesData);
				setTrends(trendsData.totalsByMonth);
				setStatus("ready");
			} catch (error) {
				if (cancelled) return;
				console.error("Failed to fetch sources:", error);
				setStatus("error");
			}
		}

		fetchSources();
		return () => {
			cancelled = true;
		};
	}, [reloadKey]);

	return (
		<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
			<header className="w-full max-w-5xl">
				<div className="flex items-center justify-between p-2">
					<h1 className="font-bold text-2xl">Set Up Your Source</h1>
				</div>
			</header>

			<div className=" w-full flex flex-col lg:flex-row items-start gap-4 mt-8">
				{/**Source List populated based on the user's sources in modal */}
				<div className=" w-full">
					{status === "loading" && (
						<div className="w-full space-y-2.5">
							{[0, 1, 2].map((i) => (
								<Skeleton key={i} className="w-full h-24 rounded-xl" />
							))}
						</div>
					)}

					{status === "error" && (
						<ErrorState
							message="Couldn't load your sources."
							onRetry={reload}
						/>
					)}

					{status === "ready" && !hasSources && (
						<EmptyState
							icon={Wallet}
							title="No sources yet"
							description="Add a money source — a bank account, cash, or savings — to start tracking your balance."
							action={
								<Button onClick={() => setOpen(true)} variant="primary">
									Add your first source
								</Button>
							}
						/>
					)}

					<ul className="w-full">
						{source.map((source) => (
							<li
								key={source.id}
								className="mt-2.5 w-full bg-card rounded-xl shadow-md p-3 border border-border divide-y divide-border">
								<div className=" flex items-center justify-between py-1">
									<div className="flex items-center space-x-2">
										<Wallet className="text-success size-4.5" />
										<p className="font-semibold">{source.name}</p>
									</div>

									<p className="text-lg md:text-xl text-foreground font-semibold">
										{formatCurrency(source.remainingBalance, source.currency)}
									</p>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-0.5">
										<span className="text-muted-foreground text-xs md:text-sm py-3">
											Initial Amount |{" "}
											{formatCurrency(source.initialBalance, source.currency)}
										</span>
									</div>

									{/**LINK TO GO SOURCE DETAILS */}
									<Link
										to={`/sources/${source.id}`}
										aria-label={`View details for ${source.name}`}>
										<ChevronRight className="text-muted-foreground size-4.5" />
									</Link>
								</div>
							</li>
						))}
					</ul>

					{hasSources && (
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-4">
							<Button
								onClick={() => setOpen(true)}
								variant="outline"
								className="border-border shadow-xl py-5 px-10 hover:bg-success/70 hover:text-brand-foreground hover:border-success ">
								Add Source
							</Button>
							<Button
								onClick={() => setTransactionOpen(true)}
								variant="outline"
								className="border-border shadow-xl py-5 px-10 hover:bg-success/70 hover:text-brand-foreground hover:border-success ">
								Add Transaction
							</Button>
						</div>
					)}
				</div>

				{hasSources && (
					<div className="mt-2.5 w-full lg:max-w-md min-w-0 bg-card rounded-xl shadow-md p-3 border border-border">
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
								<OutflowOverviewChart series={trends} />
							</TabsContent>

							<TabsContent value="transfer">
								<TransferOverviewChart series={trends} />
							</TabsContent>
						</Tabs>
					</div>
				)}

				<AddSourceModal open={open} setOpen={setOpen} onCreated={reload} />
				<AddTransactionModal
					open={transactionOpen}
					setOpen={setTransactionOpen}
					onCreated={reload}
				/>
			</div>
		</div>
	);
}
