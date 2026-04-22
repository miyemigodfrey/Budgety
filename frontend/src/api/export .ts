import api from "./axios";

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

export const getSummary = async (months: number) => {
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
