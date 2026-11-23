/**
 * Static, theme-aware mock screens for the landing page. They are drawn at
 * real device size (1440×860 desktop, 390×822 phone) and scaled down by CSS,
 * so they stay crisp and follow light/dark mode without screenshots.
 * All numbers are sample data matching the redesign canvas.
 */
import {
	ArrowDownLeft,
	ArrowLeftRight,
	ArrowUpRight,
	ChartColumn,
	ChevronDown,
	House,
	Landmark,
	LayoutDashboard,
	Lock,
	Search,
	Settings,
	Smartphone,
	Wallet,
} from "lucide-react";

export function LogoMark({ id = "lp" }: { id?: string }) {
	return (
		<svg className="logo-mark" viewBox="0 0 40 40" aria-hidden="true">
			<defs>
				<linearGradient id={`lg-${id}`} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#3b82f6" />
					<stop offset="1" stopColor="#1d4ed8" />
				</linearGradient>
			</defs>
			<rect width="40" height="40" rx="11" fill={`url(#lg-${id})`} />
			<circle cx="20" cy="13.5" r="5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.6" />
			<rect x="9.5" y="16" width="21" height="14.5" rx="4" fill="#ffffff" />
			<rect x="22" y="20.6" width="10" height="5.6" rx="2.8" fill="#dbeafe" />
			<circle cx="25" cy="23.4" r="1.5" fill="#ffffff" />
		</svg>
	);
}

export function HeroRings({ className = "hero-rings", rings = 3 }: { className?: string; rings?: number }) {
	const radii = [148, 110, 72].slice(0, rings);
	return (
		<svg className={className} viewBox="0 0 300 300" aria-hidden="true">
			{radii.map((r) => (
				<circle key={r} cx="150" cy="150" r={r} fill="none" stroke="#ffffff" strokeWidth="1.5" />
			))}
		</svg>
	);
}

const SOURCES = [
	{ name: "Access Bank", color: "var(--c1)", balance: "₦742,300.00", icon: Landmark },
	{ name: "Opay", color: "var(--c2)", balance: "₦286,700.00", icon: Smartphone },
	{ name: "Kuda", color: "var(--c3)", balance: "₦198,000.00", icon: Smartphone },
	{ name: "Cash", color: "var(--c4)", balance: "₦57,500.00", icon: Wallet },
];

const CATEGORIES = [
	{ name: "Groceries", amount: "₦68,400", pct: 32, color: "var(--c1)" },
	{ name: "Transport", amount: "₦42,000", pct: 20, color: "var(--c2)" },
	{ name: "Utilities", amount: "₦38,000", pct: 18, color: "var(--c3)" },
	{ name: "Data & airtime", amount: "₦21,500", pct: 10, color: "var(--c4)" },
	{ name: "Other", amount: "₦44,400", pct: 21, color: "var(--c5)" },
];

type Tx = { kind: "in" | "out" | "tr"; title: string; meta: string; amount: string };
const TXS: Tx[] = [
	{ kind: "in", title: "Salary", meta: "Access Bank · Today", amount: "+₦450,000.00" },
	{ kind: "out", title: "Groceries", meta: "Opay · 21 Nov", amount: "−₦18,450.00" },
	{ kind: "tr", title: "Access Bank → Cash", meta: "Transfer · 20 Nov", amount: "₦20,000.00" },
	{ kind: "out", title: "Transport", meta: "Cash · 20 Nov", amount: "−₦3,800.00" },
	{ kind: "out", title: "Data & airtime", meta: "Opay · 19 Nov", amount: "−₦5,000.00" },
	{ kind: "in", title: "Freelance", meta: "Kuda · 18 Nov", amount: "+₦70,000.00" },
];

function TxIcon({ kind }: { kind: Tx["kind"] }) {
	const Icon = kind === "in" ? ArrowDownLeft : kind === "out" ? ArrowUpRight : ArrowLeftRight;
	return (
		<span className={`ic-tile ${kind === "tr" ? "" : kind}`}>
			<Icon className="ic ic-sm" />
		</span>
	);
}

function BalanceHero({ compact = false }: { compact?: boolean }) {
	return (
		<div className="mk-hero">
			<HeroRings />
			<span className="t-over">Total balance · Personal</span>
			<span className="mk-hero-amt">₦1,284,500</span>
			{!compact && <span style={{ opacity: 0.8 }}>Across 4 sources · updated today</span>}
			<div className="mk-hero-row">
				<span>
					In this month<b>₦520,000</b>
				</span>
				<span>
					Out this month<b>₦214,300</b>
				</span>
			</div>
		</div>
	);
}

