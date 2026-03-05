import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppContainer({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen flex bg-gray-200 ">
			<aside className="hidden fixed md:flex md:w-64 lg:w-72 bg-white border-r border-gray-300 p-4">
				<Sidebar />
			</aside>

			<div className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0">
				<main className="flex-1 md:overflow-y-auto">{children}</main>
				<Navbar />
			</div>
		</div>
	);
}
