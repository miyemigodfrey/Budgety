"use client";

import "./landing.css";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	ArrowLeftRight,
	ArrowRight,
	Banknote,
	Bell,
	ChartColumn,
	Check,
	Eye,
	Globe,
	Layers,
	Lock,
	Moon,
	Plus,
	Scale,
	ShoppingCart,
	Smartphone,
	Sun,
	Wallet,
	type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { HeroRings, LogoMark, MockDashboard, MockPhoneDashboard, MockPinLock } from "./mockups";

const FEATURES: { icon: LucideIcon; tone: string; title: string; body: string }[] = [
	{ icon: Wallet, tone: "", title: "Every account, one balance", body: "Add bank accounts, mobile wallets and cash. Each balance stays current as you record money in and out." },
	{ icon: Layers, tone: "", title: "Spaces for each purpose", body: "Keep personal, business and savings apart, each with its own sources and transactions." },
	{ icon: ArrowLeftRight, tone: "in", title: "Inflow, outflow, transfer", body: "Log spending in seconds with categories and notes. Move money between sources without counting it twice." },
	{ icon: Scale, tone: "out", title: "Reconcile with reality", body: "Count the cash in your hand, enter it, and see the difference from what the app expects." },
	{ icon: ShoppingCart, tone: "neutral", title: "Plan the shop, then compare", body: "Build a list with planned prices, tick items off as you buy, and see if you stayed on budget." },
	{ icon: ChartColumn, tone: "neutral", title: "Reports you can export", body: "Weekly to yearly charts, spending by category, and monthly CSV or PDF exports for your records." },
];

const FAQS: [string, string][] = [
	["Does Budgety connect to my bank?", "No. You record transactions yourself, so Budgety never needs your bank login. It also means cash and mobile wallets count just as much as bank accounts."],
	["Can I keep business and personal money separate?", "Yes. Create a space for each purpose. Sources and transactions never cross between spaces, and the All view lets you see everything together without mixing it."],
	["Does it work on my phone?", "Yes. Budgety runs in any modern browser, and you can add it to your home screen to open it like an app, with an optional daily reminder."],
	["How is my account protected?", "Your password is stored as a secure hash, never in plain text. You can also turn on App Lock, which asks for your 4-digit PIN each time Budgety opens."],
	["Can I get my data out?", "Yes. Export any month’s transactions as a CSV file, or generate a PDF report."],
	["Which currency does it use?", "Budgety is built around the naira (₦). Amounts are stored to the kobo, so totals never drift from rounding."],
];

const PHOTOS = [
	{ src: "/landing/market.jpg", alt: "Two women exchanging fresh greens at an outdoor market", pos: "50% 45%", tag: "Market day", icon: ShoppingCart, text: "Plan the list, then log what you actually paid." },
	{ src: "/landing/counting-naira.jpg", alt: "Hands counting naira notes", pos: "50% 50%", tag: "Cash in hand", icon: Banknote, text: "Count your cash and reconcile in seconds." },
	{ src: "/landing/couple-budgeting.jpg", alt: "A couple going through household bills at a table", pos: "50% 40%", tag: "Bills at home", icon: Layers, text: "Give household money its own space." },
];

/**
 * Muted, looping background video. React doesn't reliably write the `muted`
 * attribute, and browsers only autoplay muted video, so set it on the element
 * and start playback here. Respects reduced motion: the poster shows instead.
 */
function LoopVideo({ className, src, poster }: { className: string; src: string; poster: string }) {
	const ref = useRef<HTMLVideoElement>(null);
	useEffect(() => {
		const v = ref.current;
		if (!v) return;
		v.muted = true;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		v.play().catch(() => {
			/* autoplay blocked — the poster frame stays */
		});
	}, []);
	return (
		<video
			ref={ref}
			className={className}
			src={src}
			poster={poster}
			muted
			loop
			playsInline
			preload="metadata"
			aria-hidden="true"
			tabIndex={-1}
		/>
	);
}

