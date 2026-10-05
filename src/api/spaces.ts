import { trpc } from "./client";
import type { RouterOutputs } from "@/trpc/react";

export type SpaceDto = RouterOutputs["spaces"]["list"][number];

export const getSpaces = () => trpc.spaces.list.query();

export const createSpace = (name: string) =>
	trpc.spaces.create.mutate({ name });

export const renameSpace = (id: string, name: string) =>
	trpc.spaces.rename.mutate({ id, name });

export const deleteSpace = (id: string) => trpc.spaces.delete.mutate({ id });
