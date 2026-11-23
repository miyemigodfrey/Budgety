import type { ShoppingItem } from "@/api/shopping";
import { toMinor, toMajor, formatMoneyInput } from "@/lib/money";
import { formatCurrency } from "@/lib/formatCurrency";

/* Money + row maths for the shopping planner — all in minor units (bigint). */

/** Minor-unit price → the string the money input shows ("" for zero). */
export function moneyToInput(minor: bigint | null | undefined): string {
	if (minor == null || minor === 0n) return "";
	return formatMoneyInput(String(toMajor(minor)));
}

export const rowPlanned = (it: ShoppingItem): bigint =>
	it.plannedUnit * BigInt(it.plannedQty);

export const rowActual = (it: ShoppingItem): bigint =>
	it.bought && it.purchasedUnit != null && it.purchasedQty != null
		? it.purchasedUnit * BigInt(it.purchasedQty)
		: 0n;

/** A change to an item — money is in MAJOR units here (the tRPC edge converts). */
export type ItemPatch = {
	name?: string;
	plannedQty?: number;
	plannedUnit?: number;
	bought?: boolean;
	purchasedQty?: number | null;
	purchasedUnit?: number | null;
};

/** Apply a major-unit patch to an item locally (optimistic echo). */
export function applyPatch(it: ShoppingItem, patch: ItemPatch): ShoppingItem {
	const next: ShoppingItem = { ...it };
	if (patch.name !== undefined) next.name = patch.name;
	if (patch.plannedQty !== undefined) next.plannedQty = patch.plannedQty;
	if (patch.plannedUnit !== undefined) next.plannedUnit = toMinor(patch.plannedUnit);
	if (patch.bought !== undefined) next.bought = patch.bought;
	if (patch.bought === false) {
		next.purchasedQty = null;
		next.purchasedUnit = null;
	} else {
		if ("purchasedQty" in patch) next.purchasedQty = patch.purchasedQty ?? null;
		if ("purchasedUnit" in patch)
			next.purchasedUnit =
				patch.purchasedUnit == null ? null : toMinor(patch.purchasedUnit);
	}
	return next;
}

/** Ticking an item pre-fills the actuals with the plan so the difference starts at zero. */
export function togglePatch(it: ShoppingItem): ItemPatch {
	return it.bought
		? { bought: false }
		: {
				bought: true,
				purchasedQty: it.plannedQty,
				purchasedUnit: toMajor(it.plannedUnit),
			};
}

const abs = (v: bigint) => (v < 0n ? -v : v);

/** "+₦800" / "−₦1,200" / "₦0" — a real minus sign, like the canvas. */
export function signedMoney(diff: bigint): string {
	if (diff === 0n) return formatCurrency(0n);
	return `${diff > 0n ? "+" : "−"}${formatCurrency(abs(diff))}`;
}

/** Colour class for a difference: over budget is outflow red, under is inflow green. */
export const diffTone = (diff: bigint) => (diff > 0n ? "out" : diff < 0n ? "in" : "");

/** Badge class + label for one row's difference. */
export function rowDiff(it: ShoppingItem): { cls: string; label: string } {
	if (!it.bought) return { cls: "outline", label: "—" };
	const diff = rowActual(it) - rowPlanned(it);
	return {
		cls: diffTone(diff),
		label: diff === 0n ? "On budget" : signedMoney(diff),
	};
}

/** Whole numbers ≥ 1 from a qty field ("" or junk → 1). */
export const parseQty = (raw: string) => Math.max(1, Math.floor(Number(raw)) || 1);

/** Only digits survive in a qty field. */
export const cleanQty = (raw: string) => raw.replace(/[^\d]/g, "");
