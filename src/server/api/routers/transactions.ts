import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
	createTransactionSchema,
	listTransactionsSchema,
	monthsSchema,
	spaceScopeSchema,
	updateTransactionSchema,
} from "@/server/api/schemas";
import * as transactions from "@/server/services/transactions";

export const transactionsRouter = createTRPCRouter({
	list: protectedProcedure
		.input(listTransactionsSchema)
		.query(({ ctx, input }) =>
			transactions.listTransactions(ctx.db, ctx.session.user.id, input),
		),

	overview: protectedProcedure
		.input(spaceScopeSchema)
		.query(({ ctx, input }) =>
			transactions.getOverview(ctx.db, ctx.session.user.id, input?.spaceId),
		),

	trends: protectedProcedure
		.input(monthsSchema)
		.query(({ ctx, input }) =>
			transactions.getTrends(
				ctx.db,
				ctx.session.user.id,
				input?.months ?? 6,
				input?.spaceId,
			),
		),

	create: protectedProcedure
		.input(createTransactionSchema)
		.mutation(({ ctx, input }) =>
			transactions.createTransaction(ctx.db, ctx.session.user.id, input),
		),

	update: protectedProcedure
		.input(updateTransactionSchema)
		.mutation(({ ctx, input }) =>
			transactions.updateTransaction(ctx.db, ctx.session.user.id, input),
		),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(({ ctx, input }) =>
			transactions.deleteTransaction(ctx.db, ctx.session.user.id, input.id),
		),
});
