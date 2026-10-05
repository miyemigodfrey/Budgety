import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import * as spaces from "@/server/services/spaces";

export const spacesRouter = createTRPCRouter({
	list: protectedProcedure.query(({ ctx }) =>
		spaces.listSpaces(ctx.db, ctx.session.user.id),
	),

	create: protectedProcedure
		.input(z.object({ name: z.string().min(1) }).strict())
		.mutation(({ ctx, input }) =>
			spaces.createSpace(ctx.db, ctx.session.user.id, input.name),
		),

	rename: protectedProcedure
		.input(z.object({ id: z.string(), name: z.string().min(1) }).strict())
		.mutation(({ ctx, input }) =>
			spaces.renameSpace(ctx.db, ctx.session.user.id, input.id, input.name),
		),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }).strict())
		.mutation(({ ctx, input }) =>
			spaces.deleteSpace(ctx.db, ctx.session.user.id, input.id),
		),
});
