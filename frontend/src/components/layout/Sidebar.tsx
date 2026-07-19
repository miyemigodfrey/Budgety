import Budgety from "@/assets/budgety.png";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { isNavItemActive, navItems } from "@/lib/navItems";

export default function Sidebar() {
	const location = useLocation();

	return (
		<div className="w-full h-full bg-card text-brand">
			{/* Logo */}
			<div className="flex items-start mb-2">
				<img src={Budgety} alt="Budgety Logo" className="h-24 w-auto" />
			</div>

			{/* Menu */}
			<nav className="flex flex-col gap-2">
				{navItems.map((item) => {
					const Icon = item.icon;
					const isActive = isNavItemActive(location.pathname, item);

					return (
						<Link
							key={item.id}
							to={item.url}
							aria-current={isActive ? "page" : undefined}
							className={cn(
								"flex w-full items-center gap-3 px-4 py-3 rounded-lg transition",
								isActive ? "bg-brand text-brand-foreground" : "hover:bg-muted",
							)}>
							<Icon size={18} />
							<span>{item.label}</span>
						</Link>
					);
				})}
			</nav>
		</div>
	);
}
