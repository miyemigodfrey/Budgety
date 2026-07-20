import { useCallback, useEffect, useState } from "react";
import {
	ThemeContext,
	THEME_STORAGE_KEY,
	type Theme,
} from "./ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { getSettings } from "@/api/settings";

const readStoredTheme = (): Theme => {
	try {
		return localStorage.getItem(THEME_STORAGE_KEY) === "dark"
			? "dark"
			: "light";
	} catch {
		return "light";
	}
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	// Initialise synchronously from the same key the pre-paint script in
	// index.html reads, so React state agrees with the DOM from the first
	// render (no flicker on hydration).
	const [theme, setTheme] = useState<Theme>(readStoredTheme);
	const { isAuthenticated } = useAuth();

	// Single owner of the `dark` class and the persisted value. Nothing else in
	// the app touches documentElement.classList — that was the bug where dark
	// mode only applied while the Settings page was mounted.
	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
		try {
			localStorage.setItem(THEME_STORAGE_KEY, theme);
		} catch {
			/* storage unavailable (private mode) — theme still applies in-memory */
		}
	}, [theme]);

	// Once signed in, the server is the source of truth. This never blocks
	// first paint: local storage has already supplied a theme.
	useEffect(() => {
		if (!isAuthenticated) return;
		let cancelled = false;

		async function syncFromServer() {
			try {
				const settings = await getSettings();
				if (cancelled) return;
				setTheme(settings.darkMode ? "dark" : "light");
			} catch (error) {
				// Non-fatal: keep whatever the local value was.
				console.error("Failed to sync theme from settings:", error);
			}
		}

		syncFromServer();
		return () => {
			cancelled = true;
		};
	}, [isAuthenticated]);

	const toggleTheme = useCallback(() => {
		setTheme((t) => (t === "dark" ? "light" : "dark"));
	}, []);

	return (
		<ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}
