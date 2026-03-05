import { Button } from "@/components/ui/button";
import { FileText, House, Printer, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const menus = [
	{ id: 1, url: "/", icon: House, label: "Home" },
	{ id: 2, url: "/sources", icon: Printer, label: "Sources" },
	{ id: 3, url: "/report", icon: FileText, label: "Report" },
	{ id: 4, url: "/settings", icon: Settings, label: "Settings" },
];

export default function Navbar() {
	return (
		<nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 shadow-md">
			<div className="max-w-4xl mx-auto flex items-center justify-around p-2">
				{menus.map((menu) => {
					const Icon = menu.icon;

					return (
						<Link key={menu.id} to={menu.url} className="flex-1">
							<Button
								variant="ghost"
								className="flex flex-col items-center w-full">
								<Icon className="size-5 text-gray-500" />
								<span>{menu.label}</span>
							</Button>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