function Faq() {
	const [open, setOpen] = useState(0);
	const base = useId();
	return (
		<div className="lp-faq">
			{FAQS.map(([q, a], i) => {
				const isOpen = open === i;
				const panel = `${base}-a${i}`;
				return (
					<div key={q} className={`lp-q${isOpen ? " open" : ""}`}>
						<button
							className="lp-q-btn"
							type="button"
							aria-expanded={isOpen}
							aria-controls={panel}
							onClick={() => setOpen(isOpen ? -1 : i)}
						>
							{q}
							<Plus className="ic" aria-hidden="true" />
						</button>
						{isOpen && (
							<p className="lp-q-a" id={panel}>
								{a}
							</p>
						)}
					</div>
				);
			})}
		</div>
	);
}

export function LandingPage() {
	const { toggleTheme } = useTheme();

	return (
		<div className="lp">
			{/* Nav */}
			<header className="lp-nav">
				<div className="lp-wrap lp-nav-in">
					<a className="logo" href="#top" aria-label="Budgety home">
						<LogoMark />
						<span className="logo-word">Budgety</span>
					</a>
					<nav className="lp-links" aria-label="Page sections">
						<a href="#features">Features</a>
						<a href="#how">How it works</a>
						<a href="#faq">FAQ</a>
					</nav>
					<div className="lp-nav-cta">
						{/* The server can't know the stored theme, so both icons render and CSS
						    picks one from the .dark class the pre-paint script sets. */}
						<button className="btn btn-ghost btn-icon" type="button" aria-label="Toggle dark mode" onClick={toggleTheme}>
							<Moon className="ic lp-moon" />
							<Sun className="ic lp-sun" />
						</button>
						<Link className="btn btn-ghost lp-login" href="/login">
							Log in
						</Link>
						<Link className="btn btn-primary" href="/signup">
							Get started
						</Link>
					</div>
				</div>
			</header>

			<main>
				{/* Hero */}
				<section className="lp-hero" id="top">
					<div className="lp-hero-bg" aria-hidden="true">
						<div className="lp-hero-grid" />
					</div>
					<div className="lp-wrap" style={{ position: "relative" }}>
						<div className="lp-hero-text">
							<span className="lp-eyebrow">
								<b>NEW</b>Shopping planner: plan the list, then compare what you paid
							</span>
							<h1 className="lp-h1">
								Know where every <em>naira</em> went.
							</h1>
							<p className="lp-lead" style={{ maxWidth: 680 }}>
								Budgety keeps your bank accounts, mobile wallets and cash in one place, split into spaces for home,
								business and savings. The balance on your screen always matches the money in your hand.
							</p>
							<div className="lp-ctas">
								<Link className="btn btn-primary btn-lg" href="/signup">
									Create your account
									<ArrowRight className="ic ic-sm" />
								</Link>
								<Link className="btn btn-secondary btn-lg" href="/login">
									Log in
								</Link>
							</div>
							<div className="lp-ticks">
								<span>
									<Check className="ic ic-sm" />
									No bank login needed
								</span>
								<span>
									<Check className="ic ic-sm" />
									Phone and desktop
								</span>
								<span>
									<Check className="ic ic-sm" />
									Export to CSV and PDF
								</span>
							</div>
						</div>

						<div className="lp-stage">
							<div className="lp-browser" aria-hidden="true">
								<div className="lp-chrome">
									<i />
									<i />
									<i />
									<span className="lp-url">
										<Lock className="ic ic-xs" />
										budgety.app/dashboard
									</span>
								</div>
								<div className="lp-shot">
									<div className="lp-shot-in">
										<MockDashboard />
									</div>
								</div>
							</div>
							<div className="lp-phone" aria-hidden="true">
								<div className="lp-phone-screen">
									<div className="lp-phone-in">
										<MockPhoneDashboard />
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Facts */}
				<div className="lp-wrap">
					<div className="lp-facts">
						<div className="lp-fact">
							<span className="ic-tile"><Banknote className="ic" /></span>Built for the naira, to the kobo
						</div>
						<div className="lp-fact">
							<span className="ic-tile"><Wallet className="ic" /></span>Bank, wallet and cash together
						</div>
						<div className="lp-fact">
							<span className="ic-tile"><Smartphone className="ic" /></span>Installs on your phone
						</div>
						<div className="lp-fact">
							<span className="ic-tile"><Lock className="ic" /></span>PIN lock built in
						</div>
					</div>
				</div>

				{/* Real life */}
				<section className="lp-sec lp-sec-tight">
					<div className="lp-wrap">
						<div className="lp-head">
							<p className="t-over">Made for how you spend</p>
							<h2 className="lp-h2">Market runs, cash in hand, bills at home</h2>
							<p className="lp-lead">
								Money moves in lots of small ways in a week. Budgety keeps up with all of them, not just the ones your
								bank sees.
							</p>
						</div>
						<div className="g g-stretch">
							{PHOTOS.map(({ src, alt, pos, tag, icon: Icon, text }) => (
								<figure key={src} className="lp-photo" style={{ ["--d" as string]: 4, ["--t" as string]: 4, ["--m" as string]: 12 }}>
									<Image src={src} alt={alt} fill sizes="(max-width: 639px) 100vw, (max-width: 1199px) 33vw, 380px" style={{ objectPosition: pos }} />
									<figcaption>
										<span className="lp-photo-tag">
											<Icon className="ic ic-xs" />
											{tag}
										</span>
										{text}
									</figcaption>
								</figure>
							))}
						</div>
					</div>
				</section>

				{/* Features */}
				<section className="lp-sec" id="features">
					<div className="lp-wrap">
						<div className="lp-head">
							<p className="t-over">Features</p>
							<h2 className="lp-h2">Everything your money touches, in one calm place</h2>
							<p className="lp-lead">No spreadsheets, no guessing. Record money as it moves and Budgety does the arithmetic.</p>
						</div>
						<div className="g g-stretch">
							{FEATURES.map(({ icon: Icon, tone, title, body }) => (
								<article key={title} className="lp-feat" style={{ ["--d" as string]: 4, ["--t" as string]: 6, ["--m" as string]: 12 }}>
									<span className={`ic-tile ${tone}`}>
										<Icon className="ic ic-lg" />
									</span>
									<h3 className="lp-h3">{title}</h3>
									<p className="lp-p">{body}</p>
								</article>
							))}
						</div>
					</div>
				</section>

				{/* Spotlights */}
				<section className="lp-sec lp-sec-alt">
					<div className="lp-wrap">
						<div className="lp-spot">
							<div className="lp-spot-text">
								<p className="t-over">Spaces</p>
								<h2 className="lp-h2">Keep home, business and savings apart</h2>
								<p className="lp-lead">
									Each space has its own sources and transactions, so business money never blurs into the grocery
									budget. When you want the full picture, the All view shows every space at once, read-only.
								</p>
								<ul className="lp-bullets">
									<li><Check className="ic" />Switch spaces from anywhere in the app</li>
									<li><Check className="ic" />Totals and reports follow the space you’re in</li>
									<li><Check className="ic" />Nothing you add leaks into another space</li>
								</ul>
							</div>
							<div className="lp-visual lp-visual-tint" aria-hidden="true">
								<div className="g" style={{ gap: 14 }}>
									<div className="card stack-sm" style={{ ["--d" as string]: 6, ["--m" as string]: 12, gap: 12, borderColor: "var(--brand)", boxShadow: "0 0 0 4px var(--brand-soft)" }}>
										<div className="between">
											<span className="row-f"><span className="space-dot">P</span><span className="t-h3">Personal</span></span>
											<span className="badge brand"><Check className="ic ic-xs" />Open</span>
										</div>
										<span className="amt amt-lg">₦1,284,500</span>
										<span className="t-xs t-muted">4 sources · default</span>
									</div>
									<div className="card stack-sm" style={{ ["--d" as string]: 6, ["--m" as string]: 12, gap: 12 }}>
										<span className="row-f">
											<span className="space-dot" style={{ background: "var(--success-soft)", color: "var(--success)" }}>B</span>
											<span className="t-h3">Business</span>
										</span>
										<span className="amt amt-lg">₦2,410,000</span>
										<span className="t-xs t-muted">2 sources</span>
									</div>
									<div className="card stack-sm" style={{ ["--d" as string]: 6, ["--m" as string]: 12, gap: 12 }}>
										<span className="row-f">
											<span className="space-dot" style={{ background: "var(--sunken)", color: "var(--fg-2)" }}>S</span>
											<span className="t-h3">Savings</span>
										</span>
										<span className="amt amt-lg">₦850,000</span>
										<span className="t-xs t-muted">1 source</span>
									</div>
									<div className="card stack-sm" style={{ ["--d" as string]: 6, ["--m" as string]: 12, gap: 12, borderStyle: "dashed", boxShadow: "none", background: "transparent" }}>
										<span className="row-f">
											<span className="space-dot" style={{ background: "transparent", border: "1.5px dashed var(--brand-line)" }}>
												<Eye className="ic ic-sm" />
											</span>
											<span className="t-h3">All spaces</span>
										</span>
										<span className="amt amt-lg">₦4,544,500</span>
										<span className="t-xs t-muted">View only overview</span>
									</div>
								</div>
							</div>
						</div>

						<div className="lp-spot rev">
							<div className="lp-spot-text">
								<p className="t-over">Reconcile</p>
								<h2 className="lp-h2">Count it once. See the difference at once.</h2>
								<p className="lp-lead">
									Small cash spends slip through the cracks. Count what’s actually in your wallet, type it in, and
									Budgety shows exactly how far off the app is, so you can fix it with one adjusting entry.
								</p>
								<ul className="lp-bullets">
									<li><Check className="ic" />Works for any source, bank or cash</li>
									<li><Check className="ic" />See when each source was last checked</li>
								</ul>
							</div>
							<div className="lp-visual" aria-hidden="true">
								<div className="card stack" style={{ maxWidth: 440, margin: "0 auto" }}>
									<div className="between">
										<span className="card-t">Reconcile · Cash</span>
										<span className="t-xs t-muted">Today</span>
									</div>
									<div className="g" style={{ gap: 12 }}>
										{[
											["App balance", "₦57,500.00", "tr"],
											["You counted", "₦51,200.00", ""],
										].map(([label, amount, cls]) => (
											<div key={label} className="stack-sm" style={{ ["--d" as string]: 6, ["--t" as string]: 6, ["--m" as string]: 6, gap: 4, padding: 14, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
												<span className="t-xs t-muted">{label}</span>
												<span className={`amt amt-md ${cls}`}>{amount}</span>
											</div>
										))}
									</div>
									<div className="stack-sm" style={{ gap: 4, padding: 16, borderRadius: 12, background: "var(--danger-soft)" }}>
										<span className="t-xs out t-strong">Difference</span>
										<span className="amt amt-lg out">−₦6,300.00</span>
										<span className="t-sm out">You have less cash than the app expects.</span>
									</div>
									<span className="btn btn-primary btn-block">Record adjusting outflow</span>
								</div>
							</div>
						</div>

						<div className="lp-spot">
							<div className="lp-spot-text">
								<p className="t-over">On your phone</p>
								<h2 className="lp-h2">Your budget, on your home screen</h2>
								<p className="lp-lead">
									Add Budgety to your home screen and it opens like any other app. A gentle daily reminder nudges you
									to log the day’s spending, and a 4-digit PIN keeps it private if someone picks up your phone.
								</p>
								<ul className="lp-bullets">
									<li><Smartphone className="ic" />Install from the browser, no app store needed</li>
									<li><Bell className="ic" />Optional daily reminder notification</li>
									<li><Lock className="ic" />App Lock with your own PIN</li>
								</ul>
							</div>
							<div className="lp-visual lp-visual-photo" aria-hidden="true">
								<div className="lp-visual-bg">
									<Image src="/landing/woman-phone-abuja.jpg" alt="" fill sizes="(max-width: 1023px) 100vw, 400px" />
								</div>
								<div className="lp-phone">
									<div className="lp-phone-screen">
										<div className="lp-phone-in">
											<MockPinLock />
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="lp-spot rev">
							<div className="lp-spot-text">
								<p className="t-over">Shopping planner</p>
								<h2 className="lp-h2">Plan the shop. Spend what you planned.</h2>
								<p className="lp-lead">
									Write the list before you go, with quantities and expected prices. Tick items off as you buy them
									and Budgety shows whether you’re over or under, item by item.
								</p>
								<ul className="lp-bullets">
									<li><Check className="ic" />Planned vs paid for every item</li>
									<li><Check className="ic" />Record the whole trip as one outflow</li>
								</ul>
							</div>
							<div className="lp-video" aria-hidden="true">
								<LoopVideo className="lp-video-el" src="/landing/grocery-shopping.mp4" poster="/landing/grocery-shopping-poster.jpg" />
								<div className="lp-float card stack" style={{ gap: 12 }}>
									<div className="row-f">
										<span className="ic-tile"><ShoppingCart className="ic" /></span>
										<div>
											<p className="card-t">Groceries · November</p>
											<p className="card-s">6 of 9 items bought</p>
										</div>
									</div>
									<div className="progress"><span style={{ width: "67%" }} /></div>
									<div className="between t-sm">
										<span className="t-muted">
											Spent <strong className="amt" style={{ color: "var(--fg)" }}>₦31,200</strong> of ₦45,000
										</span>
										<span className="badge in">₦1,850 under</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* How it works */}
				<section className="lp-sec" id="how">
					<div className="lp-wrap">
						<div className="lp-head">
							<p className="t-over">How it works</p>
							<h2 className="lp-h2">Three steps to a budget you trust</h2>
						</div>
						<div className="g g-stretch">
							{[
								["Add your sources", "Name each bank account, wallet or cash pile and enter what’s in it today. That’s your starting point."],
								["Record as you go", "Log inflows, outflows and transfers with a category and a note, from your phone or your laptop."],
								["See where it went", "Charts, category breakdowns and reconciliation show what changed, where, and why."],
							].map(([title, body], i) => (
								<article key={title} className="lp-step" style={{ ["--d" as string]: 4, ["--t" as string]: 12 }}>
									<span className="lp-step-n">{i + 1}</span>
									<h3 className="lp-h3">{title}</h3>
									<p className="lp-p">{body}</p>
								</article>
							))}
						</div>
					</div>
				</section>

				{/* FAQ */}
				<section className="lp-sec lp-sec-alt" id="faq">
					<div className="lp-wrap">
						<div className="lp-head">
							<p className="t-over">FAQ</p>
							<h2 className="lp-h2">Questions, answered</h2>
						</div>
						<Faq />
					</div>
				</section>

				{/* CTA */}
				<section className="lp-sec">
					<div className="lp-wrap">
						<div className="lp-cta">
							<LoopVideo className="lp-bgvid" src="/landing/lagos-aerial.mp4" poster="/landing/lagos-aerial-poster.jpg" />
							<div className="lp-cta-tint" aria-hidden="true" />
							<HeroRings />
							<HeroRings className="hero-rings l" rings={2} />
							<h2 className="lp-h2">
								Start with one source.
								<br />
								See the whole picture.
							</h2>
							<p>Add your first account and record today’s spending. That’s all it takes to begin.</p>
							<div className="lp-ctas">
								<Link className="btn btn-lg btn-white" href="/signup">
									Create your account
									<ArrowRight className="ic ic-sm" />
								</Link>
								<Link className="btn btn-lg btn-on-brand" href="/login">
									I already have one
								</Link>
							</div>
						</div>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="lp-foot">
				<div className="lp-wrap">
					<div className="lp-foot-in">
						<div className="lp-foot-col lp-foot-brand" style={{ gap: 14 }}>
							<span className="logo">
								<LogoMark id="ft" />
								<span className="logo-word">Budgety</span>
							</span>
							<span style={{ maxWidth: 280 }}>Track your money across purpose-based spaces.</span>
						</div>
						<div className="lp-foot-col">
							<strong>Product</strong>
							<a href="#features">Features</a>
							<a href="#how">How it works</a>
							<a href="#faq">FAQ</a>
						</div>
						<div className="lp-foot-col">
							<strong>Account</strong>
							<Link href="/login">Log in</Link>
							<Link href="/signup">Create account</Link>
						</div>
						<div className="lp-foot-col">
							<strong>Install</strong>
							<span>Open Budgety in your phone’s browser, then choose “Add to Home Screen”.</span>
						</div>
					</div>
					<div className="lp-legal">
						<span>© {new Date().getFullYear()} Budgety</span>
						<span className="row-f" style={{ gap: 6 }}>
							<Globe className="ic ic-sm" />
							Made for Nigeria · ₦ NGN
						</span>
					</div>
				</div>
			</footer>
		</div>
	);
}
