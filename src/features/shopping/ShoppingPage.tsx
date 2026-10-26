"use client";

import { useCallback, useEffect, useState } from "react";
import {
	Check,
	ClipboardList,
	ListPlus,
	Pencil,
	Plus,
	ShoppingCart,
	Trash2,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UniversalModal from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import type { Status } from "@/lib/status";
import { toMinor, toMajor, parseMoneyInput, formatMoneyInput } from "@/lib/money";
import { formatCurrency } from "@/lib/formatCurrency";
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

/* ------------------------------------------------------------------ */
/* money + row maths — all in minor units (bigint)                     */
/* ------------------------------------------------------------------ */

/** Minor-unit price → the string the money input shows ("" for zero). */
function moneyToInput(minor: bigint | null | undefined): string {
	if (minor == null || minor === 0n) return "";
	return formatMoneyInput(String(toMajor(minor)));
}

const rowPlanned = (it: ShoppingItem): bigint =>
	it.plannedUnit * BigInt(it.plannedQty);

const rowActual = (it: ShoppingItem): bigint =>
	it.bought && it.purchasedUnit != null && it.purchasedQty != null
		? it.purchasedUnit * BigInt(it.purchasedQty)
		: 0n;

/** A change coming up from an editable row — money is in MAJOR units here. */
type ItemPatch = {
	name?: string;
	plannedQty?: number;
	plannedUnit?: number;
	bought?: boolean;
	purchasedQty?: number | null;
	purchasedUnit?: number | null;
};

/** Apply a major-unit patch to an item locally (optimistic echo). */
function applyPatch(it: ShoppingItem, patch: ItemPatch): ShoppingItem {
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

/* ------------------------------------------------------------------ */
/* small editable inputs                                               */
/* ------------------------------------------------------------------ */

const enterBlurs = (e: React.KeyboardEvent<HTMLInputElement>) => {
	if (e.key === "Enter") (e.target as HTMLInputElement).blur();
};

function MoneyCell({
	value,
	onChange,
	onCommit,
	className,
}: {
	value: string;
	onChange: (v: string) => void;
	onCommit: () => void;
	className?: string;
}) {
	return (
		<Input
			inputMode="decimal"
			value={value}
			onChange={(e) => onChange(formatMoneyInput(e.target.value))}
			onBlur={onCommit}
			onKeyDown={enterBlurs}
			placeholder="₦0.00"
			className={cn("h-8 text-sm tabular-nums", className)}
		/>
	);
}

function QtyCell({
	value,
	onChange,
	onCommit,
	className,
}: {
	value: string;
	onChange: (v: string) => void;
	onCommit: () => void;
	className?: string;
}) {
	return (
		<Input
			inputMode="numeric"
			value={value}
			onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
			onBlur={onCommit}
			onKeyDown={enterBlurs}
			placeholder="1"
			className={cn("h-8 text-sm tabular-nums", className)}
		/>
	);
}

function BoughtCheck({
	checked,
	onToggle,
}: {
	checked: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			role="checkbox"
			aria-checked={checked}
			aria-label={checked ? "Mark as not bought" : "Mark as bought"}
			onClick={onToggle}
			className={cn(
				"flex size-6 shrink-0 items-center justify-center rounded-md border transition-all",
				checked
					? "border-brand bg-brand text-brand-foreground shadow-[0_0_12px_-2px] shadow-brand/60"
					: "border-border hover:border-brand",
			)}>
			<Check
				size={15}
				className={cn(
					"transition-transform duration-150",
					checked ? "scale-100" : "scale-0",
				)}
			/>
		</button>
	);
}

function DiffBadge({ diff, bought }: { diff: bigint; bought: boolean }) {
	if (!bought)
		return <span className="text-xs text-muted-foreground">—</span>;
	const tone =
		diff > 0n ? "text-danger" : diff < 0n ? "text-success" : "text-muted-foreground";
	const sign = diff > 0n ? "+" : "";
	return (
		<span className={cn("text-sm font-semibold tabular-nums", tone)}>
			{diff === 0n ? "On budget" : `${sign}${formatCurrency(diff)}`}
		</span>
	);
}

/* ------------------------------------------------------------------ */
/* one item — renders as a table row (desktop) or a card (mobile)      */
/* ------------------------------------------------------------------ */

function ItemRow({
	item,
	layout,
	onPatch,
	onDelete,
}: {
	item: ShoppingItem;
	layout: "table" | "card";
	onPatch: (patch: ItemPatch) => void;
	onDelete: () => void;
}) {
	const [name, setName] = useState(item.name);
	const [qty, setQty] = useState(String(item.plannedQty));
	const [unit, setUnit] = useState(moneyToInput(item.plannedUnit));
	const [pQty, setPQty] = useState(
		item.purchasedQty != null ? String(item.purchasedQty) : "",
	);
	const [pUnit, setPUnit] = useState(moneyToInput(item.purchasedUnit));

	// Re-sync local fields whenever the item changes (reloads, or our own
	// committed edits). Typing never changes `item` — commits fire on blur — so
	// this can't clobber mid-edit.
	useEffect(() => {
		setName(item.name);
		setQty(String(item.plannedQty));
		setUnit(moneyToInput(item.plannedUnit));
		setPQty(item.purchasedQty != null ? String(item.purchasedQty) : "");
		setPUnit(moneyToInput(item.purchasedUnit));
	}, [
		item.id,
		item.name,
		item.plannedQty,
		item.plannedUnit,
		item.bought,
		item.purchasedQty,
		item.purchasedUnit,
	]);

	const commitName = () => {
		const v = name.trim();
		if (!v) return setName(item.name);
		if (v !== item.name) onPatch({ name: v });
	};
	const commitQty = () => {
		const n = Math.max(1, Math.floor(Number(qty)) || 1);
		setQty(String(n));
		if (n !== item.plannedQty) onPatch({ plannedQty: n });
	};
	const commitUnit = () => {
		const n = unit.trim() === "" ? 0 : parseMoneyInput(unit);
		if (Number.isNaN(n) || n < 0) return setUnit(moneyToInput(item.plannedUnit));
		if (toMinor(n) !== item.plannedUnit) onPatch({ plannedUnit: n });
	};
	const commitPQty = () => {
		const n = Math.max(1, Math.floor(Number(pQty)) || 1);
		setPQty(String(n));
		if (n !== item.purchasedQty) onPatch({ purchasedQty: n });
	};
	const commitPUnit = () => {
		const n = pUnit.trim() === "" ? 0 : parseMoneyInput(pUnit);
		if (Number.isNaN(n) || n < 0) return setPUnit(moneyToInput(item.purchasedUnit));
		if (toMinor(n) !== (item.purchasedUnit ?? 0n))
			onPatch({ purchasedUnit: n });
	};

	const toggle = () =>
		onPatch(
			item.bought
				? { bought: false }
				: {
						bought: true,
						// Pre-fill actuals with the plan so the difference starts at zero.
						purchasedQty: item.plannedQty,
						purchasedUnit: toMajor(item.plannedUnit),
					},
		);

	const planned = rowPlanned(item);
	const actual = rowActual(item);
	const diff = actual - planned;

	if (layout === "card") {
		return (
			<div
				className={cn(
					"rounded-2xl border bg-card p-4 shadow-sm transition-colors",
					item.bought ? "border-brand/40" : "border-border",
				)}>
				<div className="flex items-center gap-3">
					<BoughtCheck checked={item.bought} onToggle={toggle} />
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						onBlur={commitName}
						onKeyDown={enterBlurs}
						placeholder="Item name"
						className="h-8 flex-1 border-transparent bg-transparent px-1 text-base font-semibold focus-visible:border-input"
					/>
					<button
						type="button"
						aria-label="Remove item"
						onClick={onDelete}
						className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-danger-surface hover:text-danger">
						<Trash2 size={15} />
					</button>
				</div>

				<div className="mt-3 grid grid-cols-2 gap-3">
					<label className="space-y-1">
						<span className="text-xs text-muted-foreground">Qty</span>
						<QtyCell value={qty} onChange={setQty} onCommit={commitQty} />
					</label>
					<label className="space-y-1">
						<span className="text-xs text-muted-foreground">Unit price</span>
						<MoneyCell value={unit} onChange={setUnit} onCommit={commitUnit} />
					</label>
				</div>

				<div className="mt-3 flex items-center justify-between rounded-lg bg-surface-sunken px-3 py-2">
					<span className="text-xs text-muted-foreground">Planned total</span>
					<span className="text-sm font-semibold tabular-nums text-foreground">
						{formatCurrency(planned)}
					</span>
				</div>

				{item.bought && (
					<div className="mt-3 space-y-3 rounded-xl border border-brand/30 bg-brand/5 p-3">
						<div className="grid grid-cols-2 gap-3">
							<label className="space-y-1">
								<span className="text-xs text-muted-foreground">
									Bought qty
								</span>
								<QtyCell value={pQty} onChange={setPQty} onCommit={commitPQty} />
							</label>
							<label className="space-y-1">
								<span className="text-xs text-muted-foreground">
									Price paid
								</span>
								<MoneyCell
									value={pUnit}
									onChange={setPUnit}
									onCommit={commitPUnit}
								/>
							</label>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-foreground">Spent</span>
							<span className="text-sm font-semibold tabular-nums text-foreground">
								{formatCurrency(actual)}
							</span>
						</div>
						<div className="flex items-center justify-between border-t border-border pt-2">
							<span className="text-xs text-muted-foreground">Difference</span>
							<DiffBadge diff={diff} bought={item.bought} />
						</div>
					</div>
				)}
			</div>
		);
	}

	// Desktop table row.
	return (
		<tr
			className={cn(
				"border-b border-border transition-colors last:border-0",
				item.bought ? "bg-brand/5" : "hover:bg-muted/40",
			)}>
			<td className="py-2 pl-2 pr-2">
				<div className="flex items-center gap-2">
					<BoughtCheck checked={item.bought} onToggle={toggle} />
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						onBlur={commitName}
						onKeyDown={enterBlurs}
						placeholder="Item name"
						className="h-8 min-w-36 border-transparent bg-transparent px-1 font-medium focus-visible:border-input"
					/>
				</div>
			</td>
			<td className="px-2 py-2">
				<QtyCell value={qty} onChange={setQty} onCommit={commitQty} className="w-16" />
			</td>
			<td className="px-2 py-2">
				<MoneyCell value={unit} onChange={setUnit} onCommit={commitUnit} className="w-28" />
			</td>
			<td className="px-2 py-2 text-right font-medium tabular-nums">
				{formatCurrency(planned)}
			</td>
			<td className="px-2 py-2">
				{item.bought ? (
					<QtyCell value={pQty} onChange={setPQty} onCommit={commitPQty} className="w-16" />
				) : (
					<span className="text-xs text-muted-foreground">—</span>
				)}
			</td>
			<td className="px-2 py-2">
				{item.bought ? (
					<MoneyCell
						value={pUnit}
						onChange={setPUnit}
						onCommit={commitPUnit}
						className="w-28"
					/>
				) : (
					<span className="text-xs text-muted-foreground">—</span>
				)}
			</td>
			<td className="px-2 py-2 text-right font-medium tabular-nums">
				{item.bought ? formatCurrency(actual) : "—"}
			</td>
			<td className="px-2 py-2 text-right">
				<DiffBadge diff={diff} bought={item.bought} />
			</td>
			<td className="py-2 pl-2 pr-2 text-right">
				<button
					type="button"
					aria-label="Remove item"
					onClick={onDelete}
					className="rounded-md p-1.5 text-muted-foreground transition hover:bg-danger-surface hover:text-danger">
					<Trash2 size={15} />
				</button>
			</td>
		</tr>
	);
}

/* ------------------------------------------------------------------ */
/* page                                                                */
/* ------------------------------------------------------------------ */

type ListModalState =
	| { mode: "create" }
	| { mode: "rename"; id: string; current: string }
	| null;

export default function ShoppingPage() {
	const [lists, setLists] = useState<ShoppingList[]>([]);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [status, setStatus] = useState<Status>("loading");

	// Add-item form.
	const [newName, setNewName] = useState("");
	const [newQty, setNewQty] = useState("1");
	const [newUnit, setNewUnit] = useState("");

	// List create/rename + delete modals.
	const [listModal, setListModal] = useState<ListModalState>(null);
	const [listName, setListName] = useState("");
	const [deleteTarget, setDeleteTarget] = useState<ShoppingList | null>(null);

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
	const boughtCount = items.filter((it) => it.bought).length;
	const progress = items.length ? Math.round((boughtCount / items.length) * 100) : 0;

	/* ---- item mutations (optimistic) ---- */

	const patchItem = useCallback(
		async (itemId: string, patch: ItemPatch) => {
			if (!active) return;
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
		if (!active) return;
		const name = newName.trim();
		if (!name) {
			toast.error("Give the item a name first.");
			return;
		}
		const qty = Math.max(1, Math.floor(Number(newQty)) || 1);
		const unit = newUnit.trim() === "" ? 0 : parseMoneyInput(newUnit);
		if (Number.isNaN(unit) || unit < 0) {
			toast.error("Enter a valid unit price.");
			return;
		}
		try {
			const created = (await addItem({
				listId: active.id,
				name,
				plannedQty: qty,
				plannedUnit: unit,
			})) as ShoppingItem;
			setLists((ls) =>
				ls.map((l) =>
					l.id !== active.id ? l : { ...l, items: [...l.items, created] },
				),
			);
			setNewName("");
			setNewQty("1");
			setNewUnit("");
		} catch (error) {
			console.error("Failed to add item:", error);
			toast.error("Couldn't add that item.");
		}
	};

	/* ---- list mutations ---- */

	const submitListModal = async () => {
		const name = listName.trim();
		if (!name) {
			toast.error("Enter a list name.");
			return;
		}
		try {
			if (listModal?.mode === "create") {
				const created = (await createList(name)) as ShoppingList;
				setLists((ls) => [...ls, created]);
				setActiveId(created.id);
			} else if (listModal?.mode === "rename") {
				await renameList(listModal.id, name);
				setLists((ls) =>
					ls.map((l) => (l.id === listModal.id ? { ...l, name } : l)),
				);
			}
			setListModal(null);
			setListName("");
		} catch (error) {
			console.error("Failed to save list:", error);
			toast.error("Couldn't save the list.");
		}
	};

	const confirmDeleteList = async () => {
		if (!deleteTarget) return;
		const target = deleteTarget;
		try {
			await deleteList(target.id);
			setLists((ls) => {
				const next = ls.filter((l) => l.id !== target.id);
				setActiveId((cur) =>
					cur === target.id ? (next[0]?.id ?? null) : cur,
				);
				return next;
			});
			setDeleteTarget(null);
		} catch (error) {
			console.error("Failed to delete list:", error);
			toast.error("Couldn't delete the list.");
		}
	};

	return (
		<div className="w-full flex flex-col items-center py-6 px-2 md:px-4">
			<div className="w-full max-w-5xl">
				<header className="flex items-center gap-2 px-1">
					<BackButton />
					<h1 className="text-2xl font-bold">Shopping Planner</h1>
				</header>

				{/* List switcher */}
				{status === "ready" && lists.length > 0 && (
				<div className="mt-6 flex flex-wrap items-center gap-2">
					{lists.map((l) => {
						const isActive = l.id === active?.id;
						return (
							<button
								key={l.id}
								type="button"
								onClick={() => setActiveId(l.id)}
								className={cn(
									"rounded-full px-4 py-1.5 text-sm font-medium transition-all",
									isActive
										? "bg-brand text-brand-foreground shadow-[0_0_16px_-4px] shadow-brand/60"
										: "bg-card text-muted-foreground hover:text-foreground border border-border",
								)}>
								{l.name}
							</button>
						);
					})}
					<button
						type="button"
						onClick={() => {
							setListName("");
							setListModal({ mode: "create" });
						}}
						className="inline-flex items-center gap-1 rounded-full border border-dashed border-brand/50 px-3 py-1.5 text-sm text-brand transition hover:bg-brand/10">
						<ListPlus size={15} />
						New list
					</button>
				</div>
				)}

				{status === "ready" && lists.length === 0 && (
					<div className="mt-6 rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
						<div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand/15 text-brand">
							<ShoppingCart size={26} />
						</div>
						<h2 className="text-lg font-bold text-foreground">
							Plan your first shop
						</h2>
						<p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
							Create a list, add what you need with a planned price, then tick
							items off as you buy to see how close you stayed to budget.
						</p>
						<Button
							variant="primary"
							className="mt-5"
							onClick={() => {
								setListName("");
								setListModal({ mode: "create" });
							}}>
							<ListPlus size={16} />
							Create a list
						</Button>
					</div>
				)}

				{status === "loading" && (
					<div className="mt-6 space-y-3">
						<Skeleton className="h-28 w-full rounded-2xl" />
						<Skeleton className="h-16 w-full rounded-2xl" />
						<Skeleton className="h-16 w-full rounded-2xl" />
					</div>
				)}

				{status === "error" && (
					<div className="mt-6">
						<ErrorState
							message="Couldn't load your shopping lists."
							onRetry={load}
						/>
					</div>
				)}

				{status === "ready" && active && (
					<>
						{/* Hero summary */}
						<section className="relative mt-6 overflow-hidden rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/15 via-card to-card p-5 shadow-xl">
							<div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-brand/20 blur-3xl" />
							<div className="relative flex flex-wrap items-start justify-between gap-4">
								<div className="flex items-center gap-2">
									<div className="flex size-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
										<ShoppingCart size={20} />
									</div>
									<div>
										<div className="flex items-center gap-2">
											<h2 className="text-lg font-bold text-foreground">
												{active.name}
											</h2>
											<button
												type="button"
												aria-label="Rename list"
												onClick={() => {
													setListName(active.name);
													setListModal({
														mode: "rename",
														id: active.id,
														current: active.name,
													});
												}}
												className="rounded p-1 text-muted-foreground transition hover:text-foreground">
												<Pencil size={13} />
											</button>
											<button
												type="button"
												aria-label="Delete list"
												onClick={() => setDeleteTarget(active)}
												className="rounded p-1 text-muted-foreground transition hover:text-danger">
												<Trash2 size={13} />
											</button>
										</div>
										<p className="text-xs text-muted-foreground">
											{boughtCount} of {items.length} bought
										</p>
									</div>
								</div>

								<div className="grid grid-cols-3 gap-4 text-right">
									<div>
										<p className="text-[11px] uppercase tracking-wide text-muted-foreground">
											Planned
										</p>
										<p className="text-base font-bold tabular-nums text-foreground md:text-lg">
											{formatCurrency(totalPlanned)}
										</p>
									</div>
									<div>
										<p className="text-[11px] uppercase tracking-wide text-muted-foreground">
											Spent
										</p>
										<p className="text-base font-bold tabular-nums text-foreground md:text-lg">
											{formatCurrency(totalActual)}
										</p>
									</div>
									<div>
										<p className="text-[11px] uppercase tracking-wide text-muted-foreground">
											Difference
										</p>
										<p
											className={cn(
												"text-base font-bold tabular-nums md:text-lg",
												totalDiff > 0n
													? "text-danger"
													: totalDiff < 0n
														? "text-success"
														: "text-foreground",
											)}>
											{totalDiff > 0n ? "+" : ""}
											{formatCurrency(totalDiff)}
										</p>
									</div>
								</div>
							</div>

							{/* Progress */}
							<div className="relative mt-4">
								<div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
									<div
										className="h-full rounded-full bg-brand transition-all duration-500"
										style={{ width: `${progress}%` }}
									/>
								</div>
							</div>
						</section>

						{/* Add item */}
						<section className="mt-5 rounded-2xl border border-border bg-card p-3 shadow-sm">
							<div className="flex flex-col gap-2 sm:flex-row sm:items-end">
								<div className="flex-1 space-y-1">
									<label className="text-xs text-muted-foreground">Item</label>
									<Input
										value={newName}
										onChange={(e) => setNewName(e.target.value)}
										onKeyDown={(e) => e.key === "Enter" && void submitNewItem()}
										placeholder="e.g. Rice, Milk, Detergent"
										className="h-9"
									/>
								</div>
								<div className="flex gap-2">
									<div className="w-20 space-y-1">
										<label className="text-xs text-muted-foreground">Qty</label>
										<Input
											inputMode="numeric"
											value={newQty}
											onChange={(e) =>
												setNewQty(e.target.value.replace(/[^\d]/g, ""))
											}
											onKeyDown={(e) =>
												e.key === "Enter" && void submitNewItem()
											}
											className="h-9 tabular-nums"
										/>
									</div>
									<div className="w-32 space-y-1">
										<label className="text-xs text-muted-foreground">
											Unit price
										</label>
										<Input
											inputMode="decimal"
											value={newUnit}
											onChange={(e) =>
												setNewUnit(formatMoneyInput(e.target.value))
											}
											onKeyDown={(e) =>
												e.key === "Enter" && void submitNewItem()
											}
											placeholder="₦0.00"
											className="h-9 tabular-nums"
										/>
									</div>
								</div>
								<Button
									variant="primary"
									onClick={() => void submitNewItem()}
									className="h-9 shrink-0">
									<Plus size={16} />
									Add
								</Button>
							</div>
						</section>

						{/* Items */}
						{items.length === 0 ? (
							<div className="mt-5">
								<EmptyState
									icon={ClipboardList}
									title="Nothing on this list yet"
									description="Add items above with a planned quantity and price. Tick them off as you buy, then compare what you planned against what you paid."
								/>
							</div>
						) : (
							<>
								{/* Desktop table */}
								<div className="mt-5 hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:block">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-border bg-surface-sunken text-left text-xs uppercase tracking-wide text-muted-foreground">
												<th className="py-2 pl-2 pr-2 font-medium">Item</th>
												<th className="px-2 py-2 font-medium">Qty</th>
												<th className="px-2 py-2 font-medium">Unit price</th>
												<th className="px-2 py-2 text-right font-medium">
													Planned
												</th>
												<th className="px-2 py-2 font-medium">Bought qty</th>
												<th className="px-2 py-2 font-medium">Price paid</th>
												<th className="px-2 py-2 text-right font-medium">Spent</th>
												<th className="px-2 py-2 text-right font-medium">Diff</th>
												<th className="py-2 pl-2 pr-2" aria-label="Actions" />
											</tr>
										</thead>
										<tbody>
											{items.map((it) => (
												<ItemRow
													key={it.id}
													item={it}
													layout="table"
													onPatch={(patch) => void patchItem(it.id, patch)}
													onDelete={() => void removeItem(it.id)}
												/>
											))}
										</tbody>
										<tfoot>
											<tr className="border-t border-border bg-surface-sunken font-semibold">
												<td className="py-3 pl-2 pr-2" colSpan={3}>
													Totals
												</td>
												<td className="px-2 py-3 text-right tabular-nums">
													{formatCurrency(totalPlanned)}
												</td>
												<td colSpan={2} />
												<td className="px-2 py-3 text-right tabular-nums">
													{formatCurrency(totalActual)}
												</td>
												<td className="px-2 py-3 text-right">
													<span
														className={cn(
															"tabular-nums",
															totalDiff > 0n
																? "text-danger"
																: totalDiff < 0n
																	? "text-success"
																	: "text-foreground",
														)}>
														{totalDiff > 0n ? "+" : ""}
														{formatCurrency(totalDiff)}
													</span>
												</td>
												<td className="py-3 pl-2 pr-2" />
											</tr>
										</tfoot>
									</table>
								</div>

								{/* Mobile / tablet cards */}
								<div className="mt-5 grid gap-3 lg:hidden">
									{items.map((it) => (
										<ItemRow
											key={it.id}
											item={it}
											layout="card"
											onPatch={(patch) => void patchItem(it.id, patch)}
											onDelete={() => void removeItem(it.id)}
										/>
									))}
								</div>
							</>
						)}
					</>
				)}
			</div>

			{/* Create / rename list modal */}
			<UniversalModal
				open={listModal !== null}
				onOpenChange={(o) => !o && setListModal(null)}
				title={listModal?.mode === "rename" ? "Rename list" : "New shopping list"}
				description={
					listModal?.mode === "rename"
						? "Give this list a new name."
						: "Name your list — e.g. Groceries, Party, Monthly stock-up."
				}
				footer={
					<div className="flex w-full flex-col gap-2">
						<Button variant="primary" onClick={() => void submitListModal()}>
							{listModal?.mode === "rename" ? "Save" : "Create list"}
						</Button>
						<Button variant="ghost" onClick={() => setListModal(null)}>
							Cancel
						</Button>
					</div>
				}>
				<Input
					autoFocus
					value={listName}
					onChange={(e) => setListName(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && void submitListModal()}
					placeholder="List name"
				/>
			</UniversalModal>

			{/* Delete list confirm */}
			<UniversalModal
				open={deleteTarget !== null}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
				title="Delete this list?"
				description={
					deleteTarget
						? `"${deleteTarget.name}" and all its items will be removed. This can't be undone.`
						: ""
				}
				footer={
					<div className="flex w-full flex-col gap-2">
						<Button variant="destructive" onClick={() => void confirmDeleteList()}>
							Delete list
						</Button>
						<Button variant="ghost" onClick={() => setDeleteTarget(null)}>
							Keep it
						</Button>
					</div>
				}>
				<p className="text-sm text-muted-foreground">
					Deleting removes every item on this list.
				</p>
			</UniversalModal>
		</div>
	);
}
