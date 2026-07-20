import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Server-side variables. Never exposed to the client.
	 */
	server: {
		// Pooled connection for runtime (Supabase Supavisor, port 6543).
		DATABASE_URL: z.string().url(),
		// Direct connection for `prisma migrate` (port 5432). Prisma reads it from
		// the schema's directUrl; optional in the app's own runtime.
		DIRECT_URL: z.string().url().optional(),
		// Replaces the old JWT_SECRET. No fallback on purpose: the app must refuse
		// to boot without a real secret, unlike 'budgety-dev-secret'.
		AUTH_SECRET:
			process.env.NODE_ENV === "production"
				? z.string().min(1)
				: z.string().min(1).optional(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
	},

	/**
	 * Client-side variables — must be prefixed with NEXT_PUBLIC_. The app is
	 * same-origin, so there is no API URL here (the old VITE_API_URL is gone).
	 */
	client: {},

	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		DIRECT_URL: process.env.DIRECT_URL,
		AUTH_SECRET: process.env.AUTH_SECRET,
		NODE_ENV: process.env.NODE_ENV,
	},

	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
