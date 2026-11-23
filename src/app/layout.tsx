import "@/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";

// App typeface from the redesign (budgety.css reads --font-jakarta).
const jakarta = Plus_Jakarta_Sans({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
	variable: "--font-jakarta",
	display: "swap",
});

export const metadata: Metadata = {
	applicationName: "Budgety",
	title: { default: "Budgety", template: "%s | Budgety" },
	description: "Track your money across purpose-based spaces.",
	manifest: "/manifest.webmanifest",
	icons: {
		icon: "/favicon.ico",
		apple: "/apple-touch-icon.png",
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Budgety",
	},
	other: {
		"mobile-web-app-capable": "yes",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	viewportFit: "cover",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#eaf1fc" },
		{ media: "(prefers-color-scheme: dark)", color: "#080d18" },
	],
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
		<html lang="en" className={jakarta.variable} suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
			</head>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
