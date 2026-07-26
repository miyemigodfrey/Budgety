import { trpc } from "./client";
import type { RouterOutputs } from "@/trpc/react";

export type TransactionOverviewDto = RouterOutputs["transactions"]["overview"];

export const getTransactionOverview = () =>
	trpc.transactions.overview.query();
