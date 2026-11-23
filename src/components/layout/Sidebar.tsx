"use client";

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "next-auth/react";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { LogoMark } from "@/components/app/LogoMark";
import { NAV, isNavItemActive, navGroups } from "@/lib/navItems";
import { useSpace } from "@/hooks/useSpace";
import { getMe, type Me } from "@/api/account";

export function initialOf(name?: string | null) {
	return (name?.trim()[0] ?? "B").toUpperCase();
}

/** Shared by the sidebar, top bar and More sheet. */
export function useMe() {
	const [me, setMe] = useState<Me | null>(null);
	useEffect(() => {
		let live = true;
		getMe()
			.then((m) => live && setMe(m))
			.catch(() => undefined);
		return () => {
			live = false;
		};
	}, []);
	return me;
}

export function SpaceSwitch({ compact = false }: { compact?: boolean }) {
	const { activeSpace, isAllView, loading } = useSpace();
	const name = loading ? "…" : isAllView ? "All spaces" : (activeSpace?.name ?? "…");
	return (
		<Link to="/spaces" className="space-sw" aria-label={`Switch space, current: ${name}`}>
			<span className="space-dot">{isAllView ? "A" : initialOf(name)}</span>
			<span className="space-meta">
				{!compact && <small>Space</small>}
				<strong className="trunc">{name}</strong>
			</span>
			<ChevronsUpDown className="ic ic-sm t-muted" />
		</Link>
	);
}

export default function Sidebar() {
	const { pathname } = useLocation();
	const { spaces } = useSpace();
	const me = useMe();

	return (
		<aside className="side" aria-label="Main navigation">
			<Link to="/dashboard" className="logo" aria-label="Budgety home">
				<LogoMark id="side" />
				<span className="logo-word">Budgety</span>
			</Link>

			<SpaceSwitch />

			<nav className="nav">
				{navGroups.map((g) => (
					<div className="nav-g" key={g.title}>
						<span className="nav-gt t-over">{g.title}</span>
						{g.items.map((item) => {
							const Icon = item.icon;
							const on = isNavItemActive(pathname, item);
							return (
								<Link
									key={item.id}
									to={item.url}
									className={`nav-i${on ? " on" : ""}`}
									aria-current={on ? "page" : undefined}>
									<Icon className="ic" />
									<span>{item.label}</span>
									{item.id === "spaces" && spaces.length > 0 && (
										<span className="count">{spaces.length}</span>
									)}
								</Link>
							);
						})}
					</div>
				))}
			</nav>

			<div className="side-foot">
				<Link
					to={NAV.settings.url}
					className={`nav-i${isNavItemActive(pathname, NAV.settings) ? " on" : ""}`}
					aria-current={isNavItemActive(pathname, NAV.settings) ? "page" : undefined}>
					<NAV.settings.icon className="ic" />
					<span>Settings</span>
				</Link>
				<div className="user-card">
					<Link to="/profile" className="row-f grow" aria-label="Profile" style={{ gap: 10 }}>
						<span className="avatar">{initialOf(me?.name ?? me?.email)}</span>
						<span className="user-meta">
							<strong className="trunc">{me?.name || "Your profile"}</strong>
							<small className="trunc">{me?.email ?? ""}</small>
						</span>
					</Link>
					<button
						type="button"
						className="btn btn-ghost btn-icon btn-sm hide-t"
						aria-label="Log out"
						title="Log out"
						onClick={() => signOut({ callbackUrl: "/login" })}>
						<LogOut className="ic ic-sm" />
					</button>
				</div>
			</div>
		</aside>
	);
}
