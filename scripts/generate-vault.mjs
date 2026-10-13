/**
 * Generates a large fake vault for measuring the index.
 *
 * Usage: node scripts/generate-vault.mjs <target-folder> [note-count]
 *
 * The target folder must not exist yet or must be empty, so this can never
 * overwrite real notes. The content is random but seeded, so every run
 * produces the same vault.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const target = process.argv[2];
const count = Number(process.argv[3] ?? 2000);

if (!target || !Number.isInteger(count) || count < 1) {
	console.error('Usage: node scripts/generate-vault.mjs <target-folder> [note-count]');
	process.exit(1);
}
if (existsSync(target) && readdirSync(target).length > 0) {
	console.error(`Refusing to write into ${target}: the folder is not empty.`);
	process.exit(1);
}

// Small seeded random number generator (mulberry32), so runs are reproducible.
let seed = 12345;
function random() {
	seed = (seed + 0x6d2b79f5) | 0;
	let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (list) => list[Math.floor(random() * list.length)];
const between = (min, max) => min + Math.floor(random() * (max - min + 1));

const subjects = ['Mathe', 'Deutsch', 'Englisch', 'Informatik', 'Geschichte', 'Physik', 'Chemie', 'Biologie', 'Politik', 'Kunst', 'Sport', 'Religion'];
const topics = ['Grundlagen', 'Wiederholung', 'Hausaufgaben', 'Projekt', 'Klausur', 'Referat', 'Übung', 'Zusammenfassung'];
const words = ['Aufgabe', 'Text', 'Kapitel', 'Formel', 'Notizen', 'Vokabeln', 'Skizze', 'Beispiel', 'Gedicht', 'Versuch'];

function date() {
	const day = between(1, 28);
	return `2026-${String(between(9, 12)).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function taskLine(indent) {
	const marker = pick(['-', '-', '-', '*', '+']);
	const status = pick([' ', ' ', ' ', 'x', 'X', '/']);
	const text = `${pick(words)} ${between(1, 99)} ${pick(words).toLowerCase()}`;
	const due = random() < 0.5 ? ` 📅 ${date()}` : '';
	return `${'    '.repeat(indent)}${marker} [${status}] ${text}${due}`;
}

function note(index) {
	const lines = [];
	if (random() < 0.2) lines.push('---', 'tags: [schule]', '---', '');
	lines.push(`# Notiz ${index}`, '');

	// About a third of the notes have no tasks at all, like a normal vault.
	const taskCount = random() < 0.33 ? 0 : between(1, 8);
	for (let i = 0; i < between(2, 12); i++) lines.push(`${pick(words)} ${pick(words).toLowerCase()} ${between(1, 999)}. Ein Satz zum Auffüllen der Notiz.`);
	lines.push('');
	// A task indented by 4 spaces is only a nested task below another task; at the start of a list it would be an indented code block.
	for (let i = 0; i < taskCount; i++) lines.push(taskLine(i > 0 && random() < 0.25 ? 1 : 0));
	if (random() < 0.1) lines.push('', '```md', '- [ ] Aufgabe im Codeblock', '```');
	return lines.join('\n') + '\n';
}

for (let i = 0; i < count; i++) {
	const folder = join(target, pick(subjects), pick(topics), ...(random() < 0.3 ? [`Woche ${between(1, 12)}`] : []));
	const file = join(folder, `Notiz ${i}.md`);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, note(i));
}

console.log(`Wrote ${count} notes to ${target}`);
