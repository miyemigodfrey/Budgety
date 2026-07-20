import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import AppContainer from "@/components/layout/AppContainer";

/**
 * Shell for all authenticated pages — sidebar + mobile nav. Middleware already
 * redirects unauthenticated users; this server-side check is belt-and-braces
 * so the layout can rely on a session existing.
 */
export default async function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	if (!session) redirect("/login");

	return <AppContainer>{children}</AppContainer>;
}
