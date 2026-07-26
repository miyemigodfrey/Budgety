import { trpc } from "./client";
import type { RouterInputs, RouterOutputs } from "@/trpc/react";

export type TransactionDto = RouterOutputs["transactions"]["list"][number];
export type createTransactionDto = RouterInputs["transactions"]["create"];
export type TrendsDto = RouterOutputs["transactions"]["trends"];
export type TrendPoint = TrendsDto["totalsByMonth"][number];

export const getTransactions = () => trpc.transactions.list.query();

export const createTransaction = (data: createTransactionDto) =>
	trpc.transactions.create.mutate(data);

export const updateTransaction = (
	id: string,
	data: Omit<RouterInputs["transactions"]["update"], "id">,
) => trpc.transactions.update.mutate({ id, ...data });

export const deleteTransaction = (id: string) =>
	trpc.transactions.delete.mutate({ id });

export const getTrends = (months = 6) =>
	trpc.transactions.trends.query({ months });
