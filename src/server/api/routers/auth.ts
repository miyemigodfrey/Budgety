import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { registerSchema } from "@/server/api/schemas";
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "@/server/constants";

export const authRouter = createTRPCRouter({
	// Login is NOT here — NextAuth's Credentials provider owns the credential
	// exchange (it must set the session cookie). This only creates the account;
	// the signup page then calls signIn() with the same credentials.
	register: publicProcedure
		.input(registerSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.user.findUnique({
				where: { email: input.email },
			});
			if (existing) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Email already registered",
				});
			}

			const password = await bcrypt.hash(input.password, 10);

			// Create the user with default categories and a settings row in one
			// transaction. Seeding settings here is what lets settings.get be a pure
			// read (the NestJS version lazily inserted on read).
			const user = await ctx.db.user.create({
				data: {
					email: input.email,
					name: input.name,
					password,
					categories: { create: DEFAULT_CATEGORIES },
					settings: { create: DEFAULT_SETTINGS },
				},
			});

			return { id: user.id, email: user.email, name: user.name };
		}),
});
