/**
 * Prints the test coverage as Markdown, split into the pure modules (what the
 * unit tests are meant to cover) and everything in src (including the code
 * that needs Obsidian and is checked by hand).
 *
 * Usage: npm run test:coverage && node scripts/coverage-summary.mjs
 */
import { readFileSync } from 'node:fs';

const summary = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8'));

const isPure = (path) => /\/src\/(parser|model)\//.test(path) || path.endsWith('/src/settings/normalizeSettings.ts');

function sum(filter) {
	const total = { lines: [0, 0], branches: [0, 0], functions: [0, 0] };
	for (const [path, data] of Object.entries(summary)) {
		if (path === 'total' || !filter(path)) continue;
		for (const key of Object.keys(total)) {
			total[key][0] += data[key].covered;
			total[key][1] += data[key].total;
		}
	}
	return total;
}

const percent = ([covered, total]) => (total === 0 ? '-' : `${((covered / total) * 100).toFixed(1)}% (${covered}/${total})`);
const row = (label, t) => `| ${label} | ${percent(t.lines)} | ${percent(t.branches)} | ${percent(t.functions)} |`;

console.log('## Test coverage');
console.log('');
console.log('| | Lines | Branches | Functions |');
console.log('| --- | --- | --- | --- |');
console.log(row('Pure modules (parser, model, settings logic)', sum(isPure)));
console.log(row('Everything in src', sum(() => true)));
console.log('');
console.log('The code that talks to Obsidian (view, index, settings tab, main) is not unit tested and is checked by hand.');
