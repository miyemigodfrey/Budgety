import { trpc } from "./client";
import type { RouterInputs, RouterOutputs } from "@/trpc/react";

export type CategoryType = "income" | "expense";
export type Category = RouterOutputs["categories"]["list"][number];
export type CreateCategoryDto = RouterInputs["categories"]["create"];
export type UpdateCategoryDto = Partial<CreateCategoryDto>;

export const getCategories = () => trpc.categories.list.query();

export const createCategory = (data: CreateCategoryDto) =>
	trpc.categories.create.mutate(data);

export const updateCategory = (id: string, data: UpdateCategoryDto) =>
	trpc.categories.update.mutate({ id, ...data });

export const deleteCategory = (id: string) =>
	trpc.categories.delete.mutate({ id });
