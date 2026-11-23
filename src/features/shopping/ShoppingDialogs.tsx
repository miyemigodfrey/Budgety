"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import UniversalModal from "@/components/ui/modal";
import type { ShoppingItem, ShoppingList } from "@/api/shopping";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatMoneyInput, parseMoneyInput, toMinor } from "@/lib/money";
import {
	cleanQty,
	moneyToInput,
	parseQty,
	rowPlanned,
	type ItemPatch,
} from "./shoppingMath";

/** Pushes the footer buttons to the right on tablet and up (phones stack them). */
const FooterSpacer = () => <span className="grow hide-m" aria-hidden="true" />;

/* ------------------------------------------------------------------ */
/* New list / rename list                                              */
/* ------------------------------------------------------------------ */

export type ListDialogState =
	| { mode: "create" }
	| { mode: "rename"; id: string; current: string }
	| null;

export function ListNameDialog({
	state,
	onClose,
	onSubmit,
}: {
	state: ListDialogState;
	onClose: () => void;
	/** Resolves true when saved, so the dialog can close. */
	onSubmit: (name: string) => Promise<boolean>;
}) {
	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);
	const [lastState, setLastState] = useState<ListDialogState>(null);

	// Reset the field each time the dialog opens (to "" or the current name).
	if (state !== lastState) {
		setLastState(state);
		if (state) setName(state.mode === "rename" ? state.current : "");
	}

	const rename = state?.mode === "rename";

	const submit = async () => {
		const v = name.trim();
		if (!v) {
			toast.error("Enter a list name.");
			return;
		}
		setSaving(true);
		const ok = await onSubmit(v);
		setSaving(false);
		if (ok) onClose();
	};

	return (
		<UniversalModal
			open={state !== null}
			onOpenChange={(o) => !o && onClose()}
			title={rename ? "Rename list" : "New shopping list"}
			description={
				rename
					? "Give this list a new name."
					: "Name your list, e.g. Groceries, Party, Monthly stock-up."
			}
			footer={
				<>
					<FooterSpacer />
					<button className="btn btn-ghost btn-lg" type="button" onClick={onClose}>
						Cancel
					</button>
					<button
						className="btn btn-primary btn-lg"
						type="button"
						disabled={saving}
						onClick={() => void submit()}>
						{saving ? "Saving…" : rename ? "Save" : "Create list"}
					</button>
				</>
			}>
			<form
				className="field"
				onSubmit={(e) => {
					e.preventDefault();
					void submit();
				}}>
				<label className="label" htmlFor="shopping-list-name">
					List name
				</label>
				<input
					id="shopping-list-name"
					className="input"
					autoFocus
					maxLength={60}
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g. Groceries · November"
				/>
			</form>
		</UniversalModal>
	);
}

/* ------------------------------------------------------------------ */
/* Delete list                                                         */
/* ------------------------------------------------------------------ */

export function DeleteListDialog({
	target,
	onClose,
	onConfirm,
}: {
	target: ShoppingList | null;
	onClose: () => void;
	onConfirm: () => Promise<void>;
}) {
	const [busy, setBusy] = useState(false);
	return (
		<UniversalModal
			open={target !== null}
			onOpenChange={(o) => !o && onClose()}
			title="Delete this list?"
			description={
				target
					? `"${target.name}" and all its items will be removed. This can't be undone.`
					: undefined
			}
			footer={
				<>
					<FooterSpacer />
					<button className="btn btn-ghost btn-lg" type="button" onClick={onClose}>
						Keep it
					</button>
					<button
						className="btn btn-danger btn-lg"
						type="button"
						disabled={busy}
						onClick={async () => {
							setBusy(true);
							await onConfirm();
							setBusy(false);
						}}>
						{busy ? "Deleting…" : "Delete list"}
					</button>
				</>
			}>
			<p className="t-sm t-muted">
				Deleting removes every item on this list. Your balances and transactions
				are not affected.
			</p>
		</UniversalModal>
	);
}

/* ------------------------------------------------------------------ */
/* Edit item                                                           */
/* ------------------------------------------------------------------ */

export function EditItemDialog({
	item,
	onClose,
	onSave,
}: {
	item: ShoppingItem | null;
	onClose: () => void;
	/** Called with only the changed fields (may be empty). */
	onSave: (item: ShoppingItem, patch: ItemPatch) => void;
}) {
	return (
		<UniversalModal
			open={item !== null}
			onOpenChange={(o) => !o && onClose()}
			title="Edit item"
			description="Change the plan, or record what you actually paid."
			footer={
				<>
					<FooterSpacer />
					<button className="btn btn-ghost btn-lg" type="button" onClick={onClose}>
						Cancel
					</button>
					<button className="btn btn-primary btn-lg" type="submit" form="shopping-edit-item">
						Save item
					</button>
				</>
			}>
			{item && (
				<EditItemForm
					key={item.id}
					item={item}
					onSave={(patch) => {
						onSave(item, patch);
						onClose();
					}}
				/>
			)}
		</UniversalModal>
	);
}

