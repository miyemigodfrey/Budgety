import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { monthsSchema } from "@/server/api/schemas";
import { getSummary } from "@/server/services/export";

/**
 * Only the JSON summary is a tRPC procedure. The PDF and CSV downloads are Route
 * Handlers (src/app/api/export/*) because binary/file responses don't belong in
 * a superjson JSON envelope.
 */
export const exportRouter = createTRPCRouter({
	summary: protectedProcedure
		.input(monthsSchema)
		.query(({ ctx, input }) =>
			getSummary(ctx.db, ctx.session.user.id, input?.months ?? 6),
		),
});
