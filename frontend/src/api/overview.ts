import api from "./axios";
import { type SourceDto } from "@/api/sources";
import { type TransactionDto } from "./transaction";

export type TransactionOverviewDto = {
	totalBalance: number;
	totalInitialBalance: number;

	monthly: {
		period: string;
		inflow: number;
		outflow: number;
		net: number;
	};
	recentTransactions: TransactionDto[];
	sources: SourceDto[];
};

export const getTransactionOverview =
	async (): Promise<TransactionOverviewDto> => {
		const res = await api.get("/dashboard");
		console.log(res);
		return res.data;
	};
