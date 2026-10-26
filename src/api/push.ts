import { trpc } from "./client";
import type { RouterInputs } from "@/trpc/react";

export type PushSubscriptionInput = RouterInputs["push"]["subscribe"];

export const subscribePush = (sub: PushSubscriptionInput) =>
	trpc.push.subscribe.mutate(sub);

export const unsubscribePush = (endpoint?: string) =>
	trpc.push.unsubscribe.mutate(endpoint ? { endpoint } : undefined);

export const sendTestPush = () => trpc.push.sendTest.mutate();
