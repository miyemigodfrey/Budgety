"use client";

import { useEffect, useId, useState } from "react";
import { Check, Info } from "lucide-react";
import UniversalModal from "@/components/ui/modal";
import { updateSource, type Source } from "@/api/sources";
import { parseMoneyInput, formatMoneyInput, toMajor } from "@/lib/money";
import { formatCurrency } from "@/lib/formatCurrency";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/apiError";
import "./sources.css";

// source.balance is BigInt MINOR units (kobo); show it in major units with
// separators, and parse it back the same way on save.
const toField = (s: Source) => formatMoneyInput(String(toMajor(BigInt(s.balance ?? 0))));

/**
 * Draft state + save for editing a source's name and current balance. Shared by
 * the Edit source dialog and the inline editor on Settings → Manage sources.
 */
export function useSourceEditor(source: Source | null, onUpdated: (data: Source) => void) {
	const [name, setName] = useState(source?.name ?? "");
	const [balance, setBalanceRaw] = useState(() => (source ? toField(source) : ""));
	const [isSaving, setIsSaving] = useState(false);

	const reset = () => {
		setName(source?.name ?? "");
		setBalanceRaw(source ? toField(source) : "");
	};

	// Re-sync when a different source is opened in the same editor.
	useEffect(() => {
		reset();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [source]);

	const parsed = parseMoneyInput(balance);
	const current = source ? toMajor(BigInt(source.balance ?? 0)) : 0;
	const diff = Number.isNaN(parsed) ? 0 : Math.round((parsed - current) * 100) / 100;

	/** Validates and saves; resolves true when the source was updated. */
	const save = async (): Promise<boolean> => {
		if (!source) return false;
		if (!name.trim()) {
			toast.error("Please enter a source name.");
			return false;
		}
		if (balance.trim() === "" || Number.isNaN(parsed)) {
			toast.error("Please enter a valid balance.");
			return false;
		}
		if (parsed < 0) {
			toast.error("Balance can't be negative.");
			return false;
		}

		try {
			setIsSaving(true);
			const updated = await updateSource(source.id, {
				name: name.trim(),
				balance: parsed,
			});
			toast.success("Source updated successfully");
			onUpdated(updated);
			return true;
		} catch (error) {
			console.error("Failed to update source:", error);
			toast.error(getErrorMessage(error, "Failed to update source"));
			return false;
		} finally {
			setIsSaving(false);
		}
	};

	return {
		name,
		setName,
		balance,
		setBalance: (v: string) => setBalanceRaw(formatMoneyInput(v)),
		isSaving,
		save,
		reset,
		diff,
	};
}

export type SourceEditor = ReturnType<typeof useSourceEditor>;

/** Name + current balance fields, with the "this moves X by …" note. */
export function SourceEditorFields({
	editor,
	source,
}: {
	editor: SourceEditor;
	source: Source;
}) {
	const id = useId();
	const { diff } = editor;
	const currency = source.currency ?? "NGN";
	return (
		<>
			<div className="field">
				<label className="label" htmlFor={`${id}-name`}>
					Source name
				</label>
				<input
					id={`${id}-name`}
					className="input"
					value={editor.name}
					onChange={(e) => editor.setName(e.target.value)}
					placeholder="e.g. Salary, Bank, Cash"
					autoComplete="off"
				/>
			</div>
			<div className="field">
				<label className="label" htmlFor={`${id}-bal`}>
					Current balance
				</label>
				<div className="control">
					<span className="cur" style={{ fontSize: 18, left: 14 }} aria-hidden="true">
						₦
					</span>
					<input
						id={`${id}-bal`}
						className="input amt"
						inputMode="decimal"
						style={{ paddingLeft: 34 }}
						value={editor.balance}
						onChange={(e) => editor.setBalance(e.target.value)}
						placeholder="0.00"
						aria-describedby={`${id}-bal-hint`}
					/>
				</div>
				<span className="hint" id={`${id}-bal-hint`}>
					Corrects the balance directly. Your transaction history is left unchanged.
				</span>
			</div>
			{diff !== 0 && (
				<div className="src-note" role="status">
					<Info className="ic ic-sm tr" />
					<span>
						This moves {source.name} by{" "}
						<strong className={`amt ${diff > 0 ? "in" : "out"}`}>
							{diff > 0 ? "+" : "−"}
							{formatCurrency(Math.abs(diff), currency)}
						</strong>
						. Prefer a transaction or a reconciliation if the money really moved.
					</span>
				</div>
			)}
		</>
	);
}

type Props = {
	source: Source;
	open: boolean;
	setOpen: (value: boolean) => void;
	onUpdated: (data: Source) => void;
};

export default function EditSourceModal({ open, setOpen, source, onUpdated }: Props) {
	const editor = useSourceEditor(source, onUpdated);

	return (
		<UniversalModal
			open={open}
			onOpenChange={(v) => {
				if (!v) editor.reset();
				setOpen(v);
			}}
			title="Edit source"
			description={`Rename ${source.name} or correct its balance.`}
			footer={
				<>
					<button
						type="button"
						className="btn btn-ghost btn-lg grow"
						onClick={() => {
							editor.reset();
							setOpen(false);
						}}>
						Cancel
					</button>
					<button
						type="button"
						className="btn btn-primary btn-lg grow"
						disabled={editor.isSaving}
						onClick={async () => {
							if (await editor.save()) setOpen(false);
						}}>
						<Check className="ic ic-sm" />
						{editor.isSaving ? "Saving…" : "Save changes"}
					</button>
				</>
			}>
			<SourceEditorFields editor={editor} source={source} />
		</UniversalModal>
	);
}
