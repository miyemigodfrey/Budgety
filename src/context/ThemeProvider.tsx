"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ThemeContext, THEME_STORAGE_KEY, type Theme } from "./ThemeContext";
import { api } from "@/trpc/react";

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
	// Initialise synchronously from the same key the pre-paint script in the root
	// layout reads, so React state agrees with the DOM from the first render.
	const [theme, setTheme] = useState<Theme>(readStoredTheme);
	const { status } = useSession();

	// Only fetch settings once authenticated. The server is the source of truth,
	// but this never blocks first paint — localStorage already supplied a theme.
	const settingsQuery = api.settings.get.useQuery(undefined, {
		enabled: status === "authenticated",
	});

	// Single owner of the `dark` class and the persisted value. Nothing else in
	// the app touches documentElement.classList.
	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
		try {
			localStorage.setItem(THEME_STORAGE_KEY, theme);
		} catch {
			/* storage unavailable (private mode) — theme still applies in-memory */
		}
	}, [theme]);

	// Adopt the server value once it arrives.
	useEffect(() => {
		if (settingsQuery.data) {
			setTheme(settingsQuery.data.darkMode ? "dark" : "light");
		}
	}, [settingsQuery.data]);

	const toggleTheme = useCallback(() => {
		setTheme((t) => (t === "dark" ? "light" : "dark"));
	}, []);

	return (
		<ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}
