"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

/**
 * Shared pieces of the auth-style brand panel (Login, Signup, App Lock).
 * Ported from the canvas Login/Signup/AppLock screens.
 */

/** The Budgety mark on the blue brand panel: a translucent white tile. */
function BrandMark() {
	return (
		<svg className="logo-mark" viewBox="0 0 40 40" aria-hidden="true">
			<rect width="40" height="40" rx="11" fill="#ffffff" fillOpacity="0.16" />
			<circle cx="20" cy="13.5" r="5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.6" />
			<rect x="9.5" y="16" width="21" height="14.5" rx="4" fill="#ffffff" />
			<rect x="22" y="20.6" width="10" height="5.6" rx="2.8" fill="#dbeafe" />
			<circle cx="25" cy="23.4" r="1.5" fill="#ffffff" />
		</svg>
	);
}

/** Logo + wordmark. Links home when `href` is given, otherwise static. */
export function AuthLogo({ href }: { href?: string }) {
	const inner = (
		<>
			<BrandMark />
			<span className="logo-word" style={{ color: "#ffffff" }}>
				Budgety
			</span>
		</>
	);
	if (href) {
		return (
			<Link className="logo" href={href} aria-label="Budgety home" style={{ padding: 0 }}>
				{inner}
			</Link>
		);
	}
	return (
		<span className="logo" style={{ padding: 0 }}>
			{inner}
		</span>
	);
}

/**
 * Light/dark toggle on the brand panel. Both icons are rendered and switched
 * by the `.dark` class on <html>, so server and client markup always match.
 */
export function AuthThemeToggle() {
	const { toggleTheme } = useTheme();
	return (
		<button
			className="hero-btn"
			type="button"
			aria-label="Toggle dark mode"
			onClick={toggleTheme}
			style={{ width: 40, padding: 0, justifyContent: "center" }}>
			<Moon className="ic ic-sm dark:hidden" aria-hidden="true" />
			<Sun className="ic ic-sm hidden dark:block" aria-hidden="true" />
		</button>
	);
}

/** Large decorative rings in the bottom-right corner of the brand panel. */
export function AuthRings() {
	return (
		<svg
			className="hero-rings"
			style={{ width: 520, height: 520, right: -160, top: "auto", bottom: -180, opacity: 0.16 }}
			viewBox="0 0 300 300"
			aria-hidden="true">
			{[148, 110, 72].map((r) => (
				<circle key={r} cx="150" cy="150" r={r} fill="none" stroke="#ffffff" strokeWidth="1.5" />
			))}
		</svg>
	);
}

/** Translucent white tile used for the small icons in brand-panel cards. */
export const brandTile = (size: number, radius: number): React.CSSProperties => ({
	width: size,
	height: size,
	borderRadius: radius,
	background: "oklch(1 0 0 / 0.16)",
	display: "grid",
	placeItems: "center",
	flex: "none",
});
