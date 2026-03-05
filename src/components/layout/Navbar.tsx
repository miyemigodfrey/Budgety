import { Button } from "@/components/ui/button";
import { FileText, House, Printer, Settings } from "lucide-react";

export default function Navbar() {
	return (
		<nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 shadow-md">
			<div className="max-w-4xl mx-auto flex items-center justify-around p-2">
				<Button
					variant="ghost"
					className="flex-1 flex-col items-center
                ">
					<House className="size-5 text-gray-500" /> Home
				</Button>
				<Button variant="ghost" className="flex-1 flex-col items-center">
					<Printer className="size-5 text-gray-500" />
					Sources
				</Button>
				<Button variant="ghost" className="flex-1 flex-col items-center">
					<FileText className="size-5 text-gray-500" />
					<span>Report</span>
				</Button>
				<Button variant="ghost" className="flex-1 flex-col items-center">
					<Settings className="size-5 text-gray-500" />
					<span>Settings</span>
				</Button>
			</div>
		</nav>
	);
}
