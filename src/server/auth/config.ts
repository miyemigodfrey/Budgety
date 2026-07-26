import { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/server/db";
import { authConfigEdge } from "./config.edge";

const credentialsSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

/**
 * Full (Node-runtime) auth config: the edge-safe base plus the Credentials
 * provider, which needs bcrypt + Prisma and so cannot run in middleware. This
 * is where the old NestJS `auth.service.login` (the bcrypt.compare) lives.
 *
 * There is deliberately NO PrismaAdapter and no Account/Session tables — a
 * Credentials provider requires session.strategy = "jwt" (set in config.edge).
 */
export const authConfig = {
	...authConfigEdge,
	providers: [
		Credentials({
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			authorize: async (raw) => {
				const parsed = credentialsSchema.safeParse(raw);
				if (!parsed.success) return null;

				const { email, password } = parsed.data;
				const user = await db.user.findUnique({ where: { email } });
				if (!user?.password) return null;

				const ok = await bcrypt.compare(password, user.password);
				if (!ok) return null;

				return { id: user.id, email: user.email, name: user.name };
			},
		}),
	],
} satisfies NextAuthConfig;
