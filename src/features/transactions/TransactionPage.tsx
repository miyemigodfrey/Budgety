import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import popcorn from "@/assets/popcorn.png";

function TransactionPage() {
	return (
		<>
			<div className=" bg-gray-200 max-h-screen w-full flex flex-col items-center justify-center">
				<div className="m-5 bg-white shadow-3xl rounded-2xl h-screen">
					<div className="flex items-center justify-end gap-16 p-3">
						<h1 className="font-bold text-2xl text-center">Budgety</h1>
						<Settings className="text-gray-500 size-5" />
					</div>

					<div className=" flex flex-col items-center align-center gap-y-3 pt-16">
						<img
							src={popcorn}
							alt="A Popcorn picture "
							className="w-[70%] shadow-2xl"
						/>

						<div className="flex flex-col items-center space-y-2 text-center">
							<h2 className="text-2xl font-semibold ">
								Set Up your Budget Workspace
							</h2>
							<span>A smart way to manage your budget with budgety</span>
						</div>

						<Button variant="secondary" className="w-full">
							Start Setup Transaction page
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}

export default TransactionPage;