function EditItemForm({
	item,
	onSave,
}: {
	item: ShoppingItem;
	onSave: (patch: ItemPatch) => void;
}) {
	const [name, setName] = useState(item.name);
	const [qty, setQty] = useState(String(item.plannedQty));
	const [unit, setUnit] = useState(moneyToInput(item.plannedUnit));
	const [bought, setBought] = useState(item.bought);
	const [pQty, setPQty] = useState(
		item.purchasedQty != null ? String(item.purchasedQty) : "",
	);
	const [pUnit, setPUnit] = useState(moneyToInput(item.purchasedUnit));

	const toggleBought = () => {
		const next = !bought;
		setBought(next);
		// Ticking pre-fills the actuals with the plan so the difference starts at zero.
		if (next) {
			if (pQty === "") setPQty(qty || "1");
			if (pUnit === "") setPUnit(unit);
		}
	};

	const submit = () => {
		const v = name.trim();
		if (!v) {
			toast.error("Give the item a name first.");
			return;
		}
		const plannedQty = parseQty(qty);
		const plannedUnit = unit.trim() === "" ? 0 : parseMoneyInput(unit);
		if (Number.isNaN(plannedUnit) || plannedUnit < 0) {
			toast.error("Enter a valid unit price.");
			return;
		}

		const patch: ItemPatch = {};
		if (v !== item.name) patch.name = v;
		if (plannedQty !== item.plannedQty) patch.plannedQty = plannedQty;
		if (toMinor(plannedUnit) !== item.plannedUnit) patch.plannedUnit = plannedUnit;

		if (!bought) {
			if (item.bought) patch.bought = false;
		} else {
			const purchasedQty = parseQty(pQty);
			const purchasedUnit = pUnit.trim() === "" ? 0 : parseMoneyInput(pUnit);
			if (Number.isNaN(purchasedUnit) || purchasedUnit < 0) {
				toast.error("Enter a valid price paid.");
				return;
			}
			if (!item.bought) patch.bought = true;
			if (!item.bought || purchasedQty !== item.purchasedQty)
				patch.purchasedQty = purchasedQty;
			if (!item.bought || toMinor(purchasedUnit) !== (item.purchasedUnit ?? 0n))
				patch.purchasedUnit = purchasedUnit;
		}

		onSave(patch); // an empty patch just closes the dialog
	};

	const previewPlanned = (() => {
		const u = unit.trim() === "" ? 0 : parseMoneyInput(unit);
		if (Number.isNaN(u)) return null;
		return rowPlanned({ ...item, plannedQty: parseQty(qty), plannedUnit: toMinor(u) });
	})();

	return (
		<form
			id="shopping-edit-item"
			className="stack"
			style={{ gap: 16 }}
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}>
			<div className="form-grid">
				<div className="field full">
					<label className="label" htmlFor="edit-item-name">
						Item
					</label>
					<input
						id="edit-item-name"
						className="input"
						maxLength={100}
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="e.g. Rice, Milk, Detergent"
					/>
				</div>
				<div className="field">
					<label className="label" htmlFor="edit-item-qty">
						Qty
					</label>
					<input
						id="edit-item-qty"
						className="input"
						inputMode="numeric"
						value={qty}
						onChange={(e) => setQty(cleanQty(e.target.value))}
						placeholder="1"
					/>
				</div>
				<div className="field">
					<label className="label" htmlFor="edit-item-unit">
						Unit price
					</label>
					<input
						id="edit-item-unit"
						className="input"
						inputMode="decimal"
						value={unit}
						onChange={(e) => setUnit(formatMoneyInput(e.target.value))}
						placeholder="₦0.00"
					/>
				</div>
				{previewPlanned != null && (
					<p className="hint full">Planned total: {formatCurrency(previewPlanned)}</p>
				)}
			</div>

			<div
				className="between"
				style={{
					padding: "12px 14px",
					borderRadius: 12,
					background: "var(--surface-2)",
					border: "1px solid var(--border)",
				}}>
				<div className="stack-sm" style={{ gap: 2 }}>
					<span className="t-sm t-strong" id="edit-item-bought-l">
						Bought
					</span>
					<span className="hint">Tick it off and record what you paid.</span>
				</div>
				<button
					className={`switch ${bought ? "on" : ""}`}
					type="button"
					role="switch"
					aria-checked={bought}
					aria-labelledby="edit-item-bought-l"
					onClick={toggleBought}
				/>
			</div>

			{bought && (
				<div className="form-grid">
					<div className="field">
						<label className="label" htmlFor="edit-item-pqty">
							Bought qty
						</label>
						<input
							id="edit-item-pqty"
							className="input"
							inputMode="numeric"
							value={pQty}
							onChange={(e) => setPQty(cleanQty(e.target.value))}
							placeholder="1"
						/>
					</div>
					<div className="field">
						<label className="label" htmlFor="edit-item-punit">
							Price paid (per unit)
						</label>
						<input
							id="edit-item-punit"
							className="input"
							inputMode="decimal"
							value={pUnit}
							onChange={(e) => setPUnit(formatMoneyInput(e.target.value))}
							placeholder="₦0.00"
						/>
					</div>
				</div>
			)}
		</form>
	);
}
