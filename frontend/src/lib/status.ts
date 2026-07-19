/**
 * Fetch lifecycle for a page or panel.
 *
 * Kept explicit (rather than inferring "empty" from an empty array) so that
 * "still loading" and "loaded but genuinely empty" render differently.
 */
export type Status = "loading" | "error" | "ready";
