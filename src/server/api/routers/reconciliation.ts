import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { reconcileSchema } from "@/server/api/schemas";
import * as reconciliation from "@/server/services/reconciliation";

export const reconciliationRouter = createTRPCRouter({
	reconcile: protectedProcedure
		.input(reconcileSchema)
		.mutation(({ ctx, input }) =>
			reconciliation.reconcile(ctx.db, ctx.session.user.id, input.entries),
		),

	list: protectedProcedure.query(({ ctx }) =>
		reconciliation.getDiscrepancies(ctx.db, ctx.session.user.id),
	),

	bySource: protectedProcedure
		.input(z.object({ sourceId: z.string() }))
		.query(({ ctx, input }) =>
			reconciliation.getReconciliationBySource(
				ctx.db,
				ctx.session.user.id,
				input.sourceId,
			),
		),
});
