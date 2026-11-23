"use client";

import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Eye, Moon, Plus, Sun } from "lucide-react";
import { useSpace } from "@/hooks/useSpace";
import { useTheme } from "@/hooks/useTheme";
import { useQuickAdd } from "@/components/app/QuickAdd";
import { LogoMark } from "@/components/app/LogoMark";
import { pageTitle } from "@/lib/navItems";
import { SpaceSwitch, initialOf, useMe } from "./Sidebar";

function ThemeButton() {
	const { theme, toggleTheme } = useTheme();
	const dark = theme === "dark";
	return (
		<button
			type="button"
			className="btn btn-ghost btn-icon"
			onClick={toggleTheme}
			aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
			{dark ? <Sun className="ic" /> : <Moon className="ic" />}
		</button>
	);
}

/**
 * Top of every signed-in page: the desktop/tablet top bar (breadcrumb, theme,
 * Add transaction) and the phone top bar (logo, space switch, theme, avatar).
 */
export default function SpaceBar() {
	const { pathname } = useLocation();
	const { activeSpace, isAllView } = useSpace();
	const { openAddTransaction } = useQuickAdd();
	const me = useMe();
	const space = isAllView ? "All spaces" : (activeSpace?.name ?? "…");

	return (
		<>
			<header className="mtop">
				<Link to="/dashboard" aria-label="Budgety home">
					<LogoMark id="mtop" size={32} />
				</Link>
				<SpaceSwitch compact />
				<div className="mtop-actions">
					<ThemeButton />
					<Link
						to="/profile"
						className="avatar"
						aria-label="Profile"
						style={{ width: 34, height: 34, fontSize: 13 }}>
						{initialOf(me?.name ?? me?.email)}
					</Link>
				</div>
			</header>

			<header className="topbar">
				<div className="crumbs">
					<Link to="/spaces" className="trunc">
						{space}
					</Link>
					<ChevronRight className="ic ic-xs" />
					<strong className="trunc">{pageTitle(pathname)}</strong>
				</div>
				{isAllView && (
					<span className="view-only">
						<Eye className="ic ic-xs" />
						View only
					</span>
				)}
				<div className="topbar-actions">
					<ThemeButton />
					{!isAllView && (
						<button type="button" className="btn btn-primary" onClick={openAddTransaction}>
							<Plus className="ic ic-sm" />
							Add transaction
						</button>
					)}
				</div>
			</header>
		</>
	);
}
