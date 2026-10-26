import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
	addShoppingItemSchema,
	createListSchema,
	listIdSchema,
	renameListSchema,
	updateShoppingItemSchema,
} from "@/server/api/schemas";
import * as shopping from "@/server/services/shopping";

export const shoppingRouter = createTRPCRouter({
	lists: protectedProcedure.query(({ ctx }) =>
		shopping.listLists(ctx.db, ctx.session.user.id),
	),

	createList: protectedProcedure
		.input(createListSchema)
		.mutation(({ ctx, input }) =>
			shopping.createList(ctx.db, ctx.session.user.id, input.name),
		),

	renameList: protectedProcedure
		.input(renameListSchema)
		.mutation(({ ctx, input }) =>
			shopping.renameList(ctx.db, ctx.session.user.id, input.id, input.name),
		),

	deleteList: protectedProcedure
		.input(listIdSchema)
		.mutation(({ ctx, input }) =>
			shopping.deleteList(ctx.db, ctx.session.user.id, input.id),
		),

	addItem: protectedProcedure
		.input(addShoppingItemSchema)
		.mutation(({ ctx, input }) =>
			shopping.addItem(ctx.db, ctx.session.user.id, input),
		),

	updateItem: protectedProcedure
		.input(updateShoppingItemSchema)
		.mutation(({ ctx, input }) =>
			shopping.updateItem(ctx.db, ctx.session.user.id, input),
		),

	deleteItem: protectedProcedure
		.input(listIdSchema)
		.mutation(({ ctx, input }) =>
			shopping.deleteItem(ctx.db, ctx.session.user.id, input.id),
		),
});
