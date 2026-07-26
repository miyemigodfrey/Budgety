import type { PrismaClient } from "@prisma/client";
import { DEFAULT_SETTINGS } from "@/server/constants";

/**
 * Pure read. The row is created at registration, so this no longer writes on
 * read (the NestJS version lazily inserted defaults). The fallback covers
 * seeded/legacy users without a row.
 */
export async function getSettings(db: PrismaClient, userId: string) {
	const settings = await db.userSettings.findUnique({ where: { userId } });
	return settings ?? { userId, ...DEFAULT_SETTINGS, updatedAt: new Date() };
}

export async function updateSettings(
	db: PrismaClient,
	userId: string,
	input: {
		dailyReminder?: boolean;
		appLockEnabled?: boolean;
		darkMode?: boolean;
		backupEnabled?: boolean;
	},
) {
	return db.userSettings.upsert({
		where: { userId },
		update: input,
		create: { userId, ...DEFAULT_SETTINGS, ...input },
	});
}
