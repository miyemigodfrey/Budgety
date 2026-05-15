import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UniversalModal from "@/components/ui/modal";
import { updateSource, type SourceId } from "@/api/sources";
import { toast } from "react-toastify";
import axios from "axios";

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
	const [balance, setBalance] = useState(String(source.balance));

	const handleUpdate = async () => {
		if (!name.trim()) {
			toast.error("Please enter a source name.");
			return;
		}

		const parsedBalance = Number(balance);

		if (Number.isNaN(parsedBalance) || parsedBalance < 0) {
			toast.error("Please enter a valid opening balance.");
			return;
		}

		try {
			const updated = await updateSource(source.id, {
				name: name.trim(),
			});

			toast.success("Source updated successfully");
			onUpdated(updated);
			setOpen(false);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				// Access error.response, error.request, etc. safely
				console.log(error.response?.status);
			}
			toast.error("Failed to update source");
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
					<Button className="bg-green-700/70" onClick={handleUpdate}>
						Save Changes
					</Button>

					<Button variant="ghost" onClick={() => setOpen(false)}>
						Cancel
					</Button>
				</div>
			}>
			<div className="space-y-5 w-full">
				<div className="bg-white w-full flex flex-col items-start rounded-xl p-3 space-y-2">
					<label htmlFor="name" className="text-sm font-medium text-gray-900">
						Source Name
					</label>
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="eg. Salary, Bank, Cash"
						className="placeholder:text-sm"
					/>
				</div>

				<div className="bg-white w-full flex flex-col items-start rounded-xl p-3 space-y-2">
					<label
						htmlFor="balance"
						className="text-sm font-medium text-gray-900">
						Opening Balance
					</label>
					<Input
						value={balance}
						onChange={(e) => setBalance(e.target.value)}
						type="number"
						placeholder="£ 0.00"
						className="placeholder:text-gray-900 placeholder:font-semibold"
					/>
				</div>
			</div>
		</UniversalModal>
	);
}
