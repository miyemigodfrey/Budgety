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

type Props = {
	open: boolean;
	setOpen: (value: boolean) => void;
};

type Source = {
	id: string;
	name: string;
	balance?: number;
};

type TransactionType = "inflow" | "outflow" | "transfer";
type CategoryType = "income" | "expense";

const categories = [
	{ name: "Salary", type: "income" as CategoryType },
	{ name: "Freelance", type: "income" as CategoryType },
	{ name: "Investment Returns", type: "income" as CategoryType },
	{ name: "Food & Groceries", type: "expense" as CategoryType },
	{ name: "Transport", type: "expense" as CategoryType },
	{ name: "Rent", type: "expense" as CategoryType },
	{ name: "Utilities", type: "expense" as CategoryType },
	{ name: "Entertainment", type: "expense" as CategoryType },
	{ name: "Shopping", type: "expense" as CategoryType },
	{ name: "Health", type: "expense" as CategoryType },
];

export default function AddTransactionModal({ open, setOpen }: Props) {
	const [activeTab, setActiveTab] = useState<TransactionType>("inflow");
	const [amount, setAmount] = useState("");
	const [category, setCategory] = useState("");
	const [sources, setSources] = useState<Source[]>([]);
	const [source, setSource] = useState("");
	const [note, setNote] = useState("");
	const [transferTarget, setTransferTarget] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingSources, setIsLoadingSources] = useState(false);

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
		} finally {
			setIsLoadingSources(false);
		}
	};

	useEffect(() => {
		if (open) {
			fetchSources();
		}
	}, [open]);

	useEffect(() => {
		setCategory("");
		setTransferTarget("");
	}, [activeTab]);

	const filteredCategories = useMemo(() => {
		return categories.filter((cat) =>
			activeTab === "inflow" ? cat.type === "income" : cat.type === "expense",
		);
	}, [activeTab]);

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
			alert("Please fill all required fields.");
			return;
		}

		if (Number.isNaN(parsedAmount) || parsedAmount < 0.01) {
			alert("Amount must be at least 0.01.");
			return;
		}

		if (activeTab === "transfer" && !transferTarget) {
			alert("Please select a transfer target.");
			return;
		}

		if (activeTab === "transfer" && source === transferTarget) {
			alert("You cannot transfer to the same source.");
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

			alert("Transaction created!");
			resetForm();
			setOpen(false);
		} catch (error: any) {
			console.error("Failed to create transaction:", error);

			const message =
				error?.response?.data?.message ||
				error?.response?.data?.error ||
				"Failed to create transaction";

			alert(Array.isArray(message) ? message.join(", ") : message);
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
						className="bg-green-700/70">
						{isSubmitting ? "Saving..." : "Save Transaction"}
					</Button>
				</div>
			}>
			<div className="space-y-5 w-full">
				<ul className="bg-gray-300 w-full flex items-center justify-around rounded-xl p-1">
					{tabs.map((tab) => (
						<li
							key={tab.value}
							onClick={() => setActiveTab(tab.value)}
							className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out ${
								activeTab === tab.value
									? "bg-white shadow text-gray-900"
									: "text-gray-600 hover:bg-gray-200"
							}`}>
							{tab.label}
						</li>
					))}
				</ul>

				<div className="bg-white w-full flex flex-col items-start rounded-xl p-3 space-y-2">
					<div className="flex flex-col items-start py-2 space-y-2 w-full">
						<label
							htmlFor="amount"
							className="text-sm font-medium text-gray-900">
							Amount
						</label>
						<Input
							id="amount"
							type="number"
							min="0.01"
							step="0.01"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							placeholder="£0.00"
							className="placeholder:text-lg placeholder:text-gray-400 w-full"
						/>
					</div>

					<div className="w-full flex flex-col items-start py-2 space-y-2">
						<label className="text-sm font-medium text-gray-900">Source</label>
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
						<label className="text-sm font-medium text-gray-900">
							Category
						</label>
						<Select value={category} onValueChange={setCategory}>
							<SelectTrigger>
								<SelectValue placeholder="Select category" />
							</SelectTrigger>
							<SelectContent>
								{filteredCategories.map((cat) => (
									<SelectItem key={cat.name} value={cat.name}>
										{cat.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col items-start py-2 space-y-2 w-full">
						<label className="text-sm font-medium text-gray-900">Notes</label>
						<Input
							placeholder="Optional note"
							value={note}
							onChange={(e) => setNote(e.target.value)}
							className="placeholder:text-lg placeholder:text-gray-400 w-full"
						/>
					</div>

					{activeTab === "transfer" && (
						<div className="flex flex-col items-start py-2 space-y-2 w-full">
							<label className="text-sm font-medium text-gray-900">
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
