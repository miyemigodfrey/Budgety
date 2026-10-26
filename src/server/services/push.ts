import webpush from "web-push";
import type { PrismaClient } from "@prisma/client";
import { env } from "@/env";

let configured = false;

/** Lazily wire VAPID. Returns false when keys aren't set (push stays off). */
function ensureVapid(): boolean {
	if (configured) return true;
	if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return false;
	webpush.setVapidDetails(
		"mailto:notifications@budgety.app",
		env.VAPID_PUBLIC_KEY,
		env.VAPID_PRIVATE_KEY,
	);
	configured = true;
	return true;
}

export type PushSub = {
	endpoint: string;
	keys: { p256dh: string; auth: string };
};

export async function saveSubscription(
	db: PrismaClient,
	userId: string,
	sub: PushSub,
) {
	await db.pushSubscription.upsert({
		where: { endpoint: sub.endpoint },
		update: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
		create: {
			userId,
			endpoint: sub.endpoint,
			p256dh: sub.keys.p256dh,
			auth: sub.keys.auth,
		},
	});
	return { ok: true };
}

export async function removeSubscription(
	db: PrismaClient,
	userId: string,
	endpoint?: string,
) {
	await db.pushSubscription.deleteMany({
		where: { userId, ...(endpoint ? { endpoint } : {}) },
	});
	return { ok: true };
}

type Payload = { title: string; body: string; url?: string };

const toWebPush = (s: { endpoint: string; p256dh: string; auth: string }) => ({
	endpoint: s.endpoint,
	keys: { p256dh: s.p256dh, auth: s.auth },
});

/** Send to every subscription a user has; prune ones the push service dropped. */
export async function sendToUser(
	db: PrismaClient,
	userId: string,
	payload: Payload,
) {
	if (!ensureVapid()) return { sent: 0, configured: false };
	const subs = await db.pushSubscription.findMany({ where: { userId } });
	let sent = 0;
	for (const s of subs) {
		try {
			await webpush.sendNotification(toWebPush(s), JSON.stringify(payload));
			sent += 1;
		} catch (error) {
			const code = (error as { statusCode?: number })?.statusCode;
			if (code === 404 || code === 410) {
				await db.pushSubscription
					.delete({ where: { endpoint: s.endpoint } })
					.catch(() => {});
			}
		}
	}
	return { sent, configured: true };
}

/** The daily cron target: notify every opted-in user who has a subscription. */
export async function sendDailyReminders(db: PrismaClient) {
	if (!ensureVapid()) return { users: 0, sent: 0, configured: false };
	const users = await db.user.findMany({
		where: {
			settings: { dailyReminder: true },
			pushSubscriptions: { some: {} },
		},
		select: { id: true },
	});
	const payload: Payload = {
		title: "Budgety reminder",
		body: "Don't forget to log today's money moves.",
		url: "/transaction",
	};
	let sent = 0;
	for (const u of users) {
		const r = await sendToUser(db, u.id, payload);
		sent += r.sent;
	}
	return { users: users.length, sent, configured: true };
}
