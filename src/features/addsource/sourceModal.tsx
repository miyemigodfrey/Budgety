import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UniversalModal from "@/components/ui/modal";

type Props = {
	open: boolean;
	setOpen: (value: boolean) => void;
};

export default function AddSourceModal({ open, setOpen }: Props) {
	return (
		<UniversalModal
			open={open}
			onOpenChange={setOpen}
			title="Add a Source"
			description="Fill in the details to create a new source."
			footer={
				<div className="w-full flex flex-col gap-3">
					<Button className="bg-green-700/70">Save Source</Button>

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
						id="name"
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
						id="balance"
						type="number"
						placeholder="£ 0.00"
						className="placeholder:text-gray-900 placeholder:font-semibold"
					/>
				</div>
			</div>
		</UniversalModal>
	);
}
