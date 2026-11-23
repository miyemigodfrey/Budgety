"use client";

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "next-auth/react";
import { LayoutGrid, LogOut, Plus } from "lucide-react";
import UniversalModal from "@/components/ui/modal";
import { NAV, isNavItemActive, moreItems } from "@/lib/navItems";
import { useSpace } from "@/hooks/useSpace";
import { useQuickAdd } from "@/components/app/QuickAdd";
import { initialOf } from "./Sidebar";

/** Phone bottom tabs: Home, Activity, the + button, Sources and a More sheet. */
export default function Navbar() {
	const { pathname } = useLocation();
	const { openAddTransaction } = useQuickAdd();
	const { isAllView, activeSpace, spaces } = useSpace();
	const [moreOpen, setMoreOpen] = useState(false);

	const tab = (item: typeof NAV.home, label = item.label) => {
		const Icon = item.icon;
		const on = isNavItemActive(pathname, item);
		return (
			<Link to={item.url} className={`tab${on ? " on" : ""}`} aria-current={on ? "page" : undefined}>
				<Icon className="ic" />
				{label}
			</Link>
		);
	};
	const moreOn = moreItems.some((i) => isNavItemActive(pathname, i));
	const space = isAllView ? "All spaces" : (activeSpace?.name ?? "…");

	return (
		<>
			<nav className="tabbar" aria-label="Main navigation">
				{tab(NAV.home)}
				{tab(NAV.transactions, "Activity")}
				<div className="fab-slot">
					<button
						type="button"
						className="fab"
						aria-label="Add transaction"
						disabled={isAllView}
						title={isAllView ? "Open a space to add transactions" : undefined}
						onClick={openAddTransaction}>
						<Plus className="ic" />
					</button>
				</div>
				{tab(NAV.sources)}
				<button
					type="button"
					className={`tab${moreOn || moreOpen ? " on" : ""}`}
					style={{ border: 0, background: "transparent" }}
					onClick={() => setMoreOpen(true)}>
					<LayoutGrid className="ic" />
					More
				</button>
			</nav>

			<UniversalModal open={moreOpen} onOpenChange={setMoreOpen} title="More">
				<Link to="/spaces" className="space-sw" style={{ padding: 12 }} onClick={() => setMoreOpen(false)}>
					<span className="space-dot" style={{ width: 36, height: 36, fontSize: 14 }}>
						{isAllView ? "A" : initialOf(space)}
					</span>
					<span className="space-meta">
						<small>
							Current space · {spaces.length} {spaces.length === 1 ? "space" : "spaces"}
						</small>
						<strong className="trunc">{space}</strong>
					</span>
					<span className="row-f" style={{ gap: 4, fontSize: 13, fontWeight: 650, color: "var(--brand)" }}>
						Switch
					</span>
				</Link>
				<nav aria-label="More pages" className="more-grid">
					{moreItems.map((item) => {
						const Icon = item.icon;
						const on = isNavItemActive(pathname, item);
						return (
							<Link
								key={item.id}
								to={item.url}
								className={`more-i${on ? " on" : ""}`}
								aria-current={on ? "page" : undefined}
								onClick={() => setMoreOpen(false)}>
								<span className="ic-tile">
									<Icon className="ic" />
								</span>
								{item.label}
							</Link>
						);
					})}
				</nav>
				<button
					type="button"
					className="btn btn-danger btn-block"
					style={{ height: 46 }}
					onClick={() => signOut({ callbackUrl: "/login" })}>
					<LogOut className="ic ic-sm" />
					Log out
				</button>
			</UniversalModal>
		</>
	);
}
