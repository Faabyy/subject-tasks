import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			// Measure every source file, also those no test imports, so the total is honest.
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.test.ts', 'src/model/testHelpers.ts', 'src/model/types.ts'],
			reporter: ['text', 'json-summary'],
			// Minimums only for the pure modules. The code that talks to Obsidian (view, index,
			// settings tab, main.ts) cannot be unit tested without Obsidian and is checked by hand.
			thresholds: {
				'src/parser/**': { lines: 100, functions: 100, branches: 85 },
				'src/model/**': { lines: 100, functions: 100, branches: 85 },
				'src/settings/normalizeSettings.ts': { lines: 100, functions: 100, branches: 85 },
			},
		},
	},
});
