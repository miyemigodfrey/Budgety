"use client";

import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import {
	ArrowDownLeft,
	ArrowLeftRight,
	ArrowUpRight,
	ChevronDown,
	Info,
	Trash2,
	type LucideIcon,
} from "lucide-react";
import UniversalModal from "@/components/ui/modal";
import {
	deleteTransaction,
	updateTransaction,
	type TransactionDto,
} from "@/api/transaction";
import { getSources } from "@/api/sources";
import { getCategories, type Category } from "@/api/categories";
import { parseMoneyInput, formatMoneyInput, toMajor } from "@/lib/money";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/apiError";

type Props = {
	transaction: TransactionDto | null;
	open: boolean;
	setOpen: (value: boolean) => void;
	onUpdated?: () => void;
};

type Source = { id: string; name: string };
type TransactionType = "inflow" | "outflow" | "transfer";

const TABS: { label: string; value: TransactionType; kind: string; icon: LucideIcon }[] = [
	{ label: "Inflow", value: "inflow", kind: "in", icon: ArrowDownLeft },
	{ label: "Outflow", value: "outflow", kind: "out", icon: ArrowUpRight },
	{ label: "Transfer", value: "transfer", kind: "tr", icon: ArrowLeftRight },
];

/** A Date (or ISO string) → YYYY-MM-DD in local time for a <input type="date">. */
const toDateInput = (value: Date | string) => {
	const d = new Date(value);
	const off = d.getTimezoneOffset();
	return new Date(d.getTime() - off * 60000).toISOString().split("T")[0]!;
};

