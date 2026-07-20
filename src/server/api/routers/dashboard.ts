import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { getDashboard } from "@/server/services/dashboard";

export const dashboardRouter = createTRPCRouter({
	get: protectedProcedure.query(({ ctx }) =>
		getDashboard(ctx.db, ctx.session.user.id),
	),
});
