import { trpc } from "./client";
import { spaceArg } from "./activeSpace";
import type { Granularity } from "./transaction";
import type { RouterOutputs } from "@/trpc/react";

export type ReportSummary = RouterOutputs["export"]["summary"];

export const getSummary = (
	months: number,
	granularity: Granularity = "monthly",
) => trpc.export.summary.query({ months, granularity, ...spaceArg() });

// PDF and CSV are Route Handlers, downloaded via a plain anchor (same-origin,
// so the session cookie is sent). These build the hrefs.
export const pdfHref = (startDate: string, endDate: string) =>
	`/api/export/pdf?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

export const csvHref = (startDate: string, endDate: string) =>
	`/api/export/csv?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
