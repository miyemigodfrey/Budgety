import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UniversalModal from "@/components/ui/modal";
import { updateSource, type SourceId } from "@/api/sources";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/apiError";

// EditSourceModal.tsx
type Props = {
	source: SourceId;
	open: boolean;
	setOpen: (value: boolean) => void;
	onUpdated: (data: SourceId) => void;
};

export default function EditSourceModal({
	open,
	setOpen,
	source,
	onUpdated,
}: Props) {
	const [name, setName] = useState(source.name);
	const [balance, setBalance] = useState(String(source.balance ?? 0));
	const [isSaving, setIsSaving] = useState(false);

	// Re-sync when a different source is opened in the same modal instance.
	useEffect(() => {
		setName(source.name);
		setBalance(String(source.balance ?? 0));
	}, [source]);

	const handleUpdate = async () => {
		if (!name.trim()) {
			toast.error("Please enter a source name.");
			return;
		}

		const parsedBalance = Number(balance);
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
						type="number"
						min="0"
						step="0.01"
						value={balance}
						onChange={(e) => setBalance(e.target.value)}
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
