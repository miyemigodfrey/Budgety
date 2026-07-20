import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		// Fast unit tests by default. Integration tests (*.integration.test.ts)
		// need a real Postgres and are run separately via `npm run test:db`, which
		// sets INTEGRATION=1. The legacy backend/ bun:test specs are out of scope.
		include: process.env.INTEGRATION
			? ["src/**/*.integration.test.ts"]
			: ["src/**/*.test.ts", "src/**/*.test.tsx"],
		exclude: process.env.INTEGRATION
			? []
			: ["**/*.integration.test.ts", "**/node_modules/**"],
	},
});
