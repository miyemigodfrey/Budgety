import {
	ArrowLeftRight,
	FileText,
	House,
	Printer,
	Scale,
	Settings,
	type LucideIcon,
} from "lucide-react";

export type NavItem = {
	id: number;
	url: string;
	icon: LucideIcon;
	label: string;
	/**
	 * Extra path prefixes that should also mark this item active. Needed because
	 * the list route is `/source` but the detail route is `/sources/:id`, so a
	 * plain `startsWith(url)` misses it.
	 */
	matchPrefixes?: string[];
};

export const navItems: NavItem[] = [
	{ id: 1, url: "/dashboard", icon: House, label: "Home" },
	{
		id: 2,
		url: "/source",
		icon: Printer,
		label: "Sources",
		matchPrefixes: ["/source", "/sources"],
	},
	{ id: 3, url: "/transaction", icon: ArrowLeftRight, label: "Transaction" },
	{ id: 4, url: "/report", icon: FileText, label: "Report" },
	{ id: 5, url: "/reconcilation", icon: Scale, label: "Reconcile" },
	{
		id: 6,
		url: "/setting",
		icon: Settings,
		label: "Settings",
		matchPrefixes: ["/setting"],
	},
];

/**
 * True when `pathname` is this item's route or a route nested beneath it.
 * Exact-match alone left nested routes (`/sources/:id`, `/setting/sources`)
 * with no nav item highlighted.
 */
export function isNavItemActive(pathname: string, item: NavItem): boolean {
	if (pathname === item.url) return true;
	const prefixes = item.matchPrefixes ?? [item.url];
	return prefixes.some((p) => pathname.startsWith(`${p}/`));
}
