import { trpc } from "./client";
import type { RouterOutputs } from "@/trpc/react";

export type ReconcileResult = RouterOutputs["reconciliation"]["reconcile"][number];
export type Discrepancy = RouterOutputs["reconciliation"]["list"][number];
export type SourceReconciliationSummary =
	RouterOutputs["reconciliation"]["bySource"];
export type ReconcileEntry = { sourceId: string; actualBalance: number };

export const createReconciliation = (entries: ReconcileEntry[]) =>
	trpc.reconciliation.reconcile.mutate({ entries });

export const getDiscrepancies = () => trpc.reconciliation.list.query();

export const getReconciliationBySourceId = (sourceId: string) =>
	trpc.reconciliation.bySource.query({ sourceId });
