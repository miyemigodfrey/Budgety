import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { pinSchema, updateNameSchema } from "@/server/api/schemas";
import * as account from "@/server/services/account";

export const accountRouter = createTRPCRouter({
	me: protectedProcedure.query(({ ctx }) =>
		account.getMe(ctx.db, ctx.session.user.id),
	),

	updateName: protectedProcedure
		.input(updateNameSchema)
		.mutation(({ ctx, input }) =>
			account.updateName(ctx.db, ctx.session.user.id, input.name),
		),

	setPin: protectedProcedure
		.input(pinSchema)
		.mutation(({ ctx, input }) =>
			account.setPin(ctx.db, ctx.session.user.id, input.pin),
		),

	verifyPin: protectedProcedure
		.input(pinSchema)
		.mutation(({ ctx, input }) =>
			account.verifyPin(ctx.db, ctx.session.user.id, input.pin),
		),

	removePin: protectedProcedure.mutation(({ ctx }) =>
		account.removePin(ctx.db, ctx.session.user.id),
	),
});
