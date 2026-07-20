import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };

/**
 * For Route Handlers, which bypass tRPC's protectedProcedure. Returns the
 * user id or null; callers 401 on null.
 */
export async function requireUser(): Promise<string | null> {
	const session = await auth();
	return session?.user?.id ?? null;
}
