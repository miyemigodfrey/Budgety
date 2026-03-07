import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppContainer({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen flex bg-gray-50">
			<aside className="hidden md:flex md:w-56 lg:w-64 bg-white border-r border-gray-200 p-4 fixed top-0 left-0 bottom-0 z-20">
				<Sidebar />
			</aside>

			<div className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0 md:ml-56 lg:ml-64">
				<main className="flex-1 md:overflow-y-auto p-2 md:p-6">{children}</main>

				<Navbar />
			</div>
		</div>
	);
}
