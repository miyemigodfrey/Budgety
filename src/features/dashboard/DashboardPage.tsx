"use client";

import { Button } from "@/components/ui/button";
import { FileText, Plus, Wallet } from "lucide-react";
import AddSourceModal from "@/features/addsource/sourceModal";
import budgetydash from "@/assets/budgety-dashboard.png";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { Status } from "@/lib/status";
import AddTransactionModal from "../transactions/transactionModal";
import { formatDate } from "@/lib/formatDate";
import { formatCurrency } from "@/lib/formatCurrency";
import { getSources, type SourceDto } from "@/api/sources";

export function TableDemo() {
	const [sources, setSources] = useState<SourceDto[]>([]);
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
				const sourceData = await getSources();
				if (cancelled) return;
				setSources(sourceData);
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

	if (status === "loading") {
		return (
			<div className="space-y-2 py-2">
				{[0, 1, 2].map((i) => (
					<Skeleton key={i} className="w-full h-10" />
				))}
			</div>
		);
	}

	if (status === "error") {
		return (
			<ErrorState message="Couldn't load your sources." onRetry={reload} />
		);
	}

	if (sources.length === 0) {
		return (
			<EmptyState
				icon={Wallet}
				title="No sources yet"
				description="Add your first money source to get started."
			/>
		);
	}

	return (
		<>
			<Table>
				<TableBody>
					{sources.map((source) => {
						return (
							<TableRow key={source.id}>
								<TableCell className="font-semibold flex items-center gap-x-1.5">
									<FileText size={16} className="text-success" />
									{source.name}
								</TableCell>
								<TableCell className="text-muted-foreground text-xs">
									{formatDate(source.createdAt)}
								</TableCell>
								<TableCell className="text-right font-semibold">
									{formatCurrency(source.initialBalance, source.currency)}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</>
	);
}

function Dashboard() {
	const [open, setOpen] = useState(false);
	const [transactionOpen, setTransactionOpen] = useState(false);

	return (
		<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
			{/* HEADER */}
			<header className="w-full max-w-5xl">
				<div className="flex items-center justify-between p-2">
					<h1 className="font-bold text-2xl">Budgety</h1>
				</div>
			</header>

			<div className="flex-1 w-full max-w-5xl flex flex-col items-center mt-6">
				{/* IMAGE + SETUP SECTION */}
				<div className="w-full flex flex-col lg:flex-row gap-8 items-center lg:items-start">
					{/* IMAGE */}

					<img
						src={budgetydash.src}
						alt="Dashboard illustration"
						className="w-full md:w-[90%] lg:w-[45%] drop-shadow-2xl rounded-xl border border-border contrast-125 saturate-125"
					/>

					{/* SETUP CARD */}
					<div className="w-full md:w-full p-5 bg-card md:bg-inherit rounded-3xl shadow-2xl md:shadow-none flex flex-col items-center gap-y-3 text-center">
						<div className="space-y-2">
							<h2 className="text-2xl md:text-[34px] lg:text-[50px] font-semibold">
								Set Up your Budget Workspace
							</h2>
							<span className="text-muted-foreground md:text-xl">
								A smart way to manage your budget with budgety
							</span>
						</div>
						<Button
							className="w-full bg-brand"
							onClick={() => setOpen(true)}>
							Start Setup
						</Button>
					</div>
				</div>

				{/* TABLE BELOW */}
				<div className="mt-8 w-full p-6 bg-card rounded-xl shadow-md">
					<h3 className="font-semibold md:text-3xl mb-3">
						Set Up Your Sources
					</h3>
					<TableDemo />
					<div className="w-full mt-4">
						<Button
							onClick={() => setTransactionOpen(true)}
							className="w-full bg-brand md:py-3">
							<Plus size={26} className="text-brand-foreground" />
							<span>Add Transaction</span>
						</Button>
					</div>
				</div>

				<AddSourceModal open={open} setOpen={setOpen} />
				<AddTransactionModal
					open={transactionOpen}
					setOpen={setTransactionOpen}
				/>
			</div>
		</div>
	);
}

export default Dashboard;