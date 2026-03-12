import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import UniversalModal from "@/components/ui/modal";

type Props = {
	open: boolean;
	setOpen: (value: boolean) => void;
};

export default function AddTransactionModal({ open, setOpen }: Props) {
	const [activeTab, setActiveTab] = useState("Inflow");

	const tabs = ["Inflow", "Outflow", "Transfer"];
	return (
		<UniversalModal
			open={open}
			onOpenChange={setOpen}
			title="Add a Transaction"
			description="Fill in the details to create a new transaction."
			footer={
				<div className="w-full flex flex-col gap-3">
					<Button className="bg-green-700/70">Save Transaction</Button>
				</div>
			}>
			<div className="space-y-5 w-full">
				<ul className="bg-gray-300 w-full flex items-center justify-around rounded-xl p-1">
					{tabs.map((tab) => (
						<li
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out
                       ${
													activeTab === tab
														? "bg-white shadow text-gray-900"
														: "text-gray-600 hover:bg-gray-200"
												}`}>
							{tab}
						</li>
					))}
				</ul>

				<div className="bg-white w-full flex flex-col items-start rounded-xl p-3 space-y-2 ">
					<div className="flex flex-col items-start py-2 space-y-2 w-full">
						<label htmlFor="name" className="text-sm font-medium text-gray-900">
							Amount
						</label>
						<Input
							id="name"
							placeholder="£0.00"
							className="placeholder:text-lg placeholder:text-gray-400 w-full"
						/>
					</div>

					<div className="w-full flex flex-col items-start py-2 space-y-2">
						<label htmlFor="name" className="text-sm font-medium text-gray-900">
							Source
						</label>

						<Select defaultValue="opay">
							<SelectTrigger>
								<SelectValue placeholder="Select bank" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="opay">Opay</SelectItem>
								<SelectItem value="access">Access</SelectItem>
								<SelectItem value="zenith">Zenith</SelectItem>
							</SelectContent>
						</Select>

						<div className="w-full">
							<label
								htmlFor="name"
								className="text-sm font-medium text-gray-900">
								Notes
							</label>
							<Input
								id="name"
								placeholder="£0.00"
								className="placeholder:text-lg placeholder:text-gray-400 w-full"
							/>
						</div>
					</div>
				</div>
			</div>
		</UniversalModal>
	);
}
