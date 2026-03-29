import api from "./axios";

export type CreateSourceDto = {
	name: string;
	balance: number;
	currency?: string;
};

export type SourceDto = {
	id: string;
	name: string;
	balance: number;
	initialBalance: number;
	remainingBalance: number;
	currency: string;
	createdAt: string;
	updatedAt: string;
	userId: string;
};

export const createSource = async (data: CreateSourceDto) => {
	const res = await api.post("/sources", data);
	console.log(res);
	return res.data;
};

export const getSources = async (): Promise<SourceDto[]> => {
	const res = await api.get("/sources");
	console.log(res);
	return res.data;
};
