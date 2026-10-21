import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const notFound = () =>
	new TRPCError({ code: "NOT_FOUND", message: "User not found" });

/** Profile + lock state for the current user. Never returns the PIN hash. */
export async function getMe(db: PrismaClient, userId: string) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { name: true, email: true, createdAt: true, pin: true },
	});
	if (!user) throw notFound();
	return {
		name: user.name,
		email: user.email,
		createdAt: user.createdAt,
		hasPin: user.pin !== null,
	};
}

export async function updateName(
	db: PrismaClient,
	userId: string,
	name: string,
) {
	const user = await db.user.update({
		where: { id: userId },
		data: { name: name.trim() },
		select: { name: true },
	});
	return { name: user.name };
}

/** Hash and store a 4-digit PIN (the schema already enforces the shape). */
export async function setPin(db: PrismaClient, userId: string, pin: string) {
	const hash = await bcrypt.hash(pin, 10);
	await db.user.update({ where: { id: userId }, data: { pin: hash } });
	return { ok: true };
}

/** Compare a candidate PIN against the stored hash. */
export async function verifyPin(db: PrismaClient, userId: string, pin: string) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { pin: true },
	});
	if (!user?.pin) return { ok: false };
	const ok = await bcrypt.compare(pin, user.pin);
	return { ok };
}

/**
 * Remove the PIN and turn App Lock off — you can't lock the app without a PIN,
 * so the two must change together.
 */
export async function removePin(db: PrismaClient, userId: string) {
	await db.$transaction([
		db.user.update({ where: { id: userId }, data: { pin: null } }),
		db.userSettings.upsert({
			where: { userId },
			update: { appLockEnabled: false },
			create: { userId, appLockEnabled: false },
		}),
	]);
	return { ok: true };
}
