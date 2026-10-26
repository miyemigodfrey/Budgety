import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { env } from "@/env";
import { sendDailyReminders } from "@/server/services/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily reminder sender. Vercel Cron calls this on a schedule (see vercel.json)
 * and, when CRON_SECRET is set, automatically sends it as a Bearer token — so
 * only Vercel's scheduler can trigger a real send.
 */
export async function GET(request: Request) {
	const auth = request.headers.get("authorization");
	if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const result = await sendDailyReminders(db);
	return NextResponse.json({ ok: true, ...result });
}
