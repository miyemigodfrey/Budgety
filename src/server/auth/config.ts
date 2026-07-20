import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/server/db";

/**
 * Adds `id` to the session user.
 */
declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
		} & DefaultSession["user"];
	}
}

const credentialsSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

/**
 * NextAuth configuration.
 *
 * Credentials provider with JWT sessions. There is deliberately NO PrismaAdapter
 * and no Account/Session tables: the adapter cannot persist sessions for
 * credential sign-ins, so `session.strategy` must be "jwt". This is where the old
 * NestJS `auth.service.login` (the bcrypt.compare) lives now.
 */
export const authConfig = {
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
	session: {
		strategy: "jwt",
		maxAge: 7 * 24 * 60 * 60, // 7 days, matching the old JWT_EXPIRATION
	},
	callbacks: {
		// Persist the user id onto the token, then expose it on the session.
		jwt: ({ token, user }) => {
			if (user) token.id = user.id;
			return token;
		},
		session: ({ session, token }) => ({
			...session,
			user: {
				...session.user,
				id: token.id as string,
			},
		}),
	},
	pages: {
		signIn: "/login",
	},
} satisfies NextAuthConfig;
