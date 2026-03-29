import api from "./axios";
import { type CreateSourceDto } from "@/api/sources";

export type RecentTransactionOverviewDto = {
	id: string;
	userId: string;
	sourceId: string;
	type: "inflow" | "outflow" | "transfer";
	amount: number;
	category: string;
	note: string;
	date: string;
	transferTargetId: string; // For transfer transactions, the source ID of the other account
	createdAt: string;
	updatedAt: string;
	sourceName: string;
	transferTargetName: string;
};

export type TransactionOverviewDto = {
	totalBalance: number;
	sources: [CreateSourceDto];
	monthly: {
		period: string;
		inflow: number;
		outflow: number;
		net: number;
	};
	recentTransaction: [RecentTransactionOverviewDto];
};

export const getTransactionOverview = async (): Promise<
	TransactionOverviewDto[]
> => {
	const res = await api.get("/dashboard");
	console.log(res);
	return res.data;
};
