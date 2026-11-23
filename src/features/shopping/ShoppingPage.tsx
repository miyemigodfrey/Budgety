"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, ListPlus, Pencil, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import type { Status } from "@/lib/status";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money";
import { formatCurrency } from "@/lib/formatCurrency";
import { span } from "@/components/app/grid";
import {
	getLists,
	createList,
	renameList,
	deleteList,
	addItem,
	updateItem,
	deleteItem,
	type ShoppingList,
	type ShoppingItem,
} from "@/api/shopping";
import {
	applyPatch,
	cleanQty,
	diffTone,
	parseQty,
	rowActual,
	rowPlanned,
	signedMoney,
	togglePatch,
	type ItemPatch,
} from "./shoppingMath";
import { ItemCards, ItemsTable } from "./ShoppingItems";
import {
	DeleteListDialog,
	EditItemDialog,
	ListNameDialog,
	type ListDialogState,
} from "./ShoppingDialogs";

const tile: React.CSSProperties = {
	gap: 4,
	background: "var(--surface-2)",
	border: "1px solid var(--border)",
	borderRadius: 12,
	padding: "12px 14px",
};

export default function ShoppingPage() {
	const [lists, setLists] = useState<ShoppingList[]>([]);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [status, setStatus] = useState<Status>("loading");

	// Add-item form.
	const [newName, setNewName] = useState("");
	const [newQty, setNewQty] = useState("1");
	const [newUnit, setNewUnit] = useState("");
	const [adding, setAdding] = useState(false);

	// Dialogs.
	const [listDialog, setListDialog] = useState<ListDialogState>(null);
	const [deleteTarget, setDeleteTarget] = useState<ShoppingList | null>(null);
	const [editing, setEditing] = useState<ShoppingItem | null>(null);

	const load = useCallback(async () => {
		setStatus("loading");
		try {
			const data = (await getLists()) as ShoppingList[];
			setLists(data);
			setActiveId((cur) =>
				cur && data.some((l) => l.id === cur) ? cur : (data[0]?.id ?? null),
			);
			setStatus("ready");
		} catch (error) {
			console.error("Failed to load shopping lists:", error);
			setStatus("error");
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const active = lists.find((l) => l.id === activeId) ?? null;
	const items = active?.items ?? [];

	const totalPlanned = items.reduce((acc, it) => acc + rowPlanned(it), 0n);
	const totalActual = items.reduce((acc, it) => acc + rowActual(it), 0n);
	const totalDiff = items.reduce(
		(acc, it) => (it.bought ? acc + (rowActual(it) - rowPlanned(it)) : acc),
		0n,
	);
	const remaining = items.reduce((acc, it) => (it.bought ? acc : acc + rowPlanned(it)), 0n);
	const boughtCount = items.filter((it) => it.bought).length;
	const progress = items.length ? Math.round((boughtCount / items.length) * 100) : 0;

	/* ---- item mutations (optimistic) ---- */

	const patchItem = useCallback(
		async (itemId: string, patch: ItemPatch) => {
			if (!active || Object.keys(patch).length === 0) return;
			const snapshot = lists;
			setLists((ls) =>
				ls.map((l) =>
					l.id !== active.id
						? l
						: {
								...l,
								items: l.items.map((it) =>
									it.id === itemId ? applyPatch(it, patch) : it,
								),
							},
				),
			);
			try {
				await updateItem({ id: itemId, ...patch });
			} catch (error) {
				console.error("Failed to update item:", error);
				setLists(snapshot);
				toast.error("Couldn't save that change.");
			}
		},
		[active, lists],
	);

	const removeItem = useCallback(
		async (itemId: string) => {
			if (!active) return;
			const snapshot = lists;
			setLists((ls) =>
				ls.map((l) =>
					l.id !== active.id
						? l
						: { ...l, items: l.items.filter((it) => it.id !== itemId) },
				),
			);
			try {
				await deleteItem(itemId);
			} catch (error) {
				console.error("Failed to delete item:", error);
				setLists(snapshot);
				toast.error("Couldn't remove that item.");
			}
		},
		[active, lists],
	);

	const submitNewItem = async () => {
		if (!active || adding) return;
		const name = newName.trim();
		if (!name) {
			toast.error("Give the item a name first.");
			return;
		}
		const qty = parseQty(newQty);
		const unit = newUnit.trim() === "" ? 0 : parseMoneyInput(newUnit);
		if (Number.isNaN(unit) || unit < 0) {
			toast.error("Enter a valid unit price.");
			return;
		}
		setAdding(true);
		try {
			const created = (await addItem({
				listId: active.id,
				name,
				plannedQty: qty,
				plannedUnit: unit,
			})) as ShoppingItem;
			setLists((ls) =>
				ls.map((l) => (l.id !== active.id ? l : { ...l, items: [...l.items, created] })),
			);
			setNewName("");
			setNewQty("1");
			setNewUnit("");
		} catch (error) {
			console.error("Failed to add item:", error);
			toast.error("Couldn't add that item.");
		} finally {
			setAdding(false);
		}
	};

	/* ---- list mutations ---- */

	const submitListName = async (name: string): Promise<boolean> => {
		try {
			if (listDialog?.mode === "create") {
				const created = (await createList(name)) as ShoppingList;
				setLists((ls) => [...ls, created]);
				setActiveId(created.id);
			} else if (listDialog?.mode === "rename") {
				const id = listDialog.id;
				await renameList(id, name);
				setLists((ls) => ls.map((l) => (l.id === id ? { ...l, name } : l)));
			}
			return true;
		} catch (error) {
			console.error("Failed to save list:", error);
			toast.error("Couldn't save the list.");
			return false;
		}
	};

	const confirmDeleteList = async () => {
		if (!deleteTarget) return;
		const target = deleteTarget;
		try {
			await deleteList(target.id);
			setLists((ls) => {
				const next = ls.filter((l) => l.id !== target.id);
				setActiveId((cur) => (cur === target.id ? (next[0]?.id ?? null) : cur));
				return next;
			});
			setDeleteTarget(null);
		} catch (error) {
			console.error("Failed to delete list:", error);
			toast.error("Couldn't delete the list.");
		}
	};

	const openNewList = () => setListDialog({ mode: "create" });

	const diffCls = diffTone(totalDiff);
	const itemsProps = {
		items,
		boughtCount,
		totalPlanned: formatCurrency(totalPlanned),
		totalSpent: formatCurrency(totalActual),
		totalDiff: signedMoney(totalDiff),
		totalDiffCls: diffCls,
		onToggle: (it: ShoppingItem) => void patchItem(it.id, togglePatch(it)),
		onEdit: (it: ShoppingItem) => setEditing(it),
		onRemove: (it: ShoppingItem) => void removeItem(it.id),
	};

	return (
		<main className="page">
			<div className="page-h">
				<div className="page-h-text">
					<p className="t-over">Planning</p>
					<h1 className="t-h1">Shopping planner</h1>
					<p className="t-muted">
						Plan a shop, tick items off as you buy, and see how close you stayed to
						budget. Lists never touch your balances.
					</p>
				</div>
				{status === "ready" && lists.length > 0 && (
					<div className="page-h-actions hide-m">
						<button className="btn btn-primary" type="button" onClick={openNewList}>
							<ListPlus className="ic ic-sm" aria-hidden="true" />
							New list
						</button>
					</div>
				)}
			</div>

			{status === "loading" && (
				<div className="stack" aria-busy="true" aria-label="Loading shopping lists">
					<div className="row-f wrap">
						<span className="sk" style={{ height: 34, width: 150, borderRadius: 999 }} />
						<span className="sk" style={{ height: 34, width: 90, borderRadius: 999 }} />
						<span className="sk" style={{ height: 34, width: 110, borderRadius: 999 }} />
					</div>
					<span className="sk" style={{ height: 150, borderRadius: 16 }} />
					<span className="sk" style={{ height: 90, borderRadius: 16 }} />
					<span className="sk" style={{ height: 320, borderRadius: 16 }} />
				</div>
			)}

			{status === "error" && (
				<section className="card empty" role="alert">
					<p className="t-h3">Couldn&apos;t load your shopping lists.</p>
					<p>Check your connection and try again.</p>
					<button className="btn btn-secondary" type="button" onClick={() => void load()}>
						Try again
					</button>
				</section>
			)}

			{status === "ready" && lists.length === 0 && (
				<section className="card empty">
					<span className="empty-ic">
						<ShoppingCart className="ic ic-xl" aria-hidden="true" />
					</span>
					<h2 className="t-h2">Plan your first shop</h2>
					<p>
						Create a list, add what you need with a planned price, then tick items off
						as you buy to see how close you stayed to budget.
					</p>
					<button className="btn btn-primary" type="button" onClick={openNewList}>
						<ListPlus className="ic ic-sm" aria-hidden="true" />
						Create a list
					</button>
				</section>
			)}

			{status === "ready" && lists.length > 0 && (
				<div className="row-f wrap" role="group" aria-label="Shopping lists">
					{lists.map((l) => {
						const on = l.id === active?.id;
						return (
							<button
								key={l.id}
								className={`chip ${on ? "on" : ""}`}
								type="button"
								aria-pressed={on}
								onClick={() => setActiveId(l.id)}>
								{l.name}
							</button>
						);
					})}
					<button className="chip chip-add" type="button" onClick={openNewList}>
						<ListPlus className="ic ic-sm" aria-hidden="true" />
						New list
					</button>
				</div>
			)}

			{status === "ready" && active && (
				<>
					{/* Active list summary */}
					<section
						className="card stack"
						style={{ gap: 18 }}
						aria-label={`${active.name} summary`}>
						<div className="g" style={{ alignItems: "center" }}>
							<div className="row-f" style={span({ d: 5, t: 12 }, { gap: 14 })}>
								<span className="ic-tile ic-tile-lg">
									<ShoppingCart className="ic ic-lg" aria-hidden="true" />
								</span>
								<div className="grow">
									<div className="row-f" style={{ gap: 4 }}>
										<h2 className="t-h2 trunc">{active.name}</h2>
										<button
											className="btn btn-ghost btn-icon btn-sm"
											type="button"
											aria-label="Rename list"
											onClick={() =>
												setListDialog({
													mode: "rename",
													id: active.id,
													current: active.name,
												})
											}>
											<Pencil className="ic ic-sm" aria-hidden="true" />
										</button>
										<button
											className="btn btn-ghost btn-icon btn-sm"
											type="button"
											aria-label="Delete list"
											style={{ color: "var(--danger)" }}
											onClick={() => setDeleteTarget(active)}>
											<Trash2 className="ic ic-sm" aria-hidden="true" />
										</button>
									</div>
									<p className="t-sm t-muted">
										{boughtCount} of {items.length} bought
									</p>
								</div>
							</div>
							<div
								style={span(
									{ d: 7, t: 12 },
									{
										display: "grid",
										gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
										gap: 10,
									},
								)}>
								<div className="stack-sm" style={tile}>
									<span className="t-over">Planned</span>
									<span className="amt amt-md">{formatCurrency(totalPlanned)}</span>
								</div>
								<div className="stack-sm" style={tile}>
									<span className="t-over">Spent</span>
									<span className="amt amt-md">{formatCurrency(totalActual)}</span>
								</div>
								<div className="stack-sm" style={tile}>
									<span className="t-over">Difference</span>
									<span className={`amt amt-md ${diffCls}`}>{signedMoney(totalDiff)}</span>
								</div>
							</div>
						</div>
						<div className="stack-sm" style={{ gap: 8 }}>
							<div
								className="progress"
								role="progressbar"
								aria-label="Items bought"
								aria-valuemin={0}
								aria-valuemax={100}
								aria-valuenow={progress}>
								<span style={{ width: `${progress}%`, transition: "width 0.4s" }} />
							</div>
							<div className="between t-sm">
								<span className="t-muted">{progress}% of items bought</span>
								<span className="t-muted">{formatCurrency(remaining)} still to buy</span>
							</div>
						</div>
					</section>

					{/* Add item */}
					<section className="card" aria-label="Add an item">
						<form
							className="row-f wrap"
							style={{ alignItems: "flex-end", gap: 12 }}
							onSubmit={(e) => {
								e.preventDefault();
								void submitNewItem();
							}}>
							<div className="field" style={{ flex: "1 1 260px" }}>
								<label className="label" htmlFor="add-item">
									Item
								</label>
								<input
									id="add-item"
									className="input"
									maxLength={100}
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									placeholder="e.g. Rice, Milk, Detergent"
								/>
							</div>
							<div className="field" style={{ flex: "0 0 96px" }}>
								<label className="label" htmlFor="add-qty">
									Qty
								</label>
								<input
									id="add-qty"
									className="input"
									inputMode="numeric"
									value={newQty}
									onChange={(e) => setNewQty(cleanQty(e.target.value))}
									placeholder="1"
								/>
							</div>
							<div className="field" style={{ flex: "1 1 160px" }}>
								<label className="label" htmlFor="add-price">
									Unit price
								</label>
								<input
									id="add-price"
									className="input"
									inputMode="decimal"
									value={newUnit}
									onChange={(e) => setNewUnit(formatMoneyInput(e.target.value))}
									placeholder="₦0.00"
								/>
							</div>
							<button
								className="btn btn-primary"
								type="submit"
								style={{ height: 44 }}
								disabled={adding}>
								<Plus className="ic ic-sm" aria-hidden="true" />
								{adding ? "Adding…" : "Add item"}
							</button>
						</form>
					</section>

					{/* Items */}
					{items.length === 0 ? (
						<section className="card empty" aria-label="Items">
							<span className="empty-ic">
								<ClipboardList className="ic ic-xl" aria-hidden="true" />
							</span>
							<h2 className="t-h3">Nothing on this list yet</h2>
							<p>
								Add items above with a planned quantity and price. Tick them off as
								you buy, then compare what you planned against what you paid.
							</p>
						</section>
					) : (
						<>
							<ItemsTable {...itemsProps} />
							<ItemCards {...itemsProps} />
						</>
					)}
				</>
			)}

			<ListNameDialog
				state={listDialog}
				onClose={() => setListDialog(null)}
				onSubmit={submitListName}
			/>
			<DeleteListDialog
				target={deleteTarget}
				onClose={() => setDeleteTarget(null)}
				onConfirm={confirmDeleteList}
			/>
			<EditItemDialog
				item={editing}
				onClose={() => setEditing(null)}
				onSave={(it, patch) => void patchItem(it.id, patch)}
			/>
		</main>
	);
}
