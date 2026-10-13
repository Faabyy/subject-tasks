/**
 * Reads every .md file in a folder, parses it with the real task parser and
 * prints how many tasks were found and how long it took.
 *
 * This runs in Node, outside Obsidian. It measures file reading and parsing
 * only, not Obsidian's metadata cache or the index itself.
 *
 * Usage: node scripts/scan-folder.ts <folder> [--files]
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseTasks } from '../src/parser/taskParser.ts';

const folder = process.argv[2];
const showFiles = process.argv.includes('--files');

if (!folder) {
	console.error('Usage: node scripts/scan-folder.ts <folder> [--files]');
	process.exit(1);
}

function* markdownFiles(dir: string): Generator<string> {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name.startsWith('.')) continue;
		const full = join(dir, entry.name);
		if (entry.isDirectory()) yield* markdownFiles(full);
		else if (entry.name.endsWith('.md')) yield full;
	}
}

const files = [...markdownFiles(folder)].sort();

const startedAt = performance.now();
let tasks = 0;
let notesWithTasks = 0;
const perFile: [string, number, number, number][] = [];

for (const file of files) {
	const found = parseTasks(readFileSync(file, 'utf8'));
	if (found.length > 0) notesWithTasks++;
	tasks += found.length;
	perFile.push([
		relative(folder, file),
		found.filter((t) => t.status === 'open').length,
		found.filter((t) => t.status === 'done').length,
		found.filter((t) => t.status === 'other').length,
	]);
}

const ms = performance.now() - startedAt;

if (showFiles) {
	console.log('open done other  note');
	for (const [name, open, done, other] of perFile) {
		console.log(`${String(open).padStart(4)} ${String(done).padStart(4)} ${String(other).padStart(5)}  ${name}`);
	}
}

console.log(`${files.length} notes, ${notesWithTasks} with tasks, ${tasks} tasks, read and parsed in ${ms.toFixed(0)} ms`);
