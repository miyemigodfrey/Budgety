"use client";

import { Link } from "react-router-dom";
import { Layers, ChevronRight, Eye } from "lucide-react";
import { useSpace } from "@/hooks/useSpace";

/**
 * Thin bar above every page showing which space is open (or the read-only
 * "All" view). Tapping it goes to the Spaces page to switch or manage spaces.
 */
export default function SpaceBar() {
	const { activeSpace, isAllView, loading } = useSpace();

	const label = isAllView ? "All spaces" : (activeSpace?.name ?? "…");

	return (
		<div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-card/80 px-3 py-2 backdrop-blur md:px-6">
			<Link
				to="/spaces"
				className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium hover:bg-muted">
				<Layers size={16} className="text-brand" />
				<span className="text-muted-foreground">Space</span>
				<ChevronRight size={14} className="text-muted-foreground" />
				<span className="font-semibold text-foreground">
					{loading ? "…" : label}
				</span>
			</Link>

			{isAllView && (
				<span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
					<Eye size={12} />
					View only
				</span>
			)}
		</div>
	);
}
