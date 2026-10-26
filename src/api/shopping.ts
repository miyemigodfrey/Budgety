import { trpc } from "./client";
import type { RouterInputs, RouterOutputs } from "@/trpc/react";

export type ShoppingList = RouterOutputs["shopping"]["lists"][number];
export type ShoppingItem = ShoppingList["items"][number];

type AddItemInput = RouterInputs["shopping"]["addItem"];
type UpdateItemInput = RouterInputs["shopping"]["updateItem"];

export const getLists = () => trpc.shopping.lists.query();

export const createList = (name: string) =>
	trpc.shopping.createList.mutate({ name });

export const renameList = (id: string, name: string) =>
	trpc.shopping.renameList.mutate({ id, name });

export const deleteList = (id: string) =>
	trpc.shopping.deleteList.mutate({ id });

export const addItem = (input: AddItemInput) =>
	trpc.shopping.addItem.mutate(input);

export const updateItem = (input: UpdateItemInput) =>
	trpc.shopping.updateItem.mutate(input);

export const deleteItem = (id: string) =>
	trpc.shopping.deleteItem.mutate({ id });
