import { createContext } from "react";

export type Theme = "light" | "dark";

export type ThemeContextValue = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(
	undefined,
);

/** Shared with the pre-paint script in index.html — keep the key in sync. */
export const THEME_STORAGE_KEY = "budgety:theme";
