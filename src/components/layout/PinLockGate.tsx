"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Banknote, EyeOff, Landmark, Lock, LogOut, ShieldCheck, Smartphone } from "lucide-react";
import { PinInput } from "@/components/PinInput";
import { AppLoader } from "@/components/AppLoader";
import { getMe, type Me } from "@/api/account";
import { verifyPin } from "@/api/account";
import { getSettings } from "@/api/settings";
import { AuthLogo, AuthRings, AuthThemeToggle, brandTile } from "@/features/login/AuthChrome";

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
	const [me, setMe] = useState<Me | null>(null);

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
				const [account, settings] = await Promise.all([getMe(), getSettings()]);
				target = settings.appLockEnabled && account.hasPin ? "locked" : "unlocked";
				if (!cancelled) setMe(account);
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
	if (status === "locked") return <LockScreen me={me} onUnlocked={unlock} />;
	return <>{children}</>;
}

function LockScreen({ me, onUnlocked }: { me: Me | null; onUnlocked: () => void }) {
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

	const displayName = me?.name?.trim() || me?.email || "";
	const initial = (displayName.charAt(0) || "B").toUpperCase();

	return (
		<div className="app">
			<div className="auth">
				{/* ============ Brand panel ============ */}
				<section className="auth-brand" aria-label="App lock">
					<AuthRings />

					<div className="between" style={{ position: "relative" }}>
						<AuthLogo />
						<div className="row-f" style={{ gap: 8 }}>
							<span className="hero-pill">
								<Lock className="ic ic-xs" aria-hidden="true" />
								Locked
							</span>
							<AuthThemeToggle />
						</div>
					</div>

					<div className="stack hide-m" style={{ position: "relative", gap: 16, maxWidth: 520 }}>
						<span className="t-over" style={{ color: "oklch(1 0 0 / 0.75)" }}>
							App Lock is on
						</span>
						<h1 className="t-display" style={{ fontVariantNumeric: "normal" }}>
							Your budget is locked.
						</h1>
						<p style={{ fontSize: 16, color: "oklch(1 0 0 / 0.82)", maxWidth: 460 }}>
							Balances stay hidden until you enter your 4-digit PIN.
							{me?.email ? ` You’re still signed in as ${me.email}.` : ""}
						</p>
					</div>

					{/* Masked balance card — decorative, shows no account data. */}
					<div
						className="hide-t"
						aria-hidden="true"
						style={{
							position: "relative",
							maxWidth: 440,
							background: "oklch(1 0 0 / 0.1)",
							border: "1px solid oklch(1 0 0 / 0.2)",
							borderRadius: 20,
							padding: 20,
							display: "flex",
							flexDirection: "column",
							gap: 14,
						}}>
						<div className="between">
							<span style={{ fontSize: 12, fontWeight: 600, color: "oklch(1 0 0 / 0.78)" }}>
								Total balance
							</span>
							<EyeOff className="ic ic-sm" style={{ opacity: 0.8 }} />
						</div>
						<span style={{ fontSize: 32, fontWeight: 750, letterSpacing: "0.08em", lineHeight: 1.1 }}>
							₦ • • • • • •
						</span>
						<div style={{ height: 1, background: "oklch(1 0 0 / 0.16)" }} />
						{[
							{ Icon: Landmark, label: "Bank", w: 96 },
							{ Icon: Smartphone, label: "Wallet", w: 72 },
							{ Icon: Banknote, label: "Cash", w: 56 },
						].map(({ Icon, label, w }) => (
							<div key={label} className="between t-sm">
								<span className="row-f">
									<span style={brandTile(28, 8)}>
										<Icon className="ic ic-sm" />
									</span>
									{label}
								</span>
								<span style={{ width: w, height: 10, borderRadius: 999, background: "oklch(1 0 0 / 0.22)" }} />
							</div>
						))}
					</div>

					<p className="row-f hide-t" style={{ position: "relative", fontSize: 13, color: "oklch(1 0 0 / 0.75)" }}>
						<ShieldCheck className="ic ic-sm" aria-hidden="true" />
						Change or remove your PIN in Profile → Security.
					</p>
				</section>

				{/* ============ PIN pad ============ */}
				<section className="auth-form" aria-label="Enter your PIN">
					<div className="auth-card" style={{ alignItems: "center", textAlign: "center", gap: 20, maxWidth: 340 }}>
						{me && (
							<div className="stack-sm" style={{ alignItems: "center", gap: 10 }}>
								<span className="avatar avatar-lg" aria-hidden="true">
									{initial}
								</span>
								<div className="stack-sm" style={{ alignItems: "center", gap: 2 }}>
									{me.name && <strong style={{ fontSize: 16 }}>{me.name}</strong>}
									<span className="t-sm t-muted">{me.email}</span>
								</div>
							</div>
						)}

						<PinInput
							title="Enter your PIN"
							hint="4-digit PIN you set in Profile"
							busyText="Unlocking…"
							onComplete={handleComplete}
							error={error}
							resetSignal={resetSignal}
							disabled={checking}
						/>

						<div className="row-f" style={{ gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
							<button
								type="button"
								className="btn btn-ghost btn-sm"
								onClick={() => signOut({ callbackUrl: "/login" })}>
								Forgot PIN? Use password
							</button>
							<span className="t-muted" aria-hidden="true">
								·
							</span>
							<button
								type="button"
								className="btn btn-ghost btn-sm"
								style={{ color: "var(--danger)" }}
								onClick={() => signOut({ callbackUrl: "/login" })}>
								<LogOut className="ic ic-sm" aria-hidden="true" />
								Log out
							</button>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
