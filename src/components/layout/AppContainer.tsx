"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import SpaceBar from "./SpaceBar";
import { useSpace } from "@/hooks/useSpace";

export default function AppContainer({
	children,
}: {
	children: React.ReactNode;
}) {
	const { activeSpaceId } = useSpace();

	return (
		<div className="min-h-screen flex bg-app-background">
			<aside className="hidden md:flex md:w-56 lg:w-64 bg-card border-r border-border p-4 fixed top-0 left-0 bottom-0 z-20">
				<Sidebar />
			</aside>

			<div className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0 md:ml-56 lg:ml-64">
				<SpaceBar />
				{/* Keying on the active space remounts the page subtree on a switch,
				    so every page's fetch effect re-runs and picks up the new scope. */}
				<main
					key={activeSpaceId ?? "all"}
					className="flex-1 md:overflow-y-auto p-2 md:p-6">
					{children}
				</main>

				<Navbar />
			</div>
		</div>
	);
}