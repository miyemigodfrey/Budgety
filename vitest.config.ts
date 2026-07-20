import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Only the Next app's tests. The legacy backend/ has bun:test specs that
		// this runner can't load, and is deleted at the end of the migration.
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
	},
});
