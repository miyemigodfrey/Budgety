import "@/styles/globals.css";

import { type Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
	title: "Budgety",
	description: "Personal finance management",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

// Keep in sync with THEME_STORAGE_KEY in src/context/ThemeContext.ts.
// Runs before the bundle loads so a dark-mode user never sees a light flash.
const themeScript = `try{if(localStorage.getItem("budgety:theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		// suppressHydrationWarning: the script above mutates <html>'s className
		// before React hydrates, which would otherwise warn on every load.
		<html lang="en" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
			</head>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
