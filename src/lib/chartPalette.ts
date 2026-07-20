/**
 * Hex palettes for chart.js (the Inflow doughnut).
 *
 * IMPORTANT: these are deliberately hex, not the `--chart-*` CSS variables.
 * chart.js parses colours with @kurkle/color, which does NOT understand
 * `oklch()` — passing an oklch var makes it fail silently and render default
 * grey. Recharts is SVG-based and handles oklch natively, which is why the
 * other charts read their colours straight from CSS variables.
 *
 * The `light` array is the exact set the doughnut used before theming, so
 * light mode is unchanged.
 */
export const CHART_PALETTE = {
	light: ["#2563EB", "#22C55E", "#F59E0B", "#8B5CF6", "#EF4444"],
	dark: ["#60A5FA", "#4ADE80", "#FBBF24", "#A78BFA", "#F87171"],
} as const;

/** Card background per theme — used for the ring between doughnut arcs. */
export const CHART_SURFACE = {
	light: "#ffffff",
	dark: "#343434",
} as const;
