/**
 * Module-level holder for the active Space id.
 *
 * The `@/api/*` query shims are imperative module functions, decoupled from
 * React. Rather than thread `spaceId` through every call site, `SpaceProvider`
 * keeps this holder in sync with the space the user has open, and the read
 * shims consult `spaceArg()` so every request is scoped to that space.
 *
 * `null` means the "All" view — no space filter, read-only across every space.
 * When the active space changes, `AppContainer` remounts the page subtree (it
 * keys on the active space), so the pages' fetch effects re-run and pick up the
 * new scope with no per-page wiring.
 */
let activeSpaceId: string | null = null;

export const setActiveSpaceId = (id: string | null) => {
	activeSpaceId = id;
};

export const getActiveSpaceId = () => activeSpaceId;

/**
 * The `spaceId` argument for a scoped query. `undefined` (the "All" view) means
 * no filter server-side; a real id scopes to that space.
 */
export const spaceArg = (): { spaceId?: string } =>
	activeSpaceId ? { spaceId: activeSpaceId } : {};
