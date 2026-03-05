import Budgety from "@/assets/budgety.png";
import { FileText, House, Printer, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const menus = [
	{ id: 1, url: "/", icon: House, label: "Home" },
	{ id: 2, url: "/sources", icon: Printer, label: "Sources" },
	{ id: 3, url: "/report", icon: FileText, label: "Report" },
	{ id: 4, url: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
	const location = useLocation();

	return (
		<div className="w-64 h-screen bg-white text-blue-500 p-6">
			{/* Logo */}
			<div className="flex items-start mb-2">
				<img src={Budgety} alt="Budgety Logo" className="h-24 w-auto" />
			</div>

			{/* Menu */}
			<div className="flex flex-col gap-2">
				{menus.map((menu) => {
					const Icon = menu.icon;
					const isActive = location.pathname === menu.url;

					return (
						<Link
							key={menu.id}
							to={menu.url}
							className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg transition
                ${isActive ? "bg-blue-500 text-white" : "hover:bg-blue-200"}
              `}>
							<Icon size={18} />
							<span>{menu.label}</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
