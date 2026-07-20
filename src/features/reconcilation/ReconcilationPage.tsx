import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getSources, type SourceDto } from "@/api/sources";
import {
	createReconciliation,
	type ReconcileResult,
} from "@/api/reconcilation";
import { formatCurrency } from "@/lib/formatCurrency";
import { toast } from "react-toastify";
import { EmptyState } from "@/components/EmptyState";
import { Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ReconcilationPage() {
	const [sources, setSources] = useState<SourceDto[]>([]);
	const [sourceId, setSourceId] = useState("");
	const [actual, setActual] = useState("");
	const [result, setResult] = useState<ReconcileResult | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		getSources()
			.then(setSources)
			.catch((error) => console.error("Failed to load sources:", error));
	}, []);

	const selectedSource = useMemo(
		() => sources.find((s) => s.id === sourceId),
		[sources, sourceId],
	);

	// Reset any prior result when the inputs change
	useEffect(() => {
		setResult(null);
	}, [sourceId, actual]);

	const handleReconcile = async () => {
		if (!sourceId) {
			toast.error("Please select a source.");
			return;
		}

		const actualBalance = Number(actual);
		if (actual === "" || Number.isNaN(actualBalance)) {
			toast.error("Please enter a valid actual balance.");
			return;
		}

		try {
			setIsSubmitting(true);
			const [reconciled] = await createReconciliation([
				{ sourceId, actualBalance },
			]);
			setResult(reconciled);
			toast.success("Reconciliation recorded.");
		} catch (error) {
			console.error("Failed to reconcile:", error);
			toast.error("Failed to reconcile. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const currency = selectedSource?.currency;
	const isMatched = result ? result.discrepancy === 0 : false;

	return (
		<div className="min-h-screen w-full mx-auto flex flex-col items-center py-6 px-4 md:px-10 md:py-10 max-w-2xl">
			<header className="w-full max-w-5xl">
				<h1 className="font-bold text-2xl">Cash Reconciliation</h1>
			</header>
			{sources.length === 0 ? (
				<div className="mt-8 w-full">
					<EmptyState
						icon={Wallet}
						title="Nothing to reconcile yet"
						description="Add a money source first, then come back to check its balance against what you actually have."
						action={
							<Button variant="primary" onClick={() => navigate("/source")}>
								Go to sources
							</Button>
						}
					/>
				</div>
			) : (
			<div className="mt-8 w-full bg-card rounded-xl shadow-md px-4 py-2 ">
				<div className="py-2">
					<label
						className="block text-sm font-medium text-foreground mb-1"
						htmlFor="source-select">
						Source
					</label>
					<Select value={sourceId} onValueChange={setSourceId}>
						<SelectTrigger id="source-select" className="w-full">
							<SelectValue placeholder="Select a source" />
						</SelectTrigger>
						<SelectContent>
							{sources.map((src) => (
								<SelectItem key={src.id} value={src.id}>
									{src.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="py-2">
					<h2 className="text-lg font-semibold text-muted-foreground">
						App Balance
					</h2>
					<p className="text-2xl font-semibold text-brand">
						{selectedSource
							? formatCurrency(selectedSource.balance, currency)
							: "—"}
					</p>
				</div>

				<div className="py-2">
					<label
						className="block text-sm font-medium text-foreground"
						htmlFor="calculated-balance">
						Enter the actual (counted) balance here:
					</label>
					<Input
						id="calculated-balance"
						type="number"
						value={actual}
						onChange={(e) => setActual(e.target.value)}
						placeholder="0.00"
						className="placeholder:text-lg placeholder:text-muted-foreground w-full"
					/>
				</div>

				<Button
					variant="primary"
					className="w-full py-1.5 mt-4"
					disabled={isSubmitting}
					onClick={handleReconcile}>
					{isSubmitting ? "Reconciling..." : "Reconcile"}
				</Button>

				{result && (
					<div
						className={`py-2 rounded-lg mt-4 w-full flex flex-col items-start px-4 ${
							isMatched
								? "bg-success-surface text-success"
								: "bg-danger-surface text-danger"
						}`}>
						<h2 className="text-lg font-semibold text-muted-foreground">Difference</h2>
						<p className="text-2xl font-semibold ">
							{formatCurrency(result.discrepancy, currency)}
						</p>
						<p className="text-sm mt-1">
							{isMatched
								? "Balances match — no discrepancy."
								: result.discrepancy > 0
									? "You have more cash than the app expects."
									: "You have less cash than the app expects."}
						</p>
					</div>
				)}
			</div>
			)}
		</div>
	);
}
