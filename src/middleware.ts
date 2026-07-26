import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfigEdge } from "@/server/auth/config.edge";

// Build a lightweight NextAuth instance from the edge-safe config so this
// middleware bundle never pulls in bcryptjs or Prisma.
const { auth } = NextAuth(authConfigEdge);

/**
 * Redirects unauthenticated users away from the app routes to /login,
 * replacing the old ProtectedLayout guard. The (app)/layout.tsx also checks
 * the session server-side, so components can rely on it being present.
 */
export default auth((req) => {
	if (!req.auth) {
		const url = new URL("/login", req.nextUrl.origin);
		url.searchParams.set("from", req.nextUrl.pathname);
		return NextResponse.redirect(url);
	}
	return NextResponse.next();
});

export const config = {
	matcher: [
		"/dashboard/:path*",
		"/source/:path*",
		"/sources/:path*",
		"/transaction/:path*",
		"/report/:path*",
		"/reconcilation/:path*",
		"/setting/:path*",
	],
};
