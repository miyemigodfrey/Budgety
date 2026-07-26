import { createTRPCClient, httpBatchLink } from "@trpc/client";
import SuperJSON from "superjson";
import type { AppRouter } from "@/server/api/root";

/**
 * Vanilla (imperative) tRPC client.
 *
 * The feature pages were written against an axios API and call these
 * imperatively (`await getSources()`), keeping their status/reloadKey fetch
 * pattern. Rather than rewrite every page onto React Query hooks, the `@/api/*`
 * modules re-expose the same function signatures over this client. Same-origin,
 * so the session cookie is sent automatically — no Bearer token.
 */
export const trpc = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: "/api/trpc",
			transformer: SuperJSON,
		}),
	],
});
