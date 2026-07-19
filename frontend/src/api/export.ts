import api from "./axios";

export type ReportSummary = {
	totalBalance: number;
	monthly: {
		period: string;
		inflow: number;
		outflow: number;
		net: number;
	};
	charts: {
		totalTransactionsSeries: { period: string; total: number }[];
		breakdownSeries: {
			period: string;
			sources: { sourceId: string; sourceName: string; amount: number }[];
		}[];
	};
	recentTransactions: unknown[];
};

export const getPdf = async (startDate: string, endDate: string) => {
	// eslint-disable-next-line no-useless-catch
	try {
		const res = await api.get("/export/pdf", {
			params: {
				startDate,
				endDate,
			},
			responseType: "blob",
		});
		return res.data;
	} catch (error) {
		throw error;
	}
};

export const getSummary = async (
	months: number,
): Promise<ReportSummary> => {
	const res = await api.get("/export/summary", {
		params: { months },
	});
	return res.data;
};

export const getCsv = async (startDate: string, endDate: string) => {
	// eslint-disable-next-line no-useless-catch
	try {
		const res = await api.get("/export/csv", {
			params: {
				startDate,
				endDate,
			},
			responseType: "blob",
		});
		return res.data;
	} catch (error) {
		throw error;
	}
};
