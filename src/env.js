import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Server-side variables. Never exposed to the client.
	 */
	server: {
		// Pooled connection for runtime (Supabase Supavisor, port 6543).
		// Validated as a non-empty string rather than .url(): Postgres connection
		// strings (special chars in passwords, pgbouncer params) legitimately fail
		// zod's URL check, and Prisma validates the real format at connect time.
		DATABASE_URL: z.string().min(1),
		// Direct connection for `prisma migrate` (port 5432). Prisma reads it from
		// the schema's directUrl; optional in the app's own runtime.
		DIRECT_URL: z.string().min(1).optional(),
		// Replaces the old JWT_SECRET. No fallback on purpose: the app must refuse
		// to boot without a real secret, unlike 'budgety-dev-secret'.
		AUTH_SECRET:
			process.env.NODE_ENV === "production"
				? z.string().min(1)
				: z.string().min(1).optional(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		// Web Push (daily reminders). Optional: without them the push feature is
		// simply off and the app still boots.
		VAPID_PUBLIC_KEY: z.string().min(1).optional(),
		VAPID_PRIVATE_KEY: z.string().min(1).optional(),
		// Shared secret the Vercel Cron sends to authorize the reminder send route.
		CRON_SECRET: z.string().min(1).optional(),
	},

	/**
	 * Client-side variables — must be prefixed with NEXT_PUBLIC_. The public VAPID
	 * key is safe to expose; the browser needs it to create a push subscription.
	 */
	client: {
		NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1).optional(),
	},

	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		DIRECT_URL: process.env.DIRECT_URL,
		AUTH_SECRET: process.env.AUTH_SECRET,
		NODE_ENV: process.env.NODE_ENV,
		VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
		VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
		CRON_SECRET: process.env.CRON_SECRET,
		NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
	},

	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
