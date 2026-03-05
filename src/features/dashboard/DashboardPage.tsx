import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import budgetydash from "@/assets/budgety-dashboard.png";

function Dashboard() {
	// Dummy criteria: flip to true to hide the image and show alternative content
	const criteriaMet = false;

	return (
		<div className="min-h-screen w-full flex flex-col items-center py-6 px-4">
			<header className="relative w-full max-w-4xl">
				<div className="relative flex items-center p-2">
					<h1 className="font-bold text-2xl text-center absolute left-1/2 transform -translate-x-1/2 md:relative md:transform-none md:left-0">
						Budgety
					</h1>
					<Settings className="text-gray-500 size-6 absolute right-4 md:relative md:ml-2" />
				</div>
			</header>

			<div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center">
				{!criteriaMet && (
					<img
						src={budgetydash}
						alt="Dashboard illustration"
						className="w-full md:w-[70%] lg:w-[60%] drop-shadow-2xl rounded-xl border-4 border-gray-100 contrast-125 saturate-125"
					/>
				)}

				{criteriaMet && (
					<div className="w-full md:w-[80%] p-6 bg-white rounded-xl shadow-md text-center">
						<h3 className="font-semibold">Alternate view</h3>
						<p className="text-sm text-gray-600">
							Criteria met — image hidden and this content shown instead.
						</p>
					</div>
				)}

				<div className="mt-6 p-5 bg-white rounded-3xl shadow-2xl flex flex-col items-center gap-y-3 w-full md:w-[60%] lg:w-[45%]">
					<div className="flex flex-col items-center space-y-2 text-center">
						<h2 className="text-2xl font-semibold">
							Set Up your Budget Workspace
						</h2>
						<span>A smart way to manage your budget with budgety</span>
					</div>
					<Button variant="primary" className="w-[85%]">
						Start Setup
					</Button>
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
