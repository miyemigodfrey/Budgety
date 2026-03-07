import {
	FileText,
	House,
	ArrowLeftRight,
	Printer,
	Settings,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const menus = [
	{ id: 1, url: "/", icon: House, label: "Home" },
	{ id: 2, url: "/sources", icon: Printer, label: "Sources" },
	{
		id: 3,
		url: "/transaction",
		icon: ArrowLeftRight,
		label: "transaction",
	},
	{ id: 4, url: "/report", icon: FileText, label: "Report" },
	{ id: 5, url: "/settings", icon: Settings, label: "Settings" },
];

export default function Navbar() {
	const location = useLocation();

	return (
		<nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 shadow-md pb-3 pt-1.5">
			<Tabs value={location.pathname} className="w-full">
				<TabsList
					variant="line"
					className="max-w-4xl mx-auto flex items-center justify-around p-2 bg-transparent w-full">
					{menus.map((menu) => {
						const Icon = menu.icon;

						return (
							<Link key={menu.id} to={menu.url} className="flex-1">
								<TabsTrigger
									value={menu.url}
									className="flex flex-col items-center w-full gap-1">
									<Icon className="size-5 text-gray-500" />
									<span className="text-xs">{menu.label}</span>
								</TabsTrigger>
							</Link>
						);
					})}
				</TabsList>
			</Tabs>
		</nav>
	);
}
