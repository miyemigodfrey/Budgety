import { createTRPCClient, httpBatchLink } from "@trpc/client";
import SuperJSON from "superjson";
import type { AppRouter } from "@/server/api/root";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch wrapper that retries transient server failures.
 *
 * The app runs on a free-tier Supabase that spins down when idle. The first
 * request after a cold start can starve the small connection pool and come back
 * as a 500 (an HTML error page, which then fails to parse as JSON). By the time
 * we retry, the pool has warmed up, so a short backoff recovers silently instead
 * of leaving the page blank.
 *
 * Only safe (GET) requests are retried — tRPC sends queries as GET and mutations
 * as POST, so this never re-sends a mutation and can't double-apply anything.
 */
const retryingFetch: typeof fetch = async (input, init) => {
	const method = (init?.method ?? "GET").toUpperCase();
	const retriable = method === "GET";
	const MAX_ATTEMPTS = retriable ? 3 : 1;
	const backoff = [600, 1800];

	let lastError: unknown;
	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		try {
			const res = await fetch(input, init);
			if (retriable && res.status >= 500 && attempt < MAX_ATTEMPTS - 1) {
				await sleep(backoff[attempt] ?? 1800);
				continue;
			}
			return res;
		} catch (error) {
			// Network-level failure (connection reset mid cold-start, etc).
			lastError = error;
			if (!retriable || attempt === MAX_ATTEMPTS - 1) throw error;
			await sleep(backoff[attempt] ?? 1800);
		}
	}
	throw lastError;
};

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
			fetch: retryingFetch,
		}),
	],
});
