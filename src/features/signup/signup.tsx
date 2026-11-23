"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";
import {
	Check,
	ChartColumn,
	Eye,
	EyeOff,
	Info,
	Layers,
	Lock,
	Mail,
	ShieldCheck,
	User,
	Wallet,
} from "lucide-react";
import { trpc } from "@/api/client";
import { getErrorMessage } from "@/lib/apiError";
import { AuthLogo, AuthRings, AuthThemeToggle, brandTile } from "@/features/login/AuthChrome";

const FEATURES = [
	{ Icon: Wallet, title: "Sources with live balances", body: "Bank accounts, wallets and cash in one view" },
	{ Icon: Layers, title: "Spaces that never mix", body: "Keep money separate by purpose" },
	{ Icon: ChartColumn, title: "Reports, reconcile and shopping plans", body: "Export CSV or PDF any month" },
];

export default function SignupPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPw, setShowPw] = useState(false);
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();

	// Live match feedback once the user has started confirming.
	const mismatch = confirmPassword.length > 0 && confirmPassword !== password;
	const matches = confirmPassword.length > 0 && confirmPassword === password;
	const confirmMsg = mismatch ? "Passwords do not match." : passwordError;

	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault();
		setPasswordError(null);

		if (!name.trim() || !email.trim() || !password) {
			toast.error("Please fill in all fields.");
			return;
		}

		if (password !== confirmPassword) {
			setPasswordError("Passwords do not match.");
			return;
		}

		try {
			setIsSubmitting(true);
			// Register creates the account; then sign in to establish the session.
			await trpc.auth.register.mutate({ name, email, password });
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});
			if (result?.error) {
				toast.success("Account created. Please log in.");
				router.replace("/login");
				return;
			}
			router.replace("/dashboard");
			router.refresh();
		} catch (error) {
			console.error("Failed to signup:", error);
			toast.error(getErrorMessage(error, "Sign up failed. Please try again."));
		} finally {
			setIsSubmitting(false);
		}
	};

	const confirmStyle: React.CSSProperties = confirmMsg
		? { borderColor: "var(--danger)", boxShadow: "0 0 0 4px var(--danger-soft)" }
		: matches
			? { borderColor: "var(--success)" }
			: {};

	return (
		<div className="app">
			<div className="auth">
				{/* ============ Brand panel ============ */}
				<section className="auth-brand" aria-label="About Budgety">
					<Image
						className="auth-photo"
						src="/landing/couple-budgeting.jpg"
						alt=""
						fill
						priority
						sizes="(max-width: 1023px) 100vw, 52vw"
						style={{ objectPosition: "50% 40%" }}
					/>
					<div className="auth-tint" aria-hidden="true" />
					<AuthRings />

					<div className="between" style={{ position: "relative" }}>
						<AuthLogo href="/" />
						<AuthThemeToggle />
					</div>

					<div className="stack" style={{ position: "relative", gap: 16, maxWidth: 520 }}>
						<span className="t-over hide-m" style={{ color: "oklch(1 0 0 / 0.75)" }}>
							Free to start
						</span>
						<h1 className="t-display" style={{ fontVariantNumeric: "normal" }}>
							Every source. One clear balance.
						</h1>
						<p className="hide-m" style={{ fontSize: 16, color: "oklch(1 0 0 / 0.82)", maxWidth: 460 }}>
							Your first space, Personal, is ready the moment you sign up. Add Business or
							Savings whenever you need them.
						</p>
					</div>

					<ul
						className="hide-t"
						style={{ position: "relative", maxWidth: 440, display: "flex", flexDirection: "column", gap: 10 }}>
						{FEATURES.map(({ Icon, title, body }) => (
							<li
								key={title}
								className="row-f"
								style={{
									gap: 14,
									background: "oklch(1 0 0 / 0.1)",
									border: "1px solid oklch(1 0 0 / 0.18)",
									borderRadius: 16,
									padding: "14px 16px",
								}}>
								<span style={brandTile(36, 10)}>
									<Icon className="ic" aria-hidden="true" />
								</span>
								<span className="stack-sm" style={{ gap: 2 }}>
									<strong style={{ fontSize: 14 }}>{title}</strong>
									<span style={{ fontSize: 13, color: "oklch(1 0 0 / 0.78)" }}>{body}</span>
								</span>
							</li>
						))}
					</ul>

					<p className="row-f hide-t" style={{ position: "relative", fontSize: 13, color: "oklch(1 0 0 / 0.75)" }}>
						<ShieldCheck className="ic ic-sm" aria-hidden="true" />
						Add a 4-digit App Lock PIN after you sign up.
					</p>
				</section>

				{/* ============ Form ============ */}
				<section className="auth-form" aria-label="Create an account">
					<form className="auth-card" onSubmit={handleSignup}>
						<div className="stack-sm" style={{ gap: 6 }}>
							<h2 className="t-h1">Create your account</h2>
							<p className="t-muted">Start tracking in under a minute.</p>
						</div>

						<div className="stack" style={{ gap: 16 }}>
							<div className="field">
								<label className="label" htmlFor="su-name">
									Username
								</label>
								<div className="control">
									<User className="ic" aria-hidden="true" />
									<input
										id="su-name"
										className="input has-ic"
										type="text"
										autoComplete="name"
										placeholder="What should we call you?"
										value={name}
										onChange={(e) => setName(e.target.value)}
									/>
								</div>
							</div>
							<div className="field">
								<label className="label" htmlFor="su-email">
									Email
								</label>
								<div className="control">
									<Mail className="ic" aria-hidden="true" />
									<input
										id="su-email"
										className="input has-ic"
										type="email"
										autoComplete="email"
										placeholder="you@example.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
									/>
								</div>
							</div>
							<div className="field">
								<label className="label" htmlFor="su-password">
									Password
								</label>
								<div className="control">
									<Lock className="ic" aria-hidden="true" />
									<input
										id="su-password"
										className="input has-ic has-end"
										type={showPw ? "text" : "password"}
										autoComplete="new-password"
										placeholder="Set a password"
										value={password}
										onChange={(e) => {
											setPassword(e.target.value);
											setPasswordError(null);
										}}
									/>
									<button
										className="btn btn-ghost btn-icon btn-sm"
										type="button"
										aria-label={showPw ? "Hide passwords" : "Show passwords"}
										aria-pressed={showPw}
										onClick={() => setShowPw((v) => !v)}
										style={{ position: "absolute", right: 6 }}>
										{showPw ? <EyeOff className="ic ic-sm" /> : <Eye className="ic ic-sm" />}
									</button>
								</div>
							</div>
							<div className="field">
								<label className="label" htmlFor="su-confirm">
									Confirm password
								</label>
								<div className="control">
									<Lock className="ic" aria-hidden="true" />
									<input
										id="su-confirm"
										className="input has-ic has-end"
										type={showPw ? "text" : "password"}
										autoComplete="new-password"
										placeholder="Type it again"
										value={confirmPassword}
										onChange={(e) => {
											setConfirmPassword(e.target.value);
											setPasswordError(null);
										}}
										aria-invalid={!!confirmMsg}
										aria-describedby={confirmMsg || matches ? "su-confirm-msg" : undefined}
										style={confirmStyle}
									/>
									{confirmMsg ? (
										<Info className="ic ic-end" style={{ color: "var(--danger)" }} aria-hidden="true" />
									) : matches ? (
										<Check className="ic ic-end" style={{ color: "var(--success)" }} aria-hidden="true" />
									) : null}
								</div>
								{confirmMsg ? (
									<p
										id="su-confirm-msg"
										role="alert"
										className="row-f t-xs"
										style={{ gap: 6, color: "var(--danger)", fontWeight: 600 }}>
										<Info className="ic ic-xs" aria-hidden="true" />
										{confirmMsg}
									</p>
								) : matches ? (
									<p
										id="su-confirm-msg"
										className="row-f t-xs"
										style={{ gap: 6, color: "var(--success)", fontWeight: 600 }}>
										<Check className="ic ic-xs" aria-hidden="true" />
										Passwords match.
									</p>
								) : null}
							</div>
						</div>

						<button
							className="btn btn-primary btn-lg btn-block"
							type="submit"
							disabled={isSubmitting || mismatch}>
							{isSubmitting ? "Creating account…" : "Create account"}
						</button>

						<div className="divider-t">Already have an account?</div>
						<Link className="btn btn-secondary btn-lg btn-block" href="/login">
							Log in
						</Link>
					</form>
				</section>
			</div>
		</div>
	);
}
