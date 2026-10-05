import { createContext } from "react";
import type { SpaceDto } from "@/api/spaces";

export type SpaceContextValue = {
	/** Every space the user owns. */
	spaces: SpaceDto[];
	/** The open space, or `null` for the read-only "All" view. */
	activeSpaceId: string | null;
	/** The open space's row, or `undefined` in the "All" view. */
	activeSpace: SpaceDto | undefined;
	/** True in the combined, read-only "All" view. */
	isAllView: boolean;
	loading: boolean;
	/** Open a space (`null` = the "All" view). Persisted across reloads. */
	setActiveSpace: (id: string | null) => void;
	/** Re-fetch the space list (after add / rename / delete). */
	refreshSpaces: () => Promise<void>;
};

export const SpaceContext = createContext<SpaceContextValue | undefined>(
	undefined,
);

/** Persists the open space between sessions. "all" is the read-only view. */
export const SPACE_STORAGE_KEY = "budgety:activeSpace";
