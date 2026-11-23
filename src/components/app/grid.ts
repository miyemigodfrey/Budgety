import type { CSSProperties } from "react";

/**
 * Column spans for an item in a `.g` 12-column grid, per breakpoint:
 * d desktop, l laptop (falls back to d), t tablet, m mobile, mo mobile order.
 * Usage: <section className="card" style={span({ d: 6, t: 12 })}>
 */
export function span(
	s: { d?: number; l?: number; t?: number; m?: number; mo?: number },
	extra?: CSSProperties,
): CSSProperties {
	const v: Record<string, number> = {};
	if (s.d != null) v["--d"] = s.d;
	if (s.l != null) v["--l"] = s.l;
	if (s.t != null) v["--t"] = s.t;
	if (s.m != null) v["--m"] = s.m;
	if (s.mo != null) v["--mo"] = s.mo;
	return { ...(v as CSSProperties), ...extra };
}
