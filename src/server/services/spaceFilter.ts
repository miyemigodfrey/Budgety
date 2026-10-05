import type { Prisma } from "@prisma/client";

/**
 * Where-fragments that scope reads to the active space. A missing spaceId means
 * the "All" view (no space filter). Transactions are scoped through their
 * source's space — safe because transfers are walled to a single space, so both
 * legs of any transaction share one space.
 */
export const sourceWhere = (
	userId: string,
	spaceId?: string,
): Prisma.SourceWhereInput => ({
	userId,
	...(spaceId ? { spaceId } : {}),
});

export const txWhere = (
	userId: string,
	spaceId?: string,
): Prisma.TransactionWhereInput => ({
	userId,
	...(spaceId ? { source: { spaceId } } : {}),
});
