import { trpc } from "./client";
import { spaceArg } from "./activeSpace";
import type { RouterOutputs } from "@/trpc/react";

export type TransactionOverviewDto = RouterOutputs["transactions"]["overview"];

export const getTransactionOverview = () =>
	trpc.transactions.overview.query(spaceArg());
