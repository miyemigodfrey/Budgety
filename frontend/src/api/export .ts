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
