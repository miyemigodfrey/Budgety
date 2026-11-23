"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import SpaceBar from "./SpaceBar";
import { PinLockGate } from "./PinLockGate";
import { useSpace } from "@/hooks/useSpace";
import { QuickAddProvider, useQuickAdd } from "@/components/app/QuickAdd";

/**
 * The signed-in shell from the redesign: full sidebar on desktop and laptop,
 * an icon rail on tablet, and a top bar with bottom tabs on phones. Layout
 * classes (.shell, .side, .main, .topbar, .mtop, .tabbar) live in budgety.css.
 */
export default function AppContainer({ children }: { children: React.ReactNode }) {
	return (
		<PinLockGate>
			<QuickAddProvider>
				<Shell>{children}</Shell>
			</QuickAddProvider>
		</PinLockGate>
	);
}

function Shell({ children }: { children: React.ReactNode }) {
	const { activeSpaceId } = useSpace();
	const { dataVersion } = useQuickAdd();
	return (
		<div className="app">
			<div className="shell">
				<Sidebar />
				<div className="main">
					<SpaceBar />
					{/* Keying on the active space (and on shell-level data changes such
					    as a quick add) remounts the page, so its fetch effects re-run. */}
					<React.Fragment key={`${activeSpaceId ?? "all"}:${dataVersion}`}>
						{children}
					</React.Fragment>
					<Navbar />
				</div>
			</div>
		</div>
	);
}
