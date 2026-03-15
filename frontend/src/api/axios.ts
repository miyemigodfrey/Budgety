import axios from "axios";

/**
 * Centralized Axios instance for all API calls.
 *
 * Every file that imports `api` from this module will automatically:
 *   1. Send requests to the backend base URL.
 *   2. Include the Bearer token in the Authorization header (if logged in).
 *   3. Handle 401 (Unauthorized) responses globally by triggering a logout.
 */
const api = axios.create({
	baseURL: "http://localhost:3000",
	headers: {
		"Content-Type": "application/json",
	},
});

/**
 * REQUEST INTERCEPTOR — Attach Bearer Token
 *
 * Before every outgoing request, this interceptor reads the JWT token
 * from localStorage and attaches it as an `Authorization: Bearer <token>`
 * header. This ensures all protected backend endpoints receive the token
 * without manually adding it in each API call.
 *
 * If no token exists (user not logged in), the request is sent without
 * the Authorization header — the backend will return 401 for protected routes.
 */
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

/**
 * RESPONSE INTERCEPTOR — Handle 401 Unauthorized
 *
 * `onUnauthorized` is a callback registered by AuthProvider (via `setOnUnauthorized`).
 * When any API response returns a 401 status (expired/invalid token), this interceptor
 * invokes the callback which clears the auth state (token + user) from both
 * React state and localStorage, effectively logging the user out.
 *
 * The error is still re-thrown so individual API calls can handle it if needed.
 */
let onUnauthorized: (() => void) | null = null;

/**
 * Called by AuthProvider on mount to register the logout function.
 * This bridges the gap between the Axios module (no access to React state)
 * and the AuthProvider (owns the auth state).
 */
export function setOnUnauthorized(callback: () => void) {
	onUnauthorized = callback;
}

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			onUnauthorized?.();
		}
		return Promise.reject(error);
	},
);

export default api;
