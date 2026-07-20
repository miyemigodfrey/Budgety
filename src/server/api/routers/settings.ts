import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { updateSettingsSchema } from "@/server/api/schemas";
import * as settings from "@/server/services/settings";

export const settingsRouter = createTRPCRouter({
	get: protectedProcedure.query(({ ctx }) =>
		settings.getSettings(ctx.db, ctx.session.user.id),
	),

	update: protectedProcedure
		.input(updateSettingsSchema)
		.mutation(({ ctx, input }) =>
			settings.updateSettings(ctx.db, ctx.session.user.id, input),
		),
});
