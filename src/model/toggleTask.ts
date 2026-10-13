import { parseTaskLine, parseTasks } from '../parser/taskParser';
import type { ParsedTask } from '../parser/taskParser';

/** What we know about the task the user clicked, as it was when the list was drawn. */
export type ToggleTarget = Pick<ParsedTask, 'line' | 'raw' | 'status'>;

export type ToggleRefusal =
	/** The line is not what the list showed: it was edited, moved, or is no longer a task. */
	| 'changed'
	/** Only open and done tasks can be ticked. Custom statuses such as `[/]` are left alone. */
	| 'unsupported-status';

export type ToggleResult =
	| { ok: true; content: string; status: 'open' | 'done' }
	| { ok: false; reason: ToggleRefusal };

const changed: ToggleResult = { ok: false, reason: 'changed' };

/**
 * Ticks an open task or unticks a done task in the text of a note.
 *
 * The note may have changed since the list was drawn, so nothing is written
 * unless the line at the expected position is exactly the line the list
 * showed. A task that moved is not searched for: an unchanged note is the only
 * case where we are sure to hit the right line.
 *
 * Only the character between the brackets changes (`[ ]` and `[x]`). All other
 * lines and line endings stay byte for byte as they were.
 */
export function toggleTaskInContent(content: string, target: ToggleTarget): ToggleResult {
	if (target.status === 'other') return { ok: false, reason: 'unsupported-status' };

	// Split on \n only, so a \r stays at the end of its line and Windows line endings survive.
	const lines = content.split('\n');
	const current = lines[target.line];
	if (current === undefined) return changed;

	const hasCarriageReturn = current.endsWith('\r');
	const text = hasCarriageReturn ? current.slice(0, -1) : current;
	if (text !== target.raw) return changed;

	// Same text at the same place is not enough if the context changed, for example
	// when the line now sits inside a code block or in frontmatter.
	const stillATask = parseTasks(content).some((task) => task.line === target.line && task.raw === target.raw);
	if (!stillATask) return changed;

	const parsed = parseTaskLine(text);
	if (!parsed || parsed.status !== target.status) return changed;

	// Only whitespace, `>`, a list marker and digits can come before the checkbox,
	// so the first `[` in the line is the checkbox bracket.
	const bracket = text.indexOf('[');
	const newChar = parsed.status === 'open' ? 'x' : ' ';
	const newText = `${text.slice(0, bracket + 1)}${newChar}${text.slice(bracket + 2)}`;

	lines[target.line] = hasCarriageReturn ? `${newText}\r` : newText;
	return { ok: true, content: lines.join('\n'), status: parsed.status === 'open' ? 'done' : 'open' };
}
