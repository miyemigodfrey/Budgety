"use client";

import { useEffect } from "react";

/**
 * Registers the service worker so Budgety is installable and resilient offline.
 * Production only — in dev a cached SW would fight Next's HMR. Renders nothing.
 */
export function ServiceWorkerRegister() {
	useEffect(() => {
		if (process.env.NODE_ENV !== "production") return;
		if (!("serviceWorker" in navigator)) return;
		const onLoad = () => {
			navigator.serviceWorker.register("/sw.js").catch(() => {
				/* registration is a progressive enhancement — ignore failures */
			});
		};
		window.addEventListener("load", onLoad);
		return () => window.removeEventListener("load", onLoad);
	}, []);
	return null;
}
