import api from "./axios";

export type CategoryType = "income" | "expense";

export type Category = {
	id: string;
	userId: string;
	name: string;
	type: CategoryType;
};

export type CreateCategoryDto = {
	name: string;
	type: CategoryType;
};

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

export const getCategories = async (): Promise<Category[]> => {
	const res = await api.get("/categories");
	return res.data;
};

export const createCategory = async (
	data: CreateCategoryDto,
): Promise<Category> => {
	const res = await api.post("/categories", data);
	return res.data;
};

export const updateCategory = async (
	id: string,
	data: UpdateCategoryDto,
): Promise<Category> => {
	const res = await api.patch(`/categories/${id}`, data);
	return res.data;
};

export const deleteCategory = async (id: string) => {
	const res = await api.delete(`/categories/${id}`);
	return res.data;
};
