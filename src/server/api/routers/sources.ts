import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
	createSourceSchema,
	sourceSummarySchema,
	updateSourceSchema,
} from "@/server/api/schemas";
import * as sources from "@/server/services/sources";

export const sourcesRouter = createTRPCRouter({
	list: protectedProcedure.query(({ ctx }) =>
		sources.listSources(ctx.db, ctx.session.user.id),
	),

	overview: protectedProcedure.query(({ ctx }) =>
		sources.getSourcesOverview(ctx.db, ctx.session.user.id),
	),

	byId: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(({ ctx, input }) =>
			sources.getSourceById(ctx.db, ctx.session.user.id, input.id),
		),

	summary: protectedProcedure
		.input(sourceSummarySchema)
		.query(({ ctx, input }) =>
			sources.getSourceSummary(
				ctx.db,
				ctx.session.user.id,
				input.id,
				input.period,
			),
		),

	create: protectedProcedure
		.input(createSourceSchema)
		.mutation(({ ctx, input }) =>
			sources.createSource(ctx.db, ctx.session.user.id, input),
		),

	update: protectedProcedure
		.input(updateSourceSchema)
		.mutation(({ ctx, input }) =>
			sources.updateSource(ctx.db, ctx.session.user.id, input),
		),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(({ ctx, input }) =>
			sources.deleteSource(ctx.db, ctx.session.user.id, input.id),
		),
});
