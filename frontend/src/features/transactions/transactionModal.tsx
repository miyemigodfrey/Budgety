import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import UniversalModal from "@/components/ui/modal";
import { createTransaction } from "@/api/transaction";

type Props = {
	open: boolean;
	setOpen: (value: boolean) => void;
};

type Source = {
	id: string;
	name: string;
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
	const [amount, setAmount] = useState<number | "">("");
	const [category, setCategory] = useState<string>("");
	const [sources, setSources] = useState<Source[]>([]);
	const [source, setSource] = useState<string>("");
	const [note, setNote] = useState<string>("");
	const [transferTarget, setTransferTarget] = useState<string>("");

	const tabs: { label: string; value: TransactionType }[] = [
		{ label: "Inflow", value: "inflow" },
		{ label: "Outflow", value: "outflow" },
		{ label: "Transfer", value: "transfer" },
	];

	useEffect(() => {
		const fetchSources = async () => {
			try {
				const res = await fetch("/api/sources"); // adjust endpoint
				const data = await res.json();
				setSources(data);
			} catch (err) {
				console.error("Failed to fetch sources:", err);
			}
		};

		fetchSources();
	}, []);

	const handleSubmit = async () => {
		try {
			await createTransaction({
				amount: Number(amount),
				category,
				sourceId: source,
				note,
				type: activeTab === "inflow" ? "inflow" : activeTab, // fix naming				date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
				...(activeTab === "transfer" && { transferTargetId: transferTarget }),
			});
			alert("Transaction created!");
		} catch (error) {
			console.error("Failed to create transaction:", error);
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
					<Button onClick={handleSubmit} className="bg-green-700/70">
						Save Transaction
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

				<div className="bg-white w-full flex flex-col items-start rounded-xl p-3 space-y-2 ">
					<div className="flex flex-col items-start py-2 space-y-2 w-full">
						<label htmlFor="name" className="text-sm font-medium text-gray-900">
							Amount
						</label>
						<Input
							id="amount"
							type="number"
							value={amount}
							onChange={(e) => setAmount(Number(e.target.value))}
							placeholder="£0.00"
							className="placeholder:text-lg placeholder:text-gray-400 w-full"
						/>
					</div>

					<div className="w-full flex flex-col items-start py-2 space-y-2">
						<label htmlFor="name" className="text-sm font-medium text-gray-900">
							Source
						</label>

						<Select value={source} onValueChange={setSource}>
							<SelectTrigger>
								<SelectValue placeholder="Select bank" />
							</SelectTrigger>
							<SelectContent>
								{sources.map((src) => (
									<SelectItem key={src.id} value={src.name}>
										{src.name}
									</SelectItem>
								))}
								<SelectItem value="opay">Opay</SelectItem>
								<SelectItem value="access">Access</SelectItem>
								<SelectItem value="zenith">Zenith</SelectItem>
							</SelectContent>
						</Select>

						{/* Category */}
						<div className="flex flex-col items-start py-2 space-y-2 w-full">
							<label className="text-sm font-medium text-gray-900">
								Category
							</label>
							<Select value={category} onValueChange={setCategory}>
								<SelectTrigger>
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									{categories
										.filter((cat) =>
											activeTab === "inflow"
												? cat.type === "income"
												: cat.type === "expense",
										)
										.map((cat) => (
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
									Transfer Target Source ID
								</label>
								<Input
									placeholder="Enter target source ID"
									value={transferTarget}
									onChange={(e) => setTransferTarget(e.target.value)}
									className="placeholder:text-lg placeholder:text-gray-400 w-full"
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		</UniversalModal>
	);
}
