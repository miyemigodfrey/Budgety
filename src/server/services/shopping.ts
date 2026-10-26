import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";

const listNotFound = () =>
	new TRPCError({ code: "NOT_FOUND", message: "Shopping list not found" });

const itemNotFound = () =>
	new TRPCError({ code: "NOT_FOUND", message: "Shopping item not found" });

/**
 * All of a user's shopping lists with their items. Items are ordered by their
 * manual `position`, then creation time as a stable tie-break. Lists are
 * oldest-first so the switcher order doesn't jump around.
 */
export async function listLists(db: PrismaClient, userId: string) {
	return db.shoppingList.findMany({
		where: { userId },
		orderBy: { createdAt: "asc" },
		include: {
			items: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
		},
	});
}

export async function createList(
	db: PrismaClient,
	userId: string,
	name: string,
) {
	return db.shoppingList.create({
		data: { userId, name: name.trim() },
		include: { items: true },
	});
}

export async function renameList(
	db: PrismaClient,
	userId: string,
	id: string,
	name: string,
) {
	const existing = await db.shoppingList.findFirst({ where: { id, userId } });
	if (!existing) throw listNotFound();
	return db.shoppingList.update({
		where: { id },
		data: { name: name.trim() },
	});
}

export async function deleteList(db: PrismaClient, userId: string, id: string) {
	const existing = await db.shoppingList.findFirst({ where: { id, userId } });
	if (!existing) throw listNotFound();
	// Items cascade via the schema's onDelete: Cascade.
	await db.shoppingList.delete({ where: { id } });
	return { ok: true };
}

export async function addItem(
	db: PrismaClient,
	userId: string,
	input: {
		listId: string;
		name: string;
		plannedQty: number;
		plannedUnit?: bigint;
	},
) {
	const list = await db.shoppingList.findFirst({
		where: { id: input.listId, userId },
	});
	if (!list) throw listNotFound();

	// New items go to the bottom of the list.
	const count = await db.shoppingItem.count({ where: { listId: input.listId } });
	return db.shoppingItem.create({
		data: {
			listId: input.listId,
			name: input.name.trim(),
			plannedQty: input.plannedQty,
			plannedUnit: input.plannedUnit ?? 0n,
			position: count,
		},
	});
}

export async function updateItem(
	db: PrismaClient,
	userId: string,
	input: {
		id: string;
		name?: string;
		plannedQty?: number;
		plannedUnit?: bigint;
		bought?: boolean;
		purchasedQty?: number | null;
		purchasedUnit?: bigint | null;
	},
) {
	// Ownership is proven through the parent list's userId.
	const existing = await db.shoppingItem.findFirst({
		where: { id: input.id, list: { userId } },
	});
	if (!existing) throw itemNotFound();

	// Un-ticking "bought" clears the actuals so the row's difference disappears.
	const clearActuals = input.bought === false;

	return db.shoppingItem.update({
		where: { id: input.id },
		data: {
			...(input.name !== undefined && { name: input.name.trim() }),
			...(input.plannedQty !== undefined && { plannedQty: input.plannedQty }),
			...(input.plannedUnit !== undefined && { plannedUnit: input.plannedUnit }),
			...(input.bought !== undefined && { bought: input.bought }),
			...(clearActuals
				? { purchasedQty: null, purchasedUnit: null }
				: {
						...(input.purchasedQty !== undefined && {
							purchasedQty: input.purchasedQty,
						}),
						...(input.purchasedUnit !== undefined && {
							purchasedUnit: input.purchasedUnit,
						}),
					}),
		},
	});
}

export async function deleteItem(db: PrismaClient, userId: string, id: string) {
	const existing = await db.shoppingItem.findFirst({
		where: { id, list: { userId } },
	});
	if (!existing) throw itemNotFound();
	await db.shoppingItem.delete({ where: { id } });
	return { ok: true };
}
