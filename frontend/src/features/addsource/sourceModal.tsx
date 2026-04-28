import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UniversalModal from "@/components/ui/modal";
import { useState } from "react";
import { createSource } from "@/api/sources";
import { toast } from "react-toastify";

type Props = {
	open: boolean;
	setOpen: (value: boolean) => void;
};

export default function AddSourceModal({ open, setOpen }: Props) {
	const [name, setName] = useState("");
	const [balance, setBalance] = useState("");

	const handleSubmit = async () => {
		if (!name.trim()) {
			alert("Please enter a source name.");
			return;
		}

		const parsedBalance = Number(balance);

		if (Number.isNaN(parsedBalance) || parsedBalance < 0) {
			alert("Please enter a valid opening balance.");
			return;
		}

		try {
			await createSource({ name: name.trim(), balance: parsedBalance });
			toast.success("Source created successfully");
			setName("");
			setBalance("");
			setOpen(false);
		} catch (error) {
			toast.error("Failed to create source:");
			throw error;
		}
	};

	return (
		<UniversalModal
			open={open}
			onOpenChange={setOpen}
			title="Add a Source"
			description="Fill in the details to create a new source."
			footer={
				<div className="w-full flex flex-col gap-3">
					<Button className="bg-green-700/70" onClick={handleSubmit}>
						Save Source
					</Button>

					<Button variant="ghost" onClick={() => setOpen(false)}>
						Maybe Later
					</Button>
				</div>
			}>
			<div className="space-y-5 w-full">
				<div className="bg-white w-full flex flex-col items-start rounded-xl p-3 space-y-2  ">
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

				<div className="bg-white w-full flex flex-col items-start rounded-xl p-3 space-y-2 ">
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
