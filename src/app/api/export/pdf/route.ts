import { type NextRequest } from "next/server";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { getPdfData } from "@/server/services/export";
import { generateTransactionsPdf } from "@/server/export/pdf";

// pdfkit needs Node APIs (fs/stream/Buffer) — it cannot run on the Edge runtime.
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	const userId = await requireUser();
	if (!userId) return new Response("Unauthorized", { status: 401 });

	const startDate = req.nextUrl.searchParams.get("startDate");
	const endDate = req.nextUrl.searchParams.get("endDate");
	// Both required, matching the old controller.
	if (!startDate || !endDate) {
		return new Response("startDate and endDate query params are required", {
			status: 400,
		});
	}

	const data = await getPdfData(db, userId, startDate, endDate);
	if (!data) return new Response("No sources found for this user", { status: 404 });

	const buffer = await generateTransactionsPdf({
		transactions: data.transactions,
		sources: data.sources,
		startDate,
		endDate,
		userName: data.userName,
	});

	return new Response(new Uint8Array(buffer), {
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="budgety-report-${startDate}-to-${endDate}.pdf"`,
			"Content-Length": String(buffer.length),
		},
	});
}
