import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";

/** Lists a user's spaces with a source count, default space first then newest. */
export async function listSpaces(db: PrismaClient, userId: string) {
	const spaces = await db.space.findMany({
		where: { userId },
		orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
		include: { _count: { select: { sources: true } } },
	});
	return spaces.map((s) => ({
		id: s.id,
		name: s.name,
		isDefault: s.isDefault,
		sourceCount: s._count.sources,
		createdAt: s.createdAt,
	}));
}

export async function createSpace(
	db: PrismaClient,
	userId: string,
	name: string,
) {
	const trimmed = name.trim();
	if (!trimmed) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Space name is required" });
	}
	const dupe = await db.space.findFirst({
		where: { userId, name: { equals: trimmed, mode: "insensitive" } },
	});
	if (dupe) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "A space with this name already exists",
		});
	}
	return db.space.create({ data: { userId, name: trimmed } });
}

export async function renameSpace(
	db: PrismaClient,
	userId: string,
	id: string,
	name: string,
) {
	const trimmed = name.trim();
	if (!trimmed) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Space name is required" });
	}
	const space = await db.space.findFirst({ where: { id, userId } });
	if (!space) throw new TRPCError({ code: "NOT_FOUND", message: "Space not found" });

	const dupe = await db.space.findFirst({
		where: {
			userId,
			name: { equals: trimmed, mode: "insensitive" },
			id: { not: id },
		},
	});
	if (dupe) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "A space with this name already exists",
		});
	}
	return db.space.update({ where: { id }, data: { name: trimmed } });
}

export async function deleteSpace(db: PrismaClient, userId: string, id: string) {
	const space = await db.space.findFirst({
		where: { id, userId },
		include: { _count: { select: { sources: true } } },
	});
	if (!space) throw new TRPCError({ code: "NOT_FOUND", message: "Space not found" });

	if (space._count.sources > 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"This space still has sources. Delete its sources first, then delete the space.",
		});
	}

	const total = await db.space.count({ where: { userId } });
	if (total <= 1) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "You can't delete your only space.",
		});
	}

	await db.space.delete({ where: { id } });
	return { message: "Space deleted" };
}

/**
 * Resolves a space filter for the read services. Returns undefined for the
 * "All" view (no filter) or when spaceId is absent; otherwise validates the
 * space belongs to the user and returns it.
 */
export async function assertSpace(
	db: PrismaClient,
	userId: string,
	spaceId: string | undefined,
): Promise<string | undefined> {
	if (!spaceId) return undefined;
	const space = await db.space.findFirst({ where: { id: spaceId, userId } });
	if (!space) throw new TRPCError({ code: "NOT_FOUND", message: "Space not found" });
	return spaceId;
}
