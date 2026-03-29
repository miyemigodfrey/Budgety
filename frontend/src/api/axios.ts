import axios from "axios";

const api = axios.create({
	baseURL: "http://localhost:3000",
	headers: {
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

let onUnauthorized: (() => void) | null = null;

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
