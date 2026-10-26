import { subscribePush, unsubscribePush } from "@/api/push";

/** VAPID public key (base64url) -> Uint8Array for PushManager.subscribe. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
	const padding = "=".repeat((4 - (base64.length % 4)) % 4);
	const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
	const raw = atob(b64);
	const out = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
	return out;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
	if (!("serviceWorker" in navigator)) return null;
	// Ensure the SW is registered (it only auto-registers in production).
	try {
		await navigator.serviceWorker.register("/sw.js");
	} catch {
		/* already registered or blocked — fall through to ready */
	}
	return navigator.serviceWorker.ready;
}

/**
 * Ask permission, create a push subscription, and store it server-side.
 * Returns { ok } so the caller can roll the toggle back on failure.
 */
export async function enablePush(): Promise<{ ok: boolean; reason?: string }> {
	const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
	if (!key) return { ok: false, reason: "Reminders aren't configured yet." };
	if (
		typeof window === "undefined" ||
		!("serviceWorker" in navigator) ||
		!("PushManager" in window) ||
		!("Notification" in window)
	) {
		return {
			ok: false,
			reason: "This device doesn't support notifications. On iPhone, add Budgety to your home screen first.",
		};
	}

	let permission = Notification.permission;
	if (permission === "default") permission = await Notification.requestPermission();
	if (permission !== "granted") {
		return { ok: false, reason: "Notifications weren't allowed." };
	}

	const reg = await getRegistration();
	if (!reg) return { ok: false, reason: "Couldn't start the notification service." };

	try {
		const existing = await reg.pushManager.getSubscription();
		const sub =
			existing ??
			(await reg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
			}));
		const json = sub.toJSON();
		if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
			return { ok: false, reason: "Couldn't create the subscription." };
		}
		await subscribePush({
			endpoint: json.endpoint,
			keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
		});
		return { ok: true };
	} catch {
		return { ok: false, reason: "Couldn't enable notifications. Try again." };
	}
}

/** Remove the local subscription and tell the server to forget it. */
export async function disablePush(): Promise<void> {
	let endpoint: string | undefined;
	try {
		if ("serviceWorker" in navigator) {
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.getSubscription();
			endpoint = sub?.endpoint;
			if (sub) await sub.unsubscribe().catch(() => {});
		}
	} catch {
		/* best effort */
	}
	await unsubscribePush(endpoint).catch(() => {});
}
