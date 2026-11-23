import { formatCurrency } from "@/lib/formatCurrency";
import { toMajor } from "@/lib/money";

/** U+2212, the typographic minus the canvas uses for outflow amounts. */
export const MINUS = "−";

/** "₦1,284,500.00" from BigInt minor units. */
export const money = (minor: bigint | number | null | undefined) =>
	formatCurrency(minor);

/** "₦520,000" — drops a ".00" tail, keeps real kobo. */
export const moneyWhole = (minor: bigint | number | null | undefined) =>
	formatCurrency(minor).replace(/\.00$/, "");

const abs = (v: bigint) => (v < 0n ? -v : v);

/** "+₦305,700" / "−₦12,000" / "₦0" for a signed minor-unit amount. */
export function signedMoney(minor: bigint, whole = false) {
	const fmt = whole ? moneyWhole : money;
	if (minor > 0n) return `+${fmt(minor)}`;
	if (minor < 0n) return `${MINUS}${fmt(abs(minor))}`;
	return fmt(0n);
}

/** Short axis / summary label from MAJOR units: ₦600, ₦45k, ₦1.3M. */
export function compactNaira(major: number) {
	const a = Math.abs(major);
	const sign = major < 0 ? MINUS : "";
	const trim = (n: number) => n.toFixed(1).replace(/\.0$/, "");
	if (a >= 1e9) return `${sign}₦${trim(a / 1e9)}B`;
	if (a >= 1e6) return `${sign}₦${trim(a / 1e6)}M`;
	if (a >= 1e3) return `${sign}₦${trim(a / 1e3)}k`;
	return `${sign}₦${Math.round(a)}`;
}

export const compactMinor = (minor: bigint) => compactNaira(toMajor(minor));

/** Round a chart maximum up to a tidy value so the four grid lines read well. */
export function niceMax(v: number) {
	if (!Number.isFinite(v) || v <= 0) return 1000;
	const exp = 10 ** Math.floor(Math.log10(v));
	const f = v / exp;
	const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 4 ? 4 : f <= 5 ? 5 : f <= 8 ? 8 : 10;
	return nf * exp;
}

const sameDay = (a: Date, b: Date) =>
	a.getFullYear() === b.getFullYear() &&
	a.getMonth() === b.getMonth() &&
	a.getDate() === b.getDate();

/** "Today", "Yesterday", or "21 Nov" (with the year when it isn't this year). */
export function relativeDay(value: string | Date) {
	const d = new Date(value);
	const now = new Date();
	if (sameDay(d, now)) return "Today";
	const y = new Date(now);
	y.setDate(now.getDate() - 1);
	if (sameDay(d, y)) return "Yesterday";
	return d.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
	});
}

export function greeting(now = new Date()) {
	const h = now.getHours();
	if (h < 12) return "Good morning";
	if (h < 17) return "Good afternoon";
	return "Good evening";
}

export const todayOver = (now = new Date()) =>
	now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

export const firstName = (name?: string | null) => name?.trim().split(/\s+/)[0] ?? "";

/** Chart palette tokens, in order. */
export const PALETTE = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)"];

/** Is `d` inside the calendar month `offset` months from now (0 = this month)? */
export function inMonth(value: string | Date, offset = 0) {
	const d = new Date(value);
	const now = new Date();
	const ref = new Date(now.getFullYear(), now.getMonth() + offset, 1);
	return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export const monthName = (offset = 0) => {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth() + offset, 1).toLocaleDateString(
		"en-GB",
		{ month: "long" },
	);
};
