import axios from "axios";

/**
 * Extracts a human-readable message from an API error.
 *
 * The NestJS backend returns either a string message or an array of
 * validation messages under `response.data.message`, e.g.
 * `{ "message": ["amount must be a positive number"], "error": "Bad Request" }`.
 */
export const getErrorMessage = (error: unknown, fallback: string): string => {
	if (axios.isAxiosError(error)) {
		const data = error.response?.data as
			| { message?: string | string[]; error?: string }
			| undefined;

		const message = data?.message ?? data?.error;

		if (Array.isArray(message) && message.length > 0) {
			return message.join(", ");
		}
		if (typeof message === "string" && message.trim()) {
			return message;
		}
		// No response at all usually means the network/server is unreachable.
		if (!error.response) {
			return "Can't reach the server. Check your connection and try again.";
		}
	}

	return fallback;
};
