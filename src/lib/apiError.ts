import { TRPCClientError } from "@trpc/client";

/**
 * Extracts a human-readable message from a tRPC client error.
 *
 * tRPC surfaces the server's thrown message directly on `error.message`
 * (e.g. `Insufficient balance in "Cash". Available: 500`), so there is no
 * envelope to unwrap the way the old axios layer needed.
 */
export const getErrorMessage = (error: unknown, fallback: string): string => {
	if (error instanceof TRPCClientError) {
		if (error.message?.trim()) return error.message;
	}
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}
	return fallback;
};
