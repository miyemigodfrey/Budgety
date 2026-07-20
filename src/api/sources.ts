import { trpc } from "./client";
import type { RouterInputs, RouterOutputs } from "@/trpc/react";

// Types inferred from the router so pages import the same names as before.
export type SourceDto = RouterOutputs["sources"]["list"][number];
export type SourceId = RouterOutputs["sources"]["byId"];
// The bare row returned by create/update (no derived initial/remaining fields).
export type Source = RouterOutputs["sources"]["create"];
export type SourceSummary = RouterOutputs["sources"]["summary"];
export type CreateSourceDto = RouterInputs["sources"]["create"];
export type UpdateSourceDto = Omit<RouterInputs["sources"]["update"], "id">;

export const getSources = () => trpc.sources.list.query();

export const getSourceById = (id: string) => trpc.sources.byId.query({ id });

export const getSummary = (id: string, period: SourceSummary["period"]) =>
	trpc.sources.summary.query({ id, period });

export const createSource = (data: CreateSourceDto) =>
	trpc.sources.create.mutate(data);

export const updateSource = (id: string, data: UpdateSourceDto) =>
	trpc.sources.update.mutate({ id, ...data });

export const deleteSource = (id: string) =>
	trpc.sources.delete.mutate({ id });
