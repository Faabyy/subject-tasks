/**
 * Parser for Markdown task lines.
 *
 * Pure functions only: no Obsidian imports, so everything here can be unit
 * tested without Obsidian running.
 */

/** `open` is `[ ]`, `done` is `[x]` or `[X]`, `other` is any custom status such as `[/]` or `[-]`. */
export type TaskStatus = 'open' | 'done' | 'other';

export interface ParsedTask {
	/** Zero-based line number in the file (same base as Obsidian's `ListItemCache`). */
	line: number;
	status: TaskStatus;
	/** The character between the brackets, for example `' '`, `'x'` or `'/'`. */
	statusChar: string;
	/** Task text without the checkbox and without the due-date token that was used. */
	text: string;
	/** Due date as `YYYY-MM-DD`, or `null`. A string sorts correctly and has no time zone. */
	due: string | null;
	/** The complete original line, so a later write-back can check the line did not change. */
	raw: string;
}

/** A task line before its position in the file is known. */
export type ParsedTaskLine = Omit<ParsedTask, 'line'>;

// indent, optional quote prefix (`>`, also nested and in callouts), list marker
// (`-`, `*`, `+`, or a number with `.` or `)`), then `[c]`, then whitespace or end of line.
// `- [ ]text` is not a task in Obsidian, so whitespace after `]` is required.
// The `u` flag makes `.` match a whole emoji instead of half of it.
const TASK_LINE = /^[ \t]*(?:>[ \t]*)*(?:[-*+]|\d{1,9}[.)])[ \t]+\[(.)\](?:[ \t]+(.*))?$/u;

// 📅, an optional emoji variation selector (U+FE0F), optional spaces, then a date.
// `(?!\d)` stops `2026-10-200` from being read as `2026-10-20`.
const DUE_TOKEN = /📅️?[ \t]*(\d{4})-(\d{2})-(\d{2})(?!\d)/gu;

// A code fence opens with three or more backticks or tildes.
// It may sit inside a quote or callout, so the same quote prefix is allowed.
const FENCE = /^[ \t]*(?:>[ \t]*)*(`{3,}|~{3,})(.*)$/;

/** True if year, month and day form a real calendar date (rejects 2026-02-30). */
function isRealDate(year: number, month: number, day: number): boolean {
	const d = new Date(Date.UTC(year, month - 1, day));
	return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/**
 * Finds the due date in a task text. With several valid `📅` dates the last one
 * counts, like in the Tasks plugin. Only that one is removed from the text, so
 * an earlier date or a typo stays visible.
 */
function extractDue(text: string): { due: string | null; text: string } {
	let found: { due: string; index: number; length: number } | null = null;

	for (const m of text.matchAll(DUE_TOKEN)) {
		const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
		if (isRealDate(year, month, day)) {
			found = { due: `${m[1]}-${m[2]}-${m[3]}`, index: m.index, length: m[0].length };
		}
	}

	if (!found) return { due: null, text };

	const before = text.slice(0, found.index).trimEnd();
	const after = text.slice(found.index + found.length).trimStart();
	return { due: found.due, text: `${before} ${after}`.trim() };
}

/** Parses one line. Returns `null` if the line is not a task. */
export function parseTaskLine(line: string): ParsedTaskLine | null {
	const match = TASK_LINE.exec(line);
	if (!match) return null;

	const statusChar = match[1] ?? ' ';
	const { due, text } = extractDue((match[2] ?? '').trim());

	let status: TaskStatus = 'other';
	if (statusChar === ' ') status = 'open';
	else if (statusChar === 'x' || statusChar === 'X') status = 'done';

	return { status, statusChar, text, due, raw: line };
}

/**
 * Returns the number of lines at the start of the file that belong to YAML
 * frontmatter (including both `---` lines), or 0 if there is none.
 */
function frontmatterLength(lines: string[]): number {
	if (lines[0]?.trimEnd() !== '---') return 0;
	for (let i = 1; i < lines.length; i++) {
		const l = lines[i]?.trimEnd();
		if (l === '---' || l === '...') return i + 1;
	}
	return 0; // never closed: Obsidian does not treat it as frontmatter either
}

/** Parses a whole file and returns its tasks in file order. */
export function parseTasks(content: string): ParsedTask[] {
	const lines = content.split(/\r?\n/);
	const tasks: ParsedTask[] = [];

	// Open fence: the character and the length of the opening run.
	let fence: { char: string; length: number } | null = null;

	for (let i = frontmatterLength(lines); i < lines.length; i++) {
		const line = lines[i] ?? '';
		const fenceMatch = FENCE.exec(line);

		if (fence) {
			// A closing fence uses the same character, is at least as long, and has nothing else on the line.
			const run = fenceMatch?.[1];
			if (run && run.startsWith(fence.char) && run.length >= fence.length && fenceMatch[2]?.trim() === '') {
				fence = null;
			}
			continue;
		}

		if (fenceMatch) {
			const run = fenceMatch[1] ?? '';
			const info = fenceMatch[2] ?? '';
			// An opening backtick fence may not have backticks in its info string,
			// so "```code```" on one line is inline code and not a fence.
			if (!(run.startsWith('`') && info.includes('`'))) {
				fence = { char: run.charAt(0), length: run.length };
				continue;
			}
		}

		const task = parseTaskLine(line);
		if (task) tasks.push({ line: i, ...task });
	}

	return tasks;
}
