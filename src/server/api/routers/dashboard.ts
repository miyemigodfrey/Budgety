import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { spaceScopeSchema } from "@/server/api/schemas";
import { getDashboard } from "@/server/services/dashboard";

export const dashboardRouter = createTRPCRouter({
	get: protectedProcedure
		.input(spaceScopeSchema)
		.query(({ ctx, input }) =>
			getDashboard(ctx.db, ctx.session.user.id, input?.spaceId),
		),
});
