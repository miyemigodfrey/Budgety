import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import UniversalModal from "@/components/ui/modal";
import { createTransaction } from "@/api/transaction";
import { getSources } from "@/api/sources";
import { getCategories, type Category } from "@/api/categories";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/apiError";

type Props = {
	open: boolean;
	setOpen: (value: boolean) => void;
	onCreated?: () => void;
};

type Source = {
	id: string;
	name: string;
	balance?: number;
};

type TransactionType = "inflow" | "outflow" | "transfer";

export default function AddTransactionModal({
	open,
	setOpen,
	onCreated,
}: Props) {
	const [activeTab, setActiveTab] = useState<TransactionType>("inflow");
	const [amount, setAmount] = useState("");
	const [category, setCategory] = useState("");
	const [sources, setSources] = useState<Source[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [source, setSource] = useState("");
	const [note, setNote] = useState("");
	const [transferTarget, setTransferTarget] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingSources, setIsLoadingSources] = useState(false);
	const [isLoadingCategories, setIsLoadingCategories] = useState(false);

	const tabs: { label: string; value: TransactionType }[] = [
		{ label: "Inflow", value: "inflow" },
		{ label: "Outflow", value: "outflow" },
		{ label: "Transfer", value: "transfer" },
	];

	const fetchSources = async () => {
		try {
			setIsLoadingSources(true);
			const data = await getSources();
			setSources(data);
		} catch (error) {
			console.error("Failed to fetch sources:", error);
			toast.error(getErrorMessage(error, "Couldn't load your sources."));
		} finally {
			setIsLoadingSources(false);
		}
	};

	const fetchCategories = async () => {
		try {
			setIsLoadingCategories(true);
			const data = await getCategories();
			setCategories(data);
		} catch (error) {
			console.error("Failed to fetch categories:", error);
			toast.error(getErrorMessage(error, "Couldn't load categories."));
		} finally {
			setIsLoadingCategories(false);
		}
	};

	useEffect(() => {
		if (open) {
			fetchSources();
			fetchCategories();
		}
	}, [open]);

	useEffect(() => {
		setCategory("");
		setTransferTarget("");
	}, [activeTab]);

	const filteredCategories = useMemo(() => {
		// A transfer is neither income nor expense, so don't narrow the list.
		if (activeTab === "transfer") return categories;
		return categories.filter((cat) =>
			activeTab === "inflow" ? cat.type === "income" : cat.type === "expense",
		);
	}, [activeTab, categories]);

	const transferTargetOptions = useMemo(() => {
		return sources.filter((src) => src.id !== source);
	}, [sources, source]);

	const resetForm = () => {
		setActiveTab("inflow");
		setAmount("");
		setCategory("");
		setSource("");
		setNote("");
		setTransferTarget("");
	};

	const handleSubmit = async () => {
		const parsedAmount = Number(amount);

		if (!source || !category || !amount) {
			toast.error("Please fill all required fields.");
			return;
		}

		if (Number.isNaN(parsedAmount) || parsedAmount < 0.01) {
			toast.error("Amount must be at least 0.01.");
			return;
		}

		if (activeTab === "transfer" && !transferTarget) {
			toast.error("Please select a transfer target.");
			return;
		}

		if (activeTab === "transfer" && source === transferTarget) {
			toast.error("You cannot transfer to the same source.");
			return;
		}

		try {
			setIsSubmitting(true);

			await createTransaction({
				sourceId: source,
				type: activeTab,
				amount: parsedAmount,
				category,
				note,
				date: new Date().toISOString().split("T")[0],
				...(activeTab === "transfer" && {
					transferTargetId: transferTarget,
				}),
			});

			toast.success("Transaction created!");
			resetForm();
			setOpen(false);
			onCreated?.();
		} catch (error) {
			console.error("Failed to create transaction:", error);
			toast.error(getErrorMessage(error, "Failed to create transaction"));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<UniversalModal
			open={open}
			onOpenChange={setOpen}
			title="Add a Transaction"
			description="Fill in the details to create a new transaction."
			footer={
				<div className="w-full flex flex-col gap-3">
					<Button
						onClick={handleSubmit}
						disabled={isSubmitting}
						className="bg-success/70">
						{isSubmitting ? "Saving..." : "Save Transaction"}
					</Button>
				</div>
			}>
			<div className="space-y-2 w-full">
				<ul className="bg-surface-sunken w-full flex items-center justify-around rounded-xl p-1">
					{tabs.map((tab) => (
						<li
							key={tab.value}
							onClick={() => setActiveTab(tab.value)}
							className={`cursor-pointer px-4 py-1 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out ${
								activeTab === tab.value
									? "bg-card shadow text-foreground"
									: "text-muted-foreground hover:bg-surface-sunken"
							}`}>
							{tab.label}
						</li>
					))}
				</ul>

				<div className="bg-card w-full flex flex-col items-start rounded-xl p-3 space-y-1">
					<div className="flex flex-col items-start py-2 space-y-2 w-full">
						<label
							htmlFor="amount"
							className="text-sm font-medium text-foreground">
							Amount
						</label>
						<Input
							id="amount"
							type="number"
							min="0.01"
							step="0.01"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							placeholder="₦0.00"
							className="placeholder:text-lg placeholder:text-muted-foreground w-full"
						/>
					</div>

					<div className="w-full flex flex-col items-start py-2 space-y-2">
						<label className="text-sm font-medium text-foreground">Source</label>
						<Select value={source} onValueChange={setSource}>
							<SelectTrigger>
								<SelectValue
									placeholder={
										isLoadingSources ? "Loading sources..." : "Select source"
									}
								/>
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

					<div className="flex flex-col items-start py-2 space-y-2 w-full">
						<label className="text-sm font-medium text-foreground">
							Category
						</label>
						<Select
							value={category}
							onValueChange={setCategory}
							disabled={filteredCategories.length === 0}>
							<SelectTrigger className="w-full">
								<SelectValue
									placeholder={
										isLoadingCategories
											? "Loading categories..."
											: filteredCategories.length === 0
												? "No categories available"
												: "Select category"
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{filteredCategories.map((cat) => (
									<SelectItem key={cat.id} value={cat.name}>
										{cat.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col items-start py-2 space-y-2 w-full">
						<label className="text-sm font-medium text-foreground">Notes</label>
						<Input
							placeholder="Optional note"
							value={note}
							onChange={(e) => setNote(e.target.value)}
							className="placeholder:text-lg placeholder:text-muted-foreground w-full"
						/>
					</div>

					{activeTab === "transfer" && (
						<div className="flex flex-col items-start py-2 space-y-2 w-full">
							<label className="text-sm font-medium text-foreground">
								Transfer Target
							</label>
							<Select value={transferTarget} onValueChange={setTransferTarget}>
								<SelectTrigger>
									<SelectValue placeholder="Select target source" />
								</SelectTrigger>
								<SelectContent>
									{transferTargetOptions.map((src) => (
										<SelectItem key={src.id} value={src.id}>
											{src.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				</div>
			</div>
		</UniversalModal>
	);
}
