import { describe, expect, it } from 'vitest';
import { parseTasks } from '../parser/taskParser';
import type { ParsedTask } from '../parser/taskParser';
import { toggleTaskInContent } from './toggleTask';

/** Finds a task in the text the way the index would, and returns what the view keeps of it. */
function target(content: string, text: string): ParsedTask {
	const task = parseTasks(content).find((t) => t.text === text);
	if (!task) throw new Error(`no task "${text}" in test content`);
	return task;
}

function toggled(content: string, text: string): string {
	const result = toggleTaskInContent(content, target(content, text));
	if (!result.ok) throw new Error(`refused: ${result.reason}`);
	return result.content;
}

describe('toggleTaskInContent: ticking and unticking', () => {
	it('ticks an open task', () => {
		expect(toggled('- [ ] Read', 'Read')).toBe('- [x] Read');
	});

	it('unticks a done task', () => {
		expect(toggled('- [x] Read', 'Read')).toBe('- [ ] Read');
	});

	it('unticks a task written with a capital X', () => {
		expect(toggled('- [X] Read', 'Read')).toBe('- [ ] Read');
	});

	it('reports the new status', () => {
		const open = parseTasks('- [ ] A')[0]!;
		const done = parseTasks('- [x] A')[0]!;
		expect(toggleTaskInContent('- [ ] A', open)).toMatchObject({ ok: true, status: 'done' });
		expect(toggleTaskInContent('- [x] A', done)).toMatchObject({ ok: true, status: 'open' });
	});

	it('ticking twice gives the original text back', () => {
		const original = '# Title\n\n- [ ] One 📅 2026-10-20\n- [x] Two\n';
		const once = toggled(original, 'One');
		const task = parseTasks(once).find((t) => t.text === 'One')!;
		const twice = toggleTaskInContent(once, task);
		expect(twice).toMatchObject({ ok: true, content: original });
	});

	it.each([
		['- [ ] Task', '- [x] Task'],
		['* [ ] Task', '* [x] Task'],
		['+ [ ] Task', '+ [x] Task'],
		['1. [ ] Task', '1. [x] Task'],
		['12) [ ] Task', '12) [x] Task'],
		['    - [ ] Task', '    - [x] Task'],
		['\t\t- [ ] Task', '\t\t- [x] Task'],
		['> - [ ] Task', '> - [x] Task'],
		['> > 1. [ ] Task', '> > 1. [x] Task'],
	])('changes only the box in %j', (line, expected) => {
		expect(toggled(line, 'Task')).toBe(expected);
	});

	it('keeps text, date, brackets and special characters untouched', () => {
		const line = '- [ ] Übung [a] **fett** [[Link|Alias]] #tag 📅 2026-10-20 [ ]';
		expect(toggled(line, 'Übung [a] **fett** [[Link|Alias]] #tag [ ]')).toBe(line.replace('[ ]', '[x]'));
	});
});

describe('toggleTaskInContent: the rest of the note stays as it was', () => {
	const note = '---\ntags: [a]\n---\n\n# Title\n\n- [ ] First\n- [ ] Second\n    - [ ] Third\n\nText after.\n';

	it('changes exactly one character', () => {
		const result = toggled(note, 'Second');
		expect(result).toHaveLength(note.length);
		const differing = [...note].filter((char, i) => char !== result[i]);
		expect(differing).toEqual([' ']);
	});

	it('touches only the clicked line', () => {
		const before = note.split('\n');
		const after = toggled(note, 'Second').split('\n');
		const changedLines = after.flatMap((line, i) => (line !== before[i] ? [i] : []));
		expect(changedLines).toEqual([7]);
	});

	it('keeps the final newline and blank lines', () => {
		expect(toggled(note, 'First').endsWith('Text after.\n')).toBe(true);
		expect(toggled('- [ ] A', 'A').endsWith('\n')).toBe(false);
	});

	it('works on every task in the note one after the other', () => {
		let content = note;
		for (const text of ['First', 'Second', 'Third']) content = toggled(content, text);
		expect(content).toBe(note.replace(/\[ \]/g, '[x]'));
	});
});

describe('toggleTaskInContent: line endings', () => {
	it('keeps Windows line endings everywhere', () => {
		const note = '# T\r\n- [ ] One\r\n- [ ] Two\r\n';
		expect(toggled(note, 'Two')).toBe('# T\r\n- [ ] One\r\n- [x] Two\r\n');
	});

	it('keeps Windows line endings when the last line has no newline', () => {
		expect(toggled('- [ ] One\r\n- [ ] Two', 'Two')).toBe('- [ ] One\r\n- [x] Two');
	});
});

