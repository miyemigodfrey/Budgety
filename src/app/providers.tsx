"use client";

import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "@/context/ThemeProvider";
import ToastProvider from "@/context/ToastProvider";

/**
 * Client provider stack. Order matters:
 *   SessionProvider  → so ThemeProvider/useSession work
 *   TRPCReactProvider → so ThemeProvider's settings query works
 *   ThemeProvider     → owns the .dark class; needs both of the above
 *   ToastProvider     → reads the theme
 */
export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<TRPCReactProvider>
				<ThemeProvider>
					{children}
					<ToastProvider />
				</ThemeProvider>
			</TRPCReactProvider>
		</SessionProvider>
	);
}
