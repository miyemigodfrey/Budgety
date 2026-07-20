import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
	createCategorySchema,
	updateCategorySchema,
} from "@/server/api/schemas";
import * as categories from "@/server/services/categories";

export const categoriesRouter = createTRPCRouter({
	list: protectedProcedure.query(({ ctx }) =>
		categories.listCategories(ctx.db, ctx.session.user.id),
	),

	create: protectedProcedure
		.input(createCategorySchema)
		.mutation(({ ctx, input }) =>
			categories.createCategory(ctx.db, ctx.session.user.id, input),
		),

	update: protectedProcedure
		.input(updateCategorySchema)
		.mutation(({ ctx, input }) =>
			categories.updateCategory(ctx.db, ctx.session.user.id, input),
		),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(({ ctx, input }) =>
			categories.deleteCategory(ctx.db, ctx.session.user.id, input.id),
		),
});
