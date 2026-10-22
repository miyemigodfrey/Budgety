"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { LockKeyhole } from "lucide-react";
import { PinInput } from "@/components/PinInput";
import { AppLoader } from "@/components/AppLoader";
import { getMe } from "@/api/account";
import { verifyPin } from "@/api/account";
import { getSettings } from "@/api/settings";

const UNLOCK_KEY = "budgety:unlocked";
const MAX_ATTEMPTS = 5;

const readUnlocked = () => {
	try {
		return sessionStorage.getItem(UNLOCK_KEY) === "1";
	} catch {
		return false;
	}
};
const markUnlocked = () => {
	try {
		sessionStorage.setItem(UNLOCK_KEY, "1");
	} catch {
		/* storage unavailable (private mode) — unlock stays in memory for this render */
	}
};

type Status = "loading" | "locked" | "unlocked";

/**
 * Gates the authenticated app behind the 4-digit App Lock PIN. When App Lock is
 * on and a PIN is set, a fresh launch (no sessionStorage flag) shows the PIN
 * screen instead of the app; a correct PIN unlocks for the rest of the session.
 * The session cookie is still the real credential — this is a convenience lock.
 */
export function PinLockGate({ children }: { children: React.ReactNode }) {
	const [status, setStatus] = useState<Status>("loading");

	useEffect(() => {
		// Unlocked earlier this session (survives in-app navigation and reloads).
		if (readUnlocked()) {
			setStatus("unlocked");
			return;
		}
		let cancelled = false;
		const startedAt = Date.now();
		// Keep the launch animation on screen long enough to play through on a
		// cold start (it resolves instantly on later in-session reloads above).
		const MIN_SPLASH = 2600;
		(async () => {
			let target: Status = "unlocked";
			try {
				const [me, settings] = await Promise.all([getMe(), getSettings()]);
				target = settings.appLockEnabled && me.hasPin ? "locked" : "unlocked";
			} catch {
				// If we can't determine lock state, don't trap the user out — the
				// session + middleware already protect the routes.
				target = "unlocked";
			}
			const wait = Math.max(0, MIN_SPLASH - (Date.now() - startedAt));
			setTimeout(() => {
				if (!cancelled) setStatus(target);
			}, wait);
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const unlock = useCallback(() => {
		markUnlocked();
		setStatus("unlocked");
	}, []);

	if (status === "loading") return <AppLoader />;
	if (status === "locked") return <LockScreen onUnlocked={unlock} />;
	return <>{children}</>;
}

function LockScreen({ onUnlocked }: { onUnlocked: () => void }) {
	const [error, setError] = useState<string | null>(null);
	const [resetSignal, setResetSignal] = useState(0);
	const [attempts, setAttempts] = useState(0);
	const [checking, setChecking] = useState(false);

	const handleComplete = async (pin: string) => {
		setChecking(true);
		try {
			const { ok } = await verifyPin(pin);
			if (ok) {
				onUnlocked();
				return;
			}
			const next = attempts + 1;
			setAttempts(next);
			if (next >= MAX_ATTEMPTS) {
				await signOut({ callbackUrl: "/login" });
				return;
			}
			setError(`Wrong PIN. ${MAX_ATTEMPTS - next} tries left.`);
			setResetSignal((n) => n + 1);
		} catch {
			setError("Couldn't verify. Try again.");
			setResetSignal((n) => n + 1);
		} finally {
			setChecking(false);
		}
	};

	return (
		<div className="min-h-screen w-full flex flex-col items-center justify-center gap-8 bg-app-background px-6">
			<div className="flex flex-col items-center gap-3 text-center">
				<div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
					<LockKeyhole className="size-6 text-brand" />
				</div>
				<h1 className="text-xl font-bold text-foreground">Enter your PIN</h1>
				<p className="text-sm text-muted-foreground">
					Budgety is locked. Enter your 4-digit PIN to continue.
				</p>
			</div>

			<PinInput
				onComplete={handleComplete}
				error={error}
				resetSignal={resetSignal}
				disabled={checking}
			/>

			<button
				type="button"
				onClick={() => signOut({ callbackUrl: "/login" })}
				className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
				Forgot PIN? Use password
			</button>
		</div>
	);
}