/** Desktop dashboard, 1440×860. */
export function MockDashboard() {
	const nav = [
		{ label: "Dashboard", icon: LayoutDashboard, on: true },
		{ label: "Sources", icon: Wallet },
		{ label: "Transactions", icon: ArrowLeftRight },
		{ label: "Reports", icon: ChartColumn },
		{ label: "Settings", icon: Settings },
	];
	return (
		<div className="mk">
			<aside className="mk-side">
				<span className="logo">
					<LogoMark id="mk" />
					<span className="logo-word">Budgety</span>
				</span>
				<div className="mk-nav">
					{nav.map(({ label, icon: Icon, on }) => (
						<span key={label} className={on ? "on" : undefined}>
							<Icon className="ic" />
							{label}
						</span>
					))}
				</div>
			</aside>
			<div className="mk-main">
				<div className="mk-top">
					<span className="mk-space">
						<span className="space-dot">P</span>Personal
						<ChevronDown className="ic ic-sm" />
					</span>
					<span className="row-f t-muted">
						<Search className="ic" />
						<span className="space-dot" style={{ borderRadius: 999 }}>
							AO
						</span>
					</span>
				</div>
				<div className="mk-body">
					<div className="stack" style={{ gap: 20 }}>
						<BalanceHero />
						<div className="card">
							<div className="between" style={{ marginBottom: 14 }}>
								<span className="card-t">Spending by category</span>
								<span className="t-xs t-muted">November · ₦214,300</span>
							</div>
							<div className="mk-bars">
								{CATEGORIES.map((c) => (
									<div key={c.name} className="mk-bar">
										<span>{c.name}</span>
										<div className="progress" style={{ ["--c" as string]: c.color }}>
											<span style={{ width: `${c.pct * 3}%` }} />
										</div>
										<span className="amt" style={{ textAlign: "right" }}>
											{c.amount}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>
					<div className="stack" style={{ gap: 20 }}>
						<div className="card" style={{ paddingTop: 14, paddingBottom: 8 }}>
							<span className="card-t">Sources</span>
							<div style={{ marginTop: 6 }}>
								{SOURCES.map((s) => (
									<div key={s.name} className="mk-src">
										<i className="mk-dot" style={{ background: s.color }} />
										<span className="mk-grow">{s.name}</span>
										<span className="amt">{s.balance}</span>
									</div>
								))}
							</div>
						</div>
						<div className="card" style={{ paddingTop: 14, paddingBottom: 8 }}>
							<span className="card-t">Recent transactions</span>
							<div style={{ marginTop: 6 }}>
								{TXS.slice(0, 4).map((t) => (
									<div key={t.title + t.meta} className="mk-tx">
										<TxIcon kind={t.kind} />
										<div className="mk-grow">
											<div className="t-strong">{t.title}</div>
											<div className="t-xs t-muted">{t.meta}</div>
										</div>
										<span className={`amt ${t.kind}`}>{t.amount}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

/** Phone dashboard, 390×822. */
export function MockPhoneDashboard() {
	const tabs = [
		{ label: "Home", icon: House, on: true },
		{ label: "Sources", icon: Wallet },
		{ label: "Reports", icon: ChartColumn },
		{ label: "Settings", icon: Settings },
	];
	return (
		<div className="mk mk-phone">
			<div className="mk-phone-top">
				<span className="logo">
					<LogoMark id="mkp" />
					<span className="logo-word">Budgety</span>
				</span>
				<span className="space-dot">P</span>
			</div>
			<div className="mk-phone-body">
				<BalanceHero compact />
				<div className="card" style={{ padding: 16 }}>
					<span className="card-t">Recent transactions</span>
					<div style={{ marginTop: 4 }}>
						{TXS.map((t) => (
							<div key={t.title + t.meta} className="mk-tx">
								<TxIcon kind={t.kind} />
								<div className="mk-grow">
									<div className="t-strong">{t.title}</div>
									<div className="t-xs t-muted">{t.meta}</div>
								</div>
								<span className={`amt t-sm ${t.kind}`}>{t.amount}</span>
							</div>
						))}
					</div>
				</div>
			</div>
			<div className="mk-tabs">
				{tabs.map(({ label, icon: Icon, on }) => (
					<span key={label} className={on ? "on" : undefined}>
						<Icon className="ic" />
						{label}
					</span>
				))}
			</div>
		</div>
	);
}

/** App Lock PIN screen, 390×822. */
export function MockPinLock() {
	const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""];
	return (
		<div className="mk mk-lock">
			<span className="ic-tile" style={{ width: 64, height: 64, borderRadius: 18 }}>
				<Lock className="ic ic-lg" />
			</span>
			<div className="stack-sm" style={{ alignItems: "center", gap: 6 }}>
				<span style={{ fontSize: 24, fontWeight: 750, letterSpacing: "-0.02em" }}>Enter your PIN</span>
				<span className="t-muted">Budgety is locked</span>
			</div>
			<div className="mk-pin-dots">
				<i className="on" />
				<i className="on" />
				<i />
				<i />
			</div>
			<div className="mk-keypad">
				{keys.map((k, i) => (
					<span key={i} className={k ? undefined : "blank"}>
						{k}
					</span>
				))}
			</div>
		</div>
	);
}
