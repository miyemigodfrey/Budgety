import { trpc } from "./client";
import type { RouterOutputs } from "@/trpc/react";

export type ReportSummary = RouterOutputs["export"]["summary"];

export const getSummary = (months: number) =>
	trpc.export.summary.query({ months });

// PDF and CSV are Route Handlers, downloaded via a plain anchor (same-origin,
// so the session cookie is sent). These build the hrefs.
export const pdfHref = (startDate: string, endDate: string) =>
	`/api/export/pdf?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

export const csvHref = (startDate: string, endDate: string) =>
	`/api/export/csv?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
