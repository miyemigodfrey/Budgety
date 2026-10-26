import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import * as push from "@/server/services/push";

const subscriptionSchema = z.object({
	endpoint: z.string().url(),
	keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export const pushRouter = createTRPCRouter({
	subscribe: protectedProcedure
		.input(subscriptionSchema)
		.mutation(({ ctx, input }) =>
			push.saveSubscription(ctx.db, ctx.session.user.id, input),
		),

	unsubscribe: protectedProcedure
		.input(z.object({ endpoint: z.string().optional() }).optional())
		.mutation(({ ctx, input }) =>
			push.removeSubscription(ctx.db, ctx.session.user.id, input?.endpoint),
		),

	// Fires a one-off notification to the current user (used by a "Send test").
	sendTest: protectedProcedure.mutation(({ ctx }) =>
		push.sendToUser(ctx.db, ctx.session.user.id, {
			title: "Budgety",
			body: "Notifications are working 🎉",
			url: "/dashboard",
		}),
	),
});
