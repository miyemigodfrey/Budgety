"use client";

import { Check, Pencil, Trash2 } from "lucide-react";
import type { ShoppingItem } from "@/api/shopping";
import { formatCurrency } from "@/lib/formatCurrency";
import { span } from "@/components/app/grid";
import { rowActual, rowDiff, rowPlanned } from "./shoppingMath";

type ItemsProps = {
	items: ShoppingItem[];
	boughtCount: number;
	totalPlanned: string;
	totalSpent: string;
	totalDiff: string;
	totalDiffCls: string;
	onToggle: (item: ShoppingItem) => void;
	onEdit: (item: ShoppingItem) => void;
	onRemove: (item: ShoppingItem) => void;
};

function BoughtCheck({
	item,
	onToggle,
	style,
}: {
	item: ShoppingItem;
	onToggle: () => void;
	style?: React.CSSProperties;
}) {
	return (
		<button
			className={`check ${item.bought ? "on" : ""}`}
			type="button"
			role="checkbox"
			aria-checked={item.bought}
			aria-label={
				item.bought ? `Mark ${item.name} as not bought` : `Mark ${item.name} as bought`
			}
			onClick={onToggle}
			style={style}>
			<Check className="ic ic-xs" style={{ strokeWidth: 3 }} aria-hidden="true" />
		</button>
	);
}

function RowActions({
	item,
	onEdit,
	onRemove,
	style,
}: {
	item: ShoppingItem;
	onEdit: () => void;
	onRemove: () => void;
	style?: React.CSSProperties;
}) {
	return (
		<div className="row-f" style={{ gap: 2, justifyContent: "flex-end", ...style }}>
			<button
				className="btn btn-ghost btn-icon btn-sm"
				type="button"
				aria-label={`Edit ${item.name}`}
				onClick={onEdit}>
				<Pencil className="ic ic-sm" aria-hidden="true" />
			</button>
			<button
				className="btn btn-ghost btn-icon btn-sm"
				type="button"
				aria-label={`Remove ${item.name}`}
				onClick={onRemove}>
				<Trash2 className="ic ic-sm" aria-hidden="true" />
			</button>
		</div>
	);
}

const blank = <span className="t-over" style={{ fontSize: 11 }}>&#160;</span>;
const totalCell: React.CSSProperties = { background: "var(--surface-2)" };

/** Desktop / laptop: planned against what was actually paid, as a table. */
export function ItemsTable({
	items,
	boughtCount,
	totalPlanned,
	totalSpent,
	totalDiff,
	totalDiffCls,
	onToggle,
	onEdit,
	onRemove,
}: ItemsProps) {
	return (
		<section className="card card-flush hide-t" aria-label="Items">
			<div className="card-h">
				<div>
					<p className="card-t">Items</p>
					<p className="card-s">Planned against what you actually paid</p>
				</div>
				<span className="t-sm t-muted">
					{boughtCount} of {items.length} bought
				</span>
			</div>
			<div className="tbl-wrap">
				<table className="tbl">
					<thead>
						<tr>
							<th style={{ width: 52 }}>
								<span className="t-over" style={{ fontSize: 11 }}>
									Bought
								</span>
							</th>
							<th>Item</th>
							<th className="num">Qty</th>
							<th className="num">Unit price</th>
							<th className="num">Planned</th>
							<th className="num">Bought qty</th>
							<th className="num">Price paid</th>
							<th className="num">Spent</th>
							<th className="num">Diff</th>
							<th style={{ width: 84 }}>
								<span className="sr-only">Actions</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{items.map((it) => {
							const diff = rowDiff(it);
							const muted = it.bought ? "" : "t-muted";
							return (
								<tr key={it.id}>
									<td>
										<BoughtCheck item={it} onToggle={() => onToggle(it)} />
									</td>
									<td>
										<span className="t-strong">{it.name}</span>
									</td>
									<td className="num">{it.plannedQty}</td>
									<td className="num">{formatCurrency(it.plannedUnit)}</td>
									<td className="num t-strong">{formatCurrency(rowPlanned(it))}</td>
									<td className={`num ${muted}`}>
										{it.bought && it.purchasedQty != null ? it.purchasedQty : "—"}
									</td>
									<td className={`num ${muted}`}>
										{it.bought && it.purchasedUnit != null
											? formatCurrency(it.purchasedUnit)
											: "—"}
									</td>
									<td className={`num t-strong ${muted}`}>
										{it.bought ? formatCurrency(rowActual(it)) : "Not bought"}
									</td>
									<td className="num">
										<span className={`badge ${diff.cls}`}>{diff.label}</span>
									</td>
									<td>
										<RowActions
											item={it}
											onEdit={() => onEdit(it)}
											onRemove={() => onRemove(it)}
										/>
									</td>
								</tr>
							);
						})}
						<tr>
							<td style={totalCell}>{blank}</td>
							<td className="t-strong" style={totalCell}>
								Total
							</td>
							<td style={totalCell}>{blank}</td>
							<td style={totalCell}>{blank}</td>
							<td className="num t-strong" style={totalCell}>
								{totalPlanned}
							</td>
							<td style={totalCell}>{blank}</td>
							<td style={totalCell}>{blank}</td>
							<td className="num t-strong" style={totalCell}>
								{totalSpent}
							</td>
							<td className={`num t-strong ${totalDiffCls}`} style={totalCell}>
								{totalDiff}
							</td>
							<td style={totalCell}>{blank}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>
	);
}

