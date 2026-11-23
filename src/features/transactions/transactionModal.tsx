"use client";

import { type CSSProperties, type KeyboardEvent, useEffect, useMemo, useState } from "react";
import {
	ArrowDownLeft,
	ArrowLeftRight,
	ArrowUpRight,
	ChevronDown,
	Info,
	type LucideIcon,
} from "lucide-react";
import UniversalModal from "@/components/ui/modal";
import { createTransaction } from "@/api/transaction";
import { getSources } from "@/api/sources";
import { getCategories, type Category } from "@/api/categories";
import { useSpace } from "@/hooks/useSpace";
import { parseMoneyInput, formatMoneyInput } from "@/lib/money";
import { formatCurrency } from "@/lib/formatCurrency";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/apiError";

type Props = {
	open: boolean;
	setOpen: (value: boolean) => void;
	onCreated?: () => void;
	/** Tab to start on each time the dialog opens. */
	initialType?: TransactionType;
};

type Source = { id: string; name: string; balance?: bigint; currency?: string };

type TransactionType = "inflow" | "outflow" | "transfer";

/** Local "today" as YYYY-MM-DD for a <input type="date"> default. */
const todayStr = () => {
	const d = new Date();
	const off = d.getTimezoneOffset();
	return new Date(d.getTime() - off * 60000).toISOString().split("T")[0]!;
};

const TABS: { label: string; value: TransactionType; kind: "in" | "out" | "tr"; icon: LucideIcon }[] = [
	{ label: "Inflow", value: "inflow", kind: "in", icon: ArrowDownLeft },
	{ label: "Outflow", value: "outflow", kind: "out", icon: ArrowUpRight },
	{ label: "Transfer", value: "transfer", kind: "tr", icon: ArrowLeftRight },
];

const NOTE_PLACEHOLDER: Record<TransactionType, string> = {
	inflow: "e.g. November pay",
	outflow: "e.g. Shoprite run",
	transfer: "e.g. Cash for the week",
};

const sourceLabel = (s: Source) =>
	s.balance === undefined ? s.name : `${s.name} · ${formatCurrency(s.balance, s.currency)}`;

