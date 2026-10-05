"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getSpaces, type SpaceDto } from "@/api/spaces";
import { setActiveSpaceId } from "@/api/activeSpace";
import { SpaceContext, SPACE_STORAGE_KEY } from "./SpaceContext";

const ALL = "all";

/**
 * The raw stored preference: `"all"` (the view chosen explicitly), a space id,
 * or `null` when nothing is stored yet. Kept distinct from the resolved active
 * space so a page reload preserves an explicit "All" instead of snapping back
 * to the default space.
 */
const readStored = (): string | null => {
	try {
		return localStorage.getItem(SPACE_STORAGE_KEY);
	} catch {
		return null;
	}
};

const persist = (id: string | null) => {
	try {
		localStorage.setItem(SPACE_STORAGE_KEY, id ?? ALL);
	} catch {
		/* storage unavailable (private mode) — selection is in-memory only */
	}
};

export function SpaceProvider({ children }: { children: React.ReactNode }) {
	const { status } = useSession();
	const [spaces, setSpaces] = useState<SpaceDto[]>([]);
	const [activeSpaceId, setId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	// One owner of the module-level holder the query shims read. Kept in sync
	// synchronously with the state so a switch is visible to the very next fetch.
	const apply = useCallback((id: string | null) => {
		setActiveSpaceId(id);
		setId(id);
	}, []);

	const setActiveSpace = useCallback(
		(id: string | null) => {
			persist(id);
			apply(id);
		},
		[apply],
	);

	const load = useCallback(async () => {
		const list = await getSpaces();
		setSpaces(list);
		return list;
	}, []);

	const refreshSpaces = useCallback(async () => {
		const list = await load();
		// If the open space was deleted elsewhere, fall back to the default one.
		if (activeSpaceId && !list.some((s) => s.id === activeSpaceId)) {
			const fallback = list.find((s) => s.isDefault) ?? list[0];
			setActiveSpace(fallback ? fallback.id : null);
		}
	}, [load, activeSpaceId, setActiveSpace]);

	useEffect(() => {
		if (status !== "authenticated") return;
		let cancelled = false;

		(async () => {
			try {
				const list = await load();
				if (cancelled) return;
				// Honour an explicit "All"; else the stored space if it still exists;
				// else the default; else the first. With nothing stored, the user
				// starts inside a space rather than the read-only "All" view.
				const stored = readStored();
				const initial =
					stored === ALL
						? null
						: ((stored && list.find((s) => s.id === stored)?.id) ??
							list.find((s) => s.isDefault)?.id ??
							list[0]?.id ??
							null);
				apply(initial);
			} catch {
				/* leave in "All" (null) — pages still render read-only */
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [status, load, apply]);

	const activeSpace = spaces.find((s) => s.id === activeSpaceId);

	return (
		<SpaceContext.Provider
			value={{
				spaces,
				activeSpaceId,
				activeSpace,
				isAllView: activeSpaceId === null,
				loading,
				setActiveSpace,
				refreshSpaces,
			}}>
			{children}
		</SpaceContext.Provider>
	);
}
