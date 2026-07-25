import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

// Load .env into process.env so the integration suite (test:db) can reach the
// database. Vitest forwards process.env to its workers.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		// Fast unit tests by default. Integration tests (*.integration.test.ts)
		// need a real Postgres and are run separately via `npm run test:db`, which
		// sets INTEGRATION=1.
		include: process.env.INTEGRATION
			? ["src/**/*.integration.test.ts"]
			: ["src/**/*.test.ts", "src/**/*.test.tsx"],
		exclude: process.env.INTEGRATION
			? []
			: ["**/*.integration.test.ts", "**/node_modules/**"],
		// Integration tests make many round-trips to a remote database; the 5s
		// default is not enough over network latency.
		...(process.env.INTEGRATION
			? { testTimeout: 30000, hookTimeout: 30000 }
			: {}),
	},
});
