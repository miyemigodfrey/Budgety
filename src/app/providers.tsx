"use client";

import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "@/context/ThemeProvider";
import { SpaceProvider } from "@/context/SpaceProvider";
import ToastProvider from "@/context/ToastProvider";

/**
 * Client provider stack. Order matters:
 *   SessionProvider  → so ThemeProvider/SpaceProvider/useSession work
 *   TRPCReactProvider → so ThemeProvider's settings query works
 *   ThemeProvider     → owns the .dark class; needs both of the above
 *   SpaceProvider     → owns the active space; needs the session
 *   ToastProvider     → reads the theme
 */
export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<TRPCReactProvider>
				<ThemeProvider>
					<SpaceProvider>
						{children}
						<ToastProvider />
					</SpaceProvider>
				</ThemeProvider>
			</TRPCReactProvider>
		</SessionProvider>
	);
}
