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

// src/types/source.ts

export type Transaction = {
	id: string;
	userId: string;
	sourceId: string;
	type: "inflow" | "outflow"; // inferred from your example
	amount: number;
	category: string;
	note: string;
	date: string;
	transferTargetId: string;
	createdAt: string;
	updatedAt: string;
};

export type SourceId = {
	id: string;
	userId: string;
	name: string;
	balance: number;
	initialBalance: number;
	remainingBalance: number;
	currency: string;
	createdAt: string;
	updatedAt: string;
	transactions: Transaction[];
};

export type SourceSummary = {
	inflow: number;
	outflow: number;
	net: number;
	period: string;
};

export const createSource = async (data: CreateSourceDto) => {
	const res = await api.post("/sources", data);
	return res.data;
};

export const getSources = async (): Promise<SourceDto[]> => {
	const res = await api.get("/sources");
	return res.data;
};

export const getSourceById = async (id: string): Promise<SourceId> => {
	const res = await api.get(`/sources/${id}`);
	return res.data;
};

export const getSummary = async (id: string): Promise<SourceSummary> => {
	const res = await api.get(`/sources/${id}/summary`);
	return res.data;
};