export default function AddTransactionModal({
	open,
	setOpen,
	onCreated,
	initialType = "inflow",
}: Props) {
	const { isAllView, activeSpace } = useSpace();
	const [activeTab, setActiveTab] = useState<TransactionType>("inflow");
	const [amount, setAmount] = useState("");
	const [category, setCategory] = useState("");
	const [sources, setSources] = useState<Source[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [source, setSource] = useState("");
	const [note, setNote] = useState("");
	const [date, setDate] = useState(todayStr);
	const [transferTarget, setTransferTarget] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingSources, setIsLoadingSources] = useState(false);
	const [isLoadingCategories, setIsLoadingCategories] = useState(false);

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
			setActiveTab(initialType);
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
		setDate(todayStr());
		setTransferTarget("");
	};

	// Enter in a text field saves (selects keep their own keyboard behaviour).
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter" && !isSubmitting) {
			e.preventDefault();
			handleSubmit();
		}
	};

	const handleSubmit = async () => {
		// "All" is a read-only overview — transactions belong to a single space.
		if (isAllView) {
			toast.error("Open a space first, then add a transaction to it.");
			return;
		}

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

			await createTransaction({
				sourceId: source,
				type: activeTab,
				amount: parsedAmount,
				category,
				note,
				date,
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

	const isTransfer = activeTab === "transfer";
	const categoryPlaceholder = isLoadingCategories
		? "Loading categories…"
		: filteredCategories.length === 0
			? "No categories available"
			: "Select category";

	// Save takes the colour of the flow: green in, red out, brand for a transfer.
	const saveButton: { className: string; style?: CSSProperties } =
		activeTab === "inflow"
			? { className: "btn btn-success btn-lg" }
			: activeTab === "transfer"
				? { className: "btn btn-primary btn-lg" }
				: { className: "btn btn-danger-fill btn-lg" };

	return (
		<UniversalModal
			open={open}
			onOpenChange={setOpen}
			title="Add transaction"
			description={
				isAllView ? (
					"Open a space first — transactions belong to a single space."
				) : (
					<>
						Recording in <strong className="t-fg2">{activeSpace?.name ?? "this space"}</strong>
					</>
				)
			}
			footer={
				<>
					<span className="hint grow row-f hide-m">
						<Info className="ic ic-sm" aria-hidden="true" />
						{isTransfer
							? "Moves money between sources. Totals stay the same."
							: "The source balance updates as soon as you save."}
					</span>
					<button className="btn btn-ghost btn-lg" type="button" onClick={() => setOpen(false)}>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={isSubmitting}
						className={saveButton.className}
						style={saveButton.style}>
						{isSubmitting ? "Saving…" : "Save transaction"}
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
							<Icon className="ic ic-sm" aria-hidden="true" />
							{tab.label}
						</button>
					);
				})}
			</div>

			<div className="field">
				<label className="label" htmlFor="tx-amount">
					Amount
				</label>
				<div className="control">
					<span className="cur" aria-hidden="true">
						₦
					</span>
					<input
						id="tx-amount"
						className="input input-amt"
						inputMode="decimal"
						placeholder="0.00"
						autoComplete="off"
						value={amount}
						onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
						onKeyDown={handleKeyDown}
					/>
				</div>
			</div>

			<div className="form-grid">
				<div className="field">
					<label className="label" htmlFor="tx-date">
						Date
					</label>
					<input
						id="tx-date"
						className="input"
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						onKeyDown={handleKeyDown}
					/>
				</div>

				<div className="field">
					<label className="label" htmlFor="tx-source">
						{isTransfer ? "From source" : "Source"}
					</label>
					<div className="control">
						<select
							id="tx-source"
							className="input select"
							value={source}
							onChange={(e) => {
								const next = e.target.value;
								setSource(next);
								// Don't leave the target pointing at the new "from" source.
								if (next === transferTarget) setTransferTarget("");
							}}>
							<option value="" disabled>
								{isLoadingSources
									? "Loading sources…"
									: sources.length === 0
										? "No sources yet"
										: "Select source"}
							</option>
							{sources.map((src) => (
								<option key={src.id} value={src.id}>
									{sourceLabel(src)}
								</option>
							))}
						</select>
						<ChevronDown className="ic ic-sm ic-end" aria-hidden="true" />
					</div>
				</div>

				{isTransfer && (
					<div className="field">
						<label className="label" htmlFor="tx-target">
							To source
						</label>
						<div className="control">
							<select
								id="tx-target"
								className="input select"
								value={transferTarget}
								onChange={(e) => setTransferTarget(e.target.value)}>
								<option value="" disabled>
									Select target source
								</option>
								{transferTargetOptions.map((src) => (
									<option key={src.id} value={src.id}>
										{sourceLabel(src)}
									</option>
								))}
							</select>
							<ChevronDown className="ic ic-sm ic-end" aria-hidden="true" />
						</div>
					</div>
				)}

				<div className={`field${isTransfer ? "" : " full"}`}>
					<label className="label" htmlFor="tx-category">
						Category
					</label>
					<div className="control">
						<select
							id="tx-category"
							className="input select"
							value={category}
							disabled={filteredCategories.length === 0}
							onChange={(e) => setCategory(e.target.value)}>
							<option value="" disabled>
								{categoryPlaceholder}
							</option>
							{filteredCategories.map((cat) => (
								<option key={cat.id} value={cat.name}>
									{cat.name}
								</option>
							))}
						</select>
						<ChevronDown className="ic ic-sm ic-end" aria-hidden="true" />
					</div>
				</div>

				<div className="field full">
					<label className="label" htmlFor="tx-note">
						Note{" "}
						<span className="t-muted" style={{ fontWeight: 500 }}>
							(optional)
						</span>
					</label>
					<input
						id="tx-note"
						className="input"
						placeholder={NOTE_PLACEHOLDER[activeTab]}
						value={note}
						onChange={(e) => setNote(e.target.value)}
						onKeyDown={handleKeyDown}
					/>
				</div>
			</div>
		</UniversalModal>
	);
}
