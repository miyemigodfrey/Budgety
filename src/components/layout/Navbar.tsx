"use client";

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { isNavItemActive, navItems } from "@/lib/navItems";

export default function Navbar() {
	const location = useLocation();

	return (
		<nav className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-border shadow-md pb-3 pt-1.5">
			{/* Six items don't fit a phone width, so the bar scrolls sideways
			    instead of clipping the last item out of reach. */}
			<ul className="flex items-center gap-1 overflow-x-auto scroll-smooth px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				{navItems.map((item) => {
					const Icon = item.icon;
					const isActive = isNavItemActive(location.pathname, item);

					return (
						<li key={item.id} className="shrink-0">
							<Link
								to={item.url}
								aria-current={isActive ? "page" : undefined}
								className={cn(
									"flex min-w-16 flex-col items-center gap-1 rounded-lg px-3 py-1.5 transition-colors",
									isActive
										? "text-brand"
										: "text-muted-foreground hover:text-foreground",
								)}>
								<Icon className="size-5" />
								<span className="text-xs whitespace-nowrap">{item.label}</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}