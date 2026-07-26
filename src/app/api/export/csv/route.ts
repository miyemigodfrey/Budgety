import { type NextRequest } from "next/server";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { buildCsv } from "@/server/services/export";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	const userId = await requireUser();
	if (!userId) return new Response("Unauthorized", { status: 401 });

	// Both dates optional — the service defaults to the current month.
	const startDate = req.nextUrl.searchParams.get("startDate") ?? undefined;
	const endDate = req.nextUrl.searchParams.get("endDate") ?? undefined;

	const { csv, range } = await buildCsv(db, userId, startDate, endDate);

	return new Response(csv, {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="budgety-report-${range.startDate}-to-${range.endDate}.csv"`,
		},
	});
}