export default function EditTransactionModal({
	transaction,
	open,
	setOpen,
	onUpdated,
}: Props) {
	const [activeTab, setActiveTab] = useState<TransactionType>("inflow");
	const [amount, setAmount] = useState("");
	const [category, setCategory] = useState("");
	const [sources, setSources] = useState<Source[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [source, setSource] = useState("");
	const [note, setNote] = useState("");
	const [date, setDate] = useState("");
	const [transferTarget, setTransferTarget] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);

	// Fetch the dropdown data whenever the modal opens.
	useEffect(() => {
		if (!open) return;
		(async () => {
			try {
				const [srcs, cats] = await Promise.all([
					getSources(),
					getCategories(),
				]);
				setSources(srcs);
				setCategories(cats);
			} catch (error) {
				toast.error(getErrorMessage(error, "Couldn't load form data."));
			}
		})();
	}, [open]);

	// Delete always needs a second, deliberate click.
	useEffect(() => {
		setConfirmDelete(false);
	}, [open, transaction]);

	// Prefill from the transaction being edited.
	useEffect(() => {
		if (!transaction) return;
		setActiveTab(transaction.type as TransactionType);
		setAmount(formatMoneyInput(String(toMajor(transaction.amount))));
		setCategory(transaction.category);
		setSource(transaction.sourceId);
		setNote(transaction.note ?? "");
		setDate(toDateInput(transaction.date));
		setTransferTarget(transaction.transferTargetId ?? "");
	}, [transaction]);

	const filteredCategories = useMemo(() => {
		if (activeTab === "transfer") return categories;
		return categories.filter((cat) =>
			activeTab === "inflow" ? cat.type === "income" : cat.type === "expense",
		);
	}, [activeTab, categories]);

	// Keep the saved category selectable even if it has since been renamed or
	// belongs to the other type, so the native select shows what is stored.
	const categoryMissing =
		category !== "" && !filteredCategories.some((c) => c.name === category);

	const transferTargetOptions = useMemo(
		() => sources.filter((src) => src.id !== source),
		[sources, source],
	);

	// Enter in a text field saves (selects handle their own Enter).
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter" && !isSubmitting) {
			e.preventDefault();
			handleSubmit();
		}
	};

	const handleSubmit = async () => {
		if (!transaction) return;
		const parsedAmount = parseMoneyInput(amount);

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
		if (!date) {
			toast.error("Please pick a date.");
			return;
		}

		try {
			setIsSubmitting(true);
			await updateTransaction(transaction.id, {
				sourceId: source,
				type: activeTab,
				amount: parsedAmount,
				category,
				note,
				date,
				...(activeTab === "transfer" && { transferTargetId: transferTarget }),
			});
			toast.success("Transaction updated!");
			setOpen(false);
			onUpdated?.();
		} catch (error) {
			console.error("Failed to update transaction:", error);
			toast.error(getErrorMessage(error, "Failed to update transaction"));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!transaction) return;
		if (!confirmDelete) {
			setConfirmDelete(true);
			return;
		}
		try {
			setIsSubmitting(true);
			await deleteTransaction(transaction.id);
			toast.success("Transaction deleted");
			setOpen(false);
			onUpdated?.();
		} catch (error) {
			console.error("Failed to delete transaction:", error);
			toast.error(getErrorMessage(error, "Failed to delete transaction"));
			setConfirmDelete(false);
		} finally {
			setIsSubmitting(false);
		}
	};

	const isTransfer = activeTab === "transfer";
	// Save takes the colour of the type, like the Add transaction dialog.
	const saveClass =
		activeTab === "inflow"
			? "btn btn-success btn-lg"
			: activeTab === "outflow"
				? "btn btn-danger-fill btn-lg"
				: "btn btn-primary btn-lg";
	const hint = confirmDelete
		? "Deleting reverses its effect on your balances. This can't be undone."
		: isTransfer
			? "Moves money between sources. Totals stay the same."
			: "The source balance updates as soon as you save.";

	return (
		<UniversalModal
			open={open}
			onOpenChange={setOpen}
			title="Edit transaction"
			description="Fix a wrong amount, category or source."
			footer={
				<>
					<button
						type="button"
						className="btn btn-danger btn-lg"
						onClick={handleDelete}
						disabled={isSubmitting || !transaction}
						aria-label={confirmDelete ? "Confirm delete transaction" : "Delete transaction"}>
						<Trash2 className="ic ic-sm" />
						{confirmDelete ? "Confirm delete" : "Delete"}
					</button>
					<span className="hint grow row-f hide-m" role={confirmDelete ? "alert" : undefined}>
						<Info className="ic ic-sm" />
						{hint}
					</span>
					<button
						type="button"
						className="btn btn-ghost btn-lg"
						onClick={() => setOpen(false)}>
						Cancel
					</button>
					<button
						type="button"
						className={saveClass}
						onClick={handleSubmit}
						disabled={isSubmitting}>
						{isSubmitting ? "Saving..." : "Save changes"}
					</button>
				</>
			}>
			<div className="seg seg-block seg-lg" role="group" aria-label="Transaction type">
				{TABS.map((tab) => {
					const Icon = tab.icon;
					const on = activeTab === tab.value;
					return (
						<button
							key={tab.value}
							type="button"
							className={`seg-i ${tab.kind}${on ? " on" : ""}`}
							aria-pressed={on}
							onClick={() => setActiveTab(tab.value)}>
							<Icon className="ic ic-sm" />
							{tab.label}
						</button>
					);
				})}
			</div>

			<div className="field">
				<label className="label" htmlFor="edit-amount">
					Amount
				</label>
				<div className="control">
					<span className="cur" aria-hidden="true">
						₦
					</span>
					<input
						id="edit-amount"
						className="input input-amt"
						inputMode="decimal"
						placeholder="0.00"
						value={amount}
						onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
						onKeyDown={handleKeyDown}
					/>
				</div>
			</div>

			<div className="form-grid">
				<div className="field">
					<label className="label" htmlFor="edit-date">
						Date
					</label>
					<input
						id="edit-date"
						className="input"
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						onKeyDown={handleKeyDown}
					/>
				</div>

				<div className="field">
					<label className="label" htmlFor="edit-source">
						{isTransfer ? "From source" : "Source"}
					</label>
					<div className="control">
						<select
							id="edit-source"
							className="input select"
							value={source}
							onChange={(e) => setSource(e.target.value)}>
							<option value="" disabled>
								Select source
							</option>
							{sources.map((src) => (
								<option key={src.id} value={src.id}>
									{src.name}
								</option>
							))}
						</select>
						<ChevronDown className="ic ic-sm ic-end" />
					</div>
				</div>

				{isTransfer && (
					<div className="field">
						<label className="label" htmlFor="edit-target">
							To source
						</label>
						<div className="control">
							<select
								id="edit-target"
								className="input select"
								value={transferTarget}
								onChange={(e) => setTransferTarget(e.target.value)}>
								<option value="" disabled>
									Select target source
								</option>
								{transferTargetOptions.map((src) => (
									<option key={src.id} value={src.id}>
										{src.name}
									</option>
								))}
							</select>
							<ChevronDown className="ic ic-sm ic-end" />
						</div>
					</div>
				)}

				<div className={`field${isTransfer ? "" : " full"}`}>
					<label className="label" htmlFor="edit-category">
						Category
					</label>
					<div className="control">
						<select
							id="edit-category"
							className="input select"
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							disabled={filteredCategories.length === 0 && !categoryMissing}>
							<option value="" disabled>
								Select category
							</option>
							{categoryMissing && <option value={category}>{category}</option>}
							{filteredCategories.map((cat) => (
								<option key={cat.id} value={cat.name}>
									{cat.name}
								</option>
							))}
						</select>
						<ChevronDown className="ic ic-sm ic-end" />
					</div>
				</div>

				<div className="field full">
					<label className="label" htmlFor="edit-note">
						Note{" "}
						<span className="t-muted" style={{ fontWeight: 500 }}>
							(optional)
						</span>
					</label>
					<input
						id="edit-note"
						className="input"
						placeholder="Optional note"
						value={note}
						onChange={(e) => setNote(e.target.value)}
						onKeyDown={handleKeyDown}
					/>
				</div>
			</div>
		</UniversalModal>
	);
}
