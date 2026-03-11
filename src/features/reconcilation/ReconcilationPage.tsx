import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ReconcilationPage() {
	return (
		<div className="min-h-screen w-full flex flex-col items-center py-6 px-4 md:px-10 md:py-10 lg:px-24 max-w-2xl">
			<header className="w-full max-w-5xl">
				<h1 className="font-bold text-2xl">Cash Reconciliation</h1>
			</header>
			<div className="mt-8 w-full bg-white rounded-xl shadow-md px-4 py-2 ">
				<div className="py-2">
					<h2 className="text-lg font-semibold  text-gray-500">
						Actual Balance
					</h2>
					<p className=" text-2xl font-semibold text-blue-900">£20,000</p>
				</div>

				<div className="py-2">
					<label
						className="block text-sm font-medium text-gray-700"
						htmlFor="calculated-balance">
						Enter the Calculated cash balance here :
					</label>
					<Input
						id="calculated-balance"
						placeholder="£0.00"
						className="placeholder:text-lg placeholder:text-gray-400 w-full"
					/>
				</div>

				<Button variant="primary" className="w-full py-1.5 mt-4">
					Reconcile
				</Button>

				{/**Show if reconcile is clicked and difference is calculated. */}
				<div className="py-2 bg-orange-200 text-red-900 rounded-lg mt-4 w-full flex flex-col items-start px-4">
					<h2 className="text-lg font-semibold  text-gray-500">Difference</h2>
					<p className=" text-2xl font-semibold ">£0.00</p>
				</div>
			</div>
		</div>
	);
}
