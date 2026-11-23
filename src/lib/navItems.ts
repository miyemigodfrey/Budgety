import {
	ArrowLeftRight,
	ChartColumn,
	House,
	Layers,
	Scale,
	Settings,
	ShoppingCart,
	User,
	Wallet,
	type LucideIcon,
} from "lucide-react";

export type NavItem = {
	id: string;
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

export const NAV = {
	home: { id: "home", url: "/dashboard", icon: House, label: "Home" },
	spaces: { id: "spaces", url: "/spaces", icon: Layers, label: "Spaces" },
	sources: {
		id: "sources",
		url: "/source",
		icon: Wallet,
		label: "Sources",
		matchPrefixes: ["/source", "/sources"],
	},
	transactions: {
		id: "transactions",
		url: "/transaction",
		icon: ArrowLeftRight,
		label: "Transactions",
	},
	reconcile: { id: "reconcile", url: "/reconcilation", icon: Scale, label: "Reconcile" },
	reports: { id: "reports", url: "/report", icon: ChartColumn, label: "Reports" },
	shopping: { id: "shopping", url: "/shopping", icon: ShoppingCart, label: "Shopping" },
	settings: {
		id: "settings",
		url: "/setting",
		icon: Settings,
		label: "Settings",
		matchPrefixes: ["/setting"],
	},
	profile: { id: "profile", url: "/profile", icon: User, label: "Profile" },
} satisfies Record<string, NavItem>;

/** Sidebar groups (desktop, laptop and the tablet icon rail). */
export const navGroups: { title: string; items: NavItem[] }[] = [
	{ title: "Overview", items: [NAV.home, NAV.spaces] },
	{ title: "Money", items: [NAV.sources, NAV.transactions, NAV.reconcile] },
	{ title: "Planning", items: [NAV.reports, NAV.shopping] },
];

/** Every page, for page titles in the top bar. */
export const navItems: NavItem[] = Object.values(NAV);

/** Pages behind the mobile More sheet. */
export const moreItems: NavItem[] = [
	NAV.spaces,
	NAV.reconcile,
	NAV.reports,
	NAV.shopping,
	NAV.settings,
	NAV.profile,
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

/** Title of the page at `pathname`, for the top bar breadcrumb. */
export function pageTitle(pathname: string): string {
	if (pathname.startsWith("/setting/sources")) return "Manage sources";
	if (pathname.startsWith("/sources/")) return "Source";
	return navItems.find((i) => isNavItemActive(pathname, i))?.label ?? "Budgety";
}
