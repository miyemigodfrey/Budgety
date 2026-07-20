import { TRPCError } from "@trpc/server";
import type { CategoryType, PrismaClient } from "@prisma/client";

export function listCategories(db: PrismaClient, userId: string) {
	return db.category.findMany({ where: { userId } });
}

export async function createCategory(
	db: PrismaClient,
	userId: string,
	input: { name: string; type: CategoryType },
) {
	// Case-insensitive duplicate check on (name, type) — a plain unique
	// constraint can't express this, so it stays in the service.
	const existing = await db.category.findFirst({
		where: {
			userId,
			type: input.type,
			name: { equals: input.name, mode: "insensitive" },
		},
	});
	if (existing) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Category with this name and type already exists",
		});
	}
	return db.category.create({ data: { userId, ...input } });
}

export async function updateCategory(
	db: PrismaClient,
	userId: string,
	input: { id: string; name?: string; type?: CategoryType },
) {
	const existing = await db.category.findFirst({
		where: { id: input.id, userId },
	});
	if (!existing) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
	}
	return db.category.update({
		where: { id: input.id },
		data: {
			...(input.name !== undefined && { name: input.name }),
			...(input.type !== undefined && { type: input.type }),
		},
	});
}

export async function deleteCategory(
	db: PrismaClient,
	userId: string,
	id: string,
) {
	const existing = await db.category.findFirst({ where: { id, userId } });
	if (!existing) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
	}
	await db.category.delete({ where: { id } });
	return { message: "Category deleted" };
}
