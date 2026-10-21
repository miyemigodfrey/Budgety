import { trpc } from "./client";
import type { RouterOutputs } from "@/trpc/react";

export type Me = RouterOutputs["account"]["me"];

export const getMe = () => trpc.account.me.query();

export const updateName = (name: string) =>
	trpc.account.updateName.mutate({ name });

export const setPin = (pin: string) => trpc.account.setPin.mutate({ pin });

export const verifyPin = (pin: string) =>
	trpc.account.verifyPin.mutate({ pin });

export const removePin = () => trpc.account.removePin.mutate();