const cell: React.CSSProperties = {
	gap: 2,
	background: "var(--surface-2)",
	borderRadius: 10,
	padding: "8px 10px",
};

/** Tablet / mobile: one card per item. */
export function ItemCards({ items, boughtCount, onToggle, onEdit, onRemove }: ItemsProps) {
	return (
		<section className="show-t" style={{ flexDirection: "column", gap: 12 }} aria-label="Items">
			<div className="between">
				<p className="card-t">Items</p>
				<span className="t-sm t-muted">
					{boughtCount} of {items.length} bought
				</span>
			</div>
			<div className="g" style={{ gap: 12 }}>
				{items.map((it) => {
					const diff = rowDiff(it);
					const muted = it.bought ? "" : "t-muted";
					return (
						<article
							key={it.id}
							className="card stack-sm"
							style={span({ t: 6, m: 12 }, { gap: 12 })}>
							<div className="row-f" style={{ alignItems: "flex-start", gap: 12 }}>
								<BoughtCheck
									item={it}
									onToggle={() => onToggle(it)}
									style={{ marginTop: 2 }}
								/>
								<div className="grow">
									<p className="t-strong">{it.name}</p>
									<p className="t-xs t-muted">
										{it.plannedQty} × {formatCurrency(it.plannedUnit)} planned
										{it.bought && it.purchasedQty != null && it.purchasedUnit != null
											? ` · ${it.purchasedQty} × ${formatCurrency(it.purchasedUnit)} paid`
											: ""}
									</p>
								</div>
								<RowActions
									item={it}
									onEdit={() => onEdit(it)}
									onRemove={() => onRemove(it)}
									style={{ margin: "-4px -6px 0 0" }}
								/>
							</div>
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
									gap: 8,
								}}>
								<div className="stack-sm" style={cell}>
									<span className="t-xs t-muted">Planned</span>
									<span className="amt t-sm">{formatCurrency(rowPlanned(it))}</span>
								</div>
								<div className="stack-sm" style={cell}>
									<span className="t-xs t-muted">Spent</span>
									<span className={`amt t-sm ${muted}`}>
										{it.bought ? formatCurrency(rowActual(it)) : "Not bought"}
									</span>
								</div>
								<div className="stack-sm" style={{ ...cell, gap: 4, alignItems: "flex-start" }}>
									<span className="t-xs t-muted">Diff</span>
									<span className={`badge ${diff.cls}`}>{diff.label}</span>
								</div>
							</div>
						</article>
					);
				})}
			</div>
		</section>
	);
}
