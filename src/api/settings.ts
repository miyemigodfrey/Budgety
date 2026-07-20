import { trpc } from "./client";
import type { RouterInputs, RouterOutputs } from "@/trpc/react";

export type UserSettings = RouterOutputs["settings"]["get"];
export type UpdateSettingsDto = RouterInputs["settings"]["update"];

export const getSettings = () => trpc.settings.get.query();

export const updateSettings = (data: UpdateSettingsDto) =>
	trpc.settings.update.mutate(data);
