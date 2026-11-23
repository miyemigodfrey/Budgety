"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";
import {
	Banknote,
	Eye,
	EyeOff,
	Landmark,
	Lock,
	Mail,
	ShieldCheck,
	Smartphone,
	TrendingUp,
} from "lucide-react";
import { AuthLogo, AuthRings, AuthThemeToggle, brandTile } from "./AuthChrome";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPw, setShowPw] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();

	const from = searchParams.get("from") || "/dashboard";

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!email.trim() || !password) {
			toast.error("Please enter your email and password.");
			return;
		}

		try {
			setIsSubmitting(true);
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});
			if (result?.error) {
				toast.error("Login failed. Check your email and password.");
				return;
			}
			router.replace(from);
			router.refresh();
		} catch (error) {
			console.error("Login failed:", error);
			toast.error("Login failed. Check your email and password.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="app">
			<div className="auth">
				{/* ============ Brand panel ============ */}
				<section className="auth-brand" aria-label="About Budgety">
					<Image
						className="auth-photo"
						src="/auth/login-woman-phone.jpg"
						alt=""
						fill
						priority
						sizes="(max-width: 1023px) 100vw, 52vw"
						style={{ objectPosition: "50% 30%" }}
					/>
					<div className="auth-tint" aria-hidden="true" />
					<AuthRings />

					<div className="between" style={{ position: "relative" }}>
						<AuthLogo href="/" />
						<AuthThemeToggle />
					</div>

					<div className="stack" style={{ position: "relative", gap: 16, maxWidth: 520 }}>
						<span className="t-over hide-m" style={{ color: "oklch(1 0 0 / 0.75)" }}>
							Personal finance, made calm
						</span>
						<h1 className="t-display" style={{ fontVariantNumeric: "normal" }}>
							Know where every naira is.
						</h1>
						<p className="hide-m" style={{ fontSize: 16, color: "oklch(1 0 0 / 0.82)", maxWidth: 460 }}>
							Track balances across your bank accounts, wallets and cash — and keep
							Personal, Business and Savings money in separate spaces.
						</p>
					</div>

					{/* Illustrative preview of the dashboard balance card (not user data). */}
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
								Total balance · Personal
							</span>
							<span className="hero-pill">
								<TrendingUp className="ic ic-xs" />
								+₦305,700
							</span>
						</div>
						<span
							style={{
								fontSize: 32,
								fontWeight: 750,
								letterSpacing: "-0.03em",
								fontVariantNumeric: "tabular-nums",
								lineHeight: 1.1,
							}}>
							₦1,284,500.00
						</span>
						<div style={{ height: 1, background: "oklch(1 0 0 / 0.16)" }} />
						{[
							{ Icon: Landmark, name: "Access Bank", amt: "₦742,300.00" },
							{ Icon: Smartphone, name: "Opay", amt: "₦286,700.00" },
							{ Icon: Banknote, name: "Cash", amt: "₦57,500.00" },
						].map(({ Icon, name, amt }) => (
							<div key={name} className="between t-sm">
								<span className="row-f">
									<span style={brandTile(28, 8)}>
										<Icon className="ic ic-sm" />
									</span>
									{name}
								</span>
								<span className="amt">{amt}</span>
							</div>
						))}
						<div className="row-f wrap" style={{ gap: 6, paddingTop: 4 }}>
							<span className="hero-pill" style={{ background: "#ffffff", color: "oklch(48.8% 0.243 264.376)" }}>
								Personal
							</span>
							<span className="hero-pill">Business</span>
							<span className="hero-pill">Savings</span>
						</div>
					</div>

					<p className="row-f hide-t" style={{ position: "relative", fontSize: 13, color: "oklch(1 0 0 / 0.75)" }}>
						<ShieldCheck className="ic ic-sm" aria-hidden="true" />
						Balances update the moment you record a transaction.
					</p>
				</section>

				{/* ============ Form ============ */}
				<section className="auth-form" aria-label="Log in">
					<form className="auth-card" onSubmit={handleLogin}>
						<div className="stack-sm" style={{ gap: 6 }}>
							<h2 className="t-h1">Welcome back</h2>
							<p className="t-muted">Log in to see where your money stands.</p>
						</div>

						<div className="stack" style={{ gap: 16 }}>
							<div className="field">
								<label className="label" htmlFor="login-email">
									Email
								</label>
								<div className="control">
									<Mail className="ic" aria-hidden="true" />
									<input
										id="login-email"
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
								<label className="label" htmlFor="login-password">
									Password
								</label>
								<div className="control">
									<Lock className="ic" aria-hidden="true" />
									<input
										id="login-password"
										className="input has-ic has-end"
										type={showPw ? "text" : "password"}
										autoComplete="current-password"
										placeholder="Enter your password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
									/>
									<button
										className="btn btn-ghost btn-icon btn-sm"
										type="button"
										aria-label={showPw ? "Hide password" : "Show password"}
										aria-pressed={showPw}
										onClick={() => setShowPw((v) => !v)}
										style={{ position: "absolute", right: 6 }}>
										{showPw ? <EyeOff className="ic ic-sm" /> : <Eye className="ic ic-sm" />}
									</button>
								</div>
							</div>
						</div>

						<button className="btn btn-primary btn-lg btn-block" type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Logging in…" : "Log in"}
						</button>

						<div className="divider-t">New to Budgety?</div>
						<Link className="btn btn-secondary btn-lg btn-block" href="/signup">
							Create an account
						</Link>
					</form>
				</section>
			</div>
		</div>
	);
}
