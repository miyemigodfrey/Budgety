import { type DefaultSession, type NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config. Deliberately imports NOTHING with a Node dependency
 * (no bcryptjs, no Prisma) so the middleware bundle stays on the Edge runtime.
 * It carries the callbacks and session strategy needed to READ the JWT session;
 * the Credentials provider (which does need bcrypt + db) is added only in the
 * Node config used by the route handlers.
 */
declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
		} & DefaultSession["user"];
	}
}

export const authConfigEdge = {
	providers: [],
	session: {
		strategy: "jwt",
		maxAge: 7 * 24 * 60 * 60, // 7 days, matching the old JWT_EXPIRATION
	},
	callbacks: {
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
