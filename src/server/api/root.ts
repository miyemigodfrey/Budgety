import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { authRouter } from "@/server/api/routers/auth";
import { accountRouter } from "@/server/api/routers/account";
import { pushRouter } from "@/server/api/routers/push";
import { sourcesRouter } from "@/server/api/routers/sources";
import { transactionsRouter } from "@/server/api/routers/transactions";
import { categoriesRouter } from "@/server/api/routers/categories";
import { dashboardRouter } from "@/server/api/routers/dashboard";
import { reconciliationRouter } from "@/server/api/routers/reconciliation";
import { settingsRouter } from "@/server/api/routers/settings";
import { exportRouter } from "@/server/api/routers/export";
import { spacesRouter } from "@/server/api/routers/spaces";
import { shoppingRouter } from "@/server/api/routers/shopping";

/**
 * The primary router, one sub-router per former NestJS module.
 */
export const appRouter = createTRPCRouter({
	auth: authRouter,
	account: accountRouter,
	push: pushRouter,
	sources: sourcesRouter,
	transactions: transactionsRouter,
	categories: categoriesRouter,
	dashboard: dashboardRouter,
	reconciliation: reconciliationRouter,
	settings: settingsRouter,
	export: exportRouter,
	spaces: spacesRouter,
	shopping: shoppingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 */
export const createCaller = createCallerFactory(appRouter);
