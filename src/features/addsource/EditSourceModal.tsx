"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UniversalModal from "@/components/ui/modal";
import { updateSource, type Source } from "@/api/sources";
import { parseMoneyInput, formatMoneyInput, toMajor } from "@/lib/money";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/apiError";

// EditSourceModal.tsx
type Props = {
	source: Source;
	open: boolean;
	setOpen: (value: boolean) => void;
	onUpdated: (data: Source) => void;
};

export default function EditSourceModal({
	open,
	setOpen,
	source,
	onUpdated,
}: Props) {
	// source.balance is BigInt MINOR units (kobo); show it in major units with
	// separators, and parse it back the same way on save.
	const toField = (s: Source) =>
		formatMoneyInput(String(toMajor(BigInt(s.balance ?? 0))));
	const [name, setName] = useState(source.name);
	const [balance, setBalance] = useState(() => toField(source));
	const [isSaving, setIsSaving] = useState(false);

	// Re-sync when a different source is opened in the same modal instance.
	useEffect(() => {
		setName(source.name);
		setBalance(toField(source));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [source]);

	const handleUpdate = async () => {
		if (!name.trim()) {
			toast.error("Please enter a source name.");
			return;
		}

		const parsedBalance = parseMoneyInput(balance);
		if (balance.trim() === "" || Number.isNaN(parsedBalance)) {
			toast.error("Please enter a valid balance.");
			return;
		}
		if (parsedBalance < 0) {
			toast.error("Balance can't be negative.");
			return;
		}

		try {
			setIsSaving(true);
			const updated = await updateSource(source.id, {
				name: name.trim(),
				balance: parsedBalance,
			});

			toast.success("Source updated successfully");
			onUpdated(updated);
			setOpen(false);
		} catch (error) {
			console.error("Failed to update source:", error);
			toast.error(getErrorMessage(error, "Failed to update source"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<UniversalModal
			open={open}
			onOpenChange={setOpen}
			title="Edit Source"
			description="Update the source details below."
			footer={
				<div className="w-full flex flex-col gap-3">
					<Button
						className="bg-success/70"
						disabled={isSaving}
						onClick={handleUpdate}>
						{isSaving ? "Saving..." : "Save Changes"}
					</Button>

					<Button variant="ghost" onClick={() => setOpen(false)}>
						Cancel
					</Button>
				</div>
			}>
			<div className="space-y-5 w-full">
				<div className="bg-card w-full flex flex-col items-start rounded-xl p-3 space-y-2">
					<label htmlFor="name" className="text-sm font-medium text-foreground">
						Source Name
					</label>
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="eg. Salary, Bank, Cash"
						className="placeholder:text-sm"
					/>
				</div>

				<div className="bg-card w-full flex flex-col items-start rounded-xl p-3 space-y-2">
					<label
						htmlFor="balance"
						className="text-sm font-medium text-foreground">
						Current Balance
					</label>
					<Input
						id="balance"
						inputMode="decimal"
						value={balance}
						onChange={(e) => setBalance(formatMoneyInput(e.target.value))}
						placeholder="0.00"
						className="placeholder:text-foreground placeholder:font-semibold"
					/>
					<p className="text-xs text-muted-foreground">
						Corrects the balance directly. Your transaction history is left
						unchanged.
					</p>
				</div>
			</div>
		</UniversalModal>
	);
}