describe('toggleTaskInContent: refuses if the note changed', () => {
	const original = '# Title\n- [ ] Read chapter\n- [ ] Write essay\n';
	const read = target(original, 'Read chapter');

	it('refuses if the text of the line was edited', () => {
		const edited = '# Title\n- [ ] Read chapter 3\n- [ ] Write essay\n';
		expect(toggleTaskInContent(edited, read)).toEqual({ ok: false, reason: 'changed' });
	});

	it('refuses if the date of the task was edited', () => {
		const edited = '# Title\n- [ ] Read chapter 📅 2026-10-20\n- [ ] Write essay\n';
		expect(toggleTaskInContent(edited, read)).toEqual({ ok: false, reason: 'changed' });
	});

	it('refuses if the task was already ticked by someone else', () => {
		const edited = '# Title\n- [x] Read chapter\n- [ ] Write essay\n';
		expect(toggleTaskInContent(edited, read)).toEqual({ ok: false, reason: 'changed' });
	});

	it('refuses if lines were added above, even though the task still exists', () => {
		const moved = 'New line\n# Title\n- [ ] Read chapter\n- [ ] Write essay\n';
		expect(toggleTaskInContent(moved, read)).toEqual({ ok: false, reason: 'changed' });
	});

	it('refuses if lines were removed above', () => {
		expect(toggleTaskInContent('- [ ] Read chapter\n- [ ] Write essay\n', read)).toEqual({ ok: false, reason: 'changed' });
	});

	it('refuses if the line is gone and the note is shorter', () => {
		expect(toggleTaskInContent('# Title\n', read)).toEqual({ ok: false, reason: 'changed' });
		expect(toggleTaskInContent('', read)).toEqual({ ok: false, reason: 'changed' });
	});

	it('refuses if the line is now blank', () => {
		expect(toggleTaskInContent('# Title\n\n- [ ] Write essay\n', read)).toEqual({ ok: false, reason: 'changed' });
	});

	it('refuses if the line is no longer a task', () => {
		expect(toggleTaskInContent('# Title\n- Read chapter\n', read)).toEqual({ ok: false, reason: 'changed' });
	});

	it('refuses if the line is now inside a code block', () => {
		const wrapped = '```\n- [ ] Read chapter\n```\n';
		const task = { line: 1, raw: '- [ ] Read chapter', status: 'open' as const };
		expect(toggleTaskInContent(wrapped, task)).toEqual({ ok: false, reason: 'changed' });
	});

	it('refuses if the line is now inside frontmatter', () => {
		const wrapped = '---\n- [ ] Read chapter\n---\n';
		const task = { line: 1, raw: '- [ ] Read chapter', status: 'open' as const };
		expect(toggleTaskInContent(wrapped, task)).toEqual({ ok: false, reason: 'changed' });
	});

	it('refuses if the list still shows an open task but the line is done', () => {
		const stale = { line: 1, raw: '- [x] Read chapter', status: 'open' as const };
		expect(toggleTaskInContent('# Title\n- [x] Read chapter\n', stale)).toEqual({ ok: false, reason: 'changed' });
	});

	it('does not return any content when it refuses', () => {
		const result = toggleTaskInContent('# Title\n', read);
		expect(result).not.toHaveProperty('content');
	});
});

describe('toggleTaskInContent: identical lines', () => {
	const note = '- [ ] Same\n- [ ] Same\n- [ ] Same\n';

	it('toggles only the line at the expected position', () => {
		const second = parseTasks(note)[1]!;
		const result = toggleTaskInContent(note, second);
		expect(result).toMatchObject({ ok: true, content: '- [ ] Same\n- [x] Same\n- [ ] Same\n' });
	});

	it('does not jump to another identical line if the position is wrong', () => {
		const stale = { line: 5, raw: '- [ ] Same', status: 'open' as const };
		expect(toggleTaskInContent(note, stale)).toEqual({ ok: false, reason: 'changed' });
	});
});

describe('toggleTaskInContent: custom statuses', () => {
	it.each(['/', '-', '>', '!'])('does not touch a task with the status [%s]', (char) => {
		const content = `- [${char}] Task`;
		const task = parseTasks(content)[0]!;
		expect(toggleTaskInContent(content, task)).toEqual({ ok: false, reason: 'unsupported-status' });
	});
});
