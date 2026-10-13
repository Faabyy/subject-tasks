import { describe, expect, it } from 'vitest';
import { parseTaskLine, parseTasks } from './taskParser';

describe('parseTaskLine: checkbox and status', () => {
	it('reads an open task', () => {
		expect(parseTaskLine('- [ ] Read chapter 3')).toEqual({
			status: 'open',
			statusChar: ' ',
			text: 'Read chapter 3',
			due: null,
			raw: '- [ ] Read chapter 3',
		});
	});

	it('reads a done task with lowercase x', () => {
		expect(parseTaskLine('- [x] Done')?.status).toBe('done');
	});

	it('reads a done task with uppercase X', () => {
		const task = parseTaskLine('- [X] Done');
		expect(task?.status).toBe('done');
		expect(task?.statusChar).toBe('X');
	});

	it.each(['/', '-', '>', '!', '✅'])('treats custom status %s as other', (char) => {
		const task = parseTaskLine(`- [${char}] Custom`);
		expect(task?.status).toBe('other');
		expect(task?.statusChar).toBe(char);
	});

	it.each(['-', '*', '+'])('accepts the list marker %s', (marker) => {
		expect(parseTaskLine(`${marker} [ ] Task`)?.text).toBe('Task');
	});

	it('accepts an empty task text', () => {
		expect(parseTaskLine('- [ ]')?.text).toBe('');
		expect(parseTaskLine('- [ ]   ')?.text).toBe('');
	});

	it('trims whitespace around the text', () => {
		expect(parseTaskLine('- [ ]    spaced out   ')?.text).toBe('spaced out');
	});
});

describe('parseTaskLine: lines that are not tasks', () => {
	it.each([
		['plain text', 'Just a sentence'],
		['plain list item', '- Not a task'],
		['empty line', ''],
		['no space after the bracket', '- [ ]text'],
		['no space after the marker', '-[ ] Task'],
		['two characters in the box', '- [xx] Task'],
		['empty box', '- [] Task'],
		['numbered list', '1. [ ] Task'],
		['marker missing', '[ ] Task'],
		['heading', '# [ ] Task'],
		['link that looks like a box', '- [link](http://example.com)'],
	])('%s', (_name, line) => {
		expect(parseTaskLine(line)).toBeNull();
	});
});

describe('parseTaskLine: nesting and indentation', () => {
	it('accepts spaces', () => {
		expect(parseTaskLine('    - [ ] Nested')?.text).toBe('Nested');
	});

	it('accepts tabs', () => {
		expect(parseTaskLine('\t\t- [ ] Nested')?.text).toBe('Nested');
	});

	it('keeps the original line in raw, including indentation', () => {
		expect(parseTaskLine('  * [x] Item')?.raw).toBe('  * [x] Item');
	});
});

describe('parseTaskLine: due date', () => {
	it('reads a date and removes it from the text', () => {
		const task = parseTaskLine('- [ ] Hand in report 📅 2026-10-20');
		expect(task?.due).toBe('2026-10-20');
		expect(task?.text).toBe('Hand in report');
	});

	it('reads a date in the middle of the text', () => {
		const task = parseTaskLine('- [ ] Hand in 📅 2026-10-20 the report');
		expect(task?.due).toBe('2026-10-20');
		expect(task?.text).toBe('Hand in the report');
	});

	it('reads a date at the start of the text', () => {
		const task = parseTaskLine('- [ ] 📅 2026-10-20 Report');
		expect(task?.due).toBe('2026-10-20');
		expect(task?.text).toBe('Report');
	});

	it('accepts the emoji with a variation selector', () => {
		expect(parseTaskLine('- [ ] Task 📅️ 2026-10-20')?.due).toBe('2026-10-20');
	});

	it('accepts no space between emoji and date', () => {
		expect(parseTaskLine('- [ ] Task 📅2026-10-20')?.due).toBe('2026-10-20');
	});

	it('accepts a leap day in a leap year', () => {
		expect(parseTaskLine('- [ ] Task 📅 2028-02-29')?.due).toBe('2028-02-29');
	});

	it.each([
		['impossible day', '2026-02-30'],
		['leap day in a normal year', '2026-02-29'],
		['month 13', '2026-13-01'],
		['month 0', '2026-00-10'],
		['day 0', '2026-10-00'],
		['day 32', '2026-10-32'],
	])('ignores an invalid date: %s', (_name, date) => {
		const task = parseTaskLine(`- [ ] Task 📅 ${date}`);
		expect(task?.due).toBeNull();
		// The text keeps the broken date, so the typo stays visible.
		expect(task?.text).toBe(`Task 📅 ${date}`);
	});

	it('ignores a date with extra digits', () => {
		expect(parseTaskLine('- [ ] Task 📅 2026-10-200')?.due).toBeNull();
	});

	it('ignores a date without the emoji', () => {
		const task = parseTaskLine('- [ ] Task due 2026-10-20');
		expect(task?.due).toBeNull();
		expect(task?.text).toBe('Task due 2026-10-20');
	});

	it('ignores other date emoji such as scheduled and done', () => {
		expect(parseTaskLine('- [ ] Task ⏳ 2026-10-20 ✅ 2026-10-21')?.due).toBeNull();
	});

	it('ignores dates in other formats', () => {
		expect(parseTaskLine('- [ ] Task 📅 20.10.2026')?.due).toBeNull();
	});

	it('uses the last valid date when there are several', () => {
		const task = parseTaskLine('- [ ] Task 📅 2026-10-20 📅 2026-11-05');
		expect(task?.due).toBe('2026-11-05');
		// Only the used date is removed.
		expect(task?.text).toBe('Task 📅 2026-10-20');
	});

	it('skips an invalid date and uses the valid one', () => {
		const task = parseTaskLine('- [ ] Task 📅 2026-10-20 📅 2026-02-30');
		expect(task?.due).toBe('2026-10-20');
		expect(task?.text).toBe('Task 📅 2026-02-30');
	});

	it('works on done tasks too', () => {
		expect(parseTaskLine('- [x] Task 📅 2026-10-20')?.due).toBe('2026-10-20');
	});
});

describe('parseTaskLine: special characters', () => {
	it('keeps Markdown, links and punctuation', () => {
		const text = 'Read **bold**, [[Note|alias]] & `code` (see p. 4)!';
		expect(parseTaskLine(`- [ ] ${text}`)?.text).toBe(text);
	});

	it('keeps umlauts, emoji and other scripts', () => {
		const text = 'Übung für Mathe 🎓 数学';
		expect(parseTaskLine(`- [ ] ${text}`)?.text).toBe(text);
	});

	it('keeps brackets inside the text', () => {
		expect(parseTaskLine('- [ ] Task [with] brackets [ ]')?.text).toBe('Task [with] brackets [ ]');
	});

	it('keeps tags and wikilinks next to a date', () => {
		const task = parseTaskLine('- [ ] #math [[Algebra]] 📅 2026-10-20');
		expect(task?.due).toBe('2026-10-20');
		expect(task?.text).toBe('#math [[Algebra]]');
	});
});

describe('parseTasks: whole files', () => {
	it('returns an empty list for an empty file', () => {
		expect(parseTasks('')).toEqual([]);
	});

	it('returns an empty list for a file without tasks', () => {
		expect(parseTasks('# Title\n\nSome text\n- item')).toEqual([]);
	});

	it('numbers lines from zero', () => {
		const tasks = parseTasks('# Title\n- [ ] First\n\n- [x] Second');
		expect(tasks.map((t) => [t.line, t.text])).toEqual([
			[1, 'First'],
			[3, 'Second'],
		]);
	});

	it('finds nested tasks', () => {
		const tasks = parseTasks('- [ ] Parent\n    - [ ] Child\n        - [x] Grandchild');
		expect(tasks.map((t) => t.text)).toEqual(['Parent', 'Child', 'Grandchild']);
	});

	it('finds tasks below a plain list item', () => {
		const tasks = parseTasks('- Topic\n    - [ ] Task under topic');
		expect(tasks).toHaveLength(1);
		expect(tasks[0]?.line).toBe(1);
	});

	it('handles Windows line endings and keeps raw free of the carriage return', () => {
		const tasks = parseTasks('- [ ] One\r\n- [ ] Two 📅 2026-10-20\r\n');
		expect(tasks.map((t) => t.raw)).toEqual(['- [ ] One', '- [ ] Two 📅 2026-10-20']);
		expect(tasks[1]?.due).toBe('2026-10-20');
	});
});

describe('parseTasks: code blocks', () => {
	it('ignores tasks in a backtick fence', () => {
		const tasks = parseTasks('```\n- [ ] In code\n```\n- [ ] Outside');
		expect(tasks.map((t) => t.text)).toEqual(['Outside']);
		expect(tasks[0]?.line).toBe(3);
	});

	it('ignores tasks in a fence with a language', () => {
		expect(parseTasks('```md\n- [ ] In code\n```')).toEqual([]);
	});

	it('ignores tasks in a tilde fence', () => {
		expect(parseTasks('~~~\n- [ ] In code\n~~~')).toEqual([]);
	});

	it('ignores tasks in an indented fence inside a list', () => {
		expect(parseTasks('- Item\n    ```\n    - [ ] In code\n    ```')).toEqual([]);
	});

	it('does not close a fence with the other fence character', () => {
		const tasks = parseTasks('```\n~~~\n- [ ] Still code\n```\n- [ ] Outside');
		expect(tasks.map((t) => t.text)).toEqual(['Outside']);
	});

	it('does not close a fence with a shorter run', () => {
		const tasks = parseTasks('````\n```\n- [ ] Still code\n````\n- [ ] Outside');
		expect(tasks.map((t) => t.text)).toEqual(['Outside']);
	});

	it('does not close a fence on a line with text after the backticks', () => {
		const tasks = parseTasks('```\n``` not a closing fence\n- [ ] Still code\n```\n- [ ] Outside');
		expect(tasks.map((t) => t.text)).toEqual(['Outside']);
	});

	it('treats an unclosed fence as code until the end of the file', () => {
		expect(parseTasks('- [ ] Before\n```\n- [ ] In code')).toHaveLength(1);
	});

	it('finds tasks between two fences', () => {
		const tasks = parseTasks('```\na\n```\n- [ ] Between\n```\nb\n```');
		expect(tasks.map((t) => t.text)).toEqual(['Between']);
	});

	it('does not treat inline triple backticks as a fence', () => {
		const tasks = parseTasks('```inline```\n- [ ] Real task');
		expect(tasks.map((t) => t.text)).toEqual(['Real task']);
	});

	it('still finds a task line that only contains backticks in its text', () => {
		const tasks = parseTasks('- [ ] Use ```code``` here');
		expect(tasks).toHaveLength(1);
	});
});

describe('parseTasks: frontmatter', () => {
	it('ignores task-like lines in frontmatter', () => {
		const tasks = parseTasks('---\nlist:\n  - [ ] not a task\n---\n- [ ] Real');
		expect(tasks.map((t) => [t.line, t.text])).toEqual([[4, 'Real']]);
	});

	it('does not treat an unclosed --- as frontmatter', () => {
		const tasks = parseTasks('---\n- [ ] Task\nno closing line');
		expect(tasks.map((t) => t.text)).toEqual(['Task']);
	});

	it('does not treat --- in the middle of the file as frontmatter', () => {
		const tasks = parseTasks('# Title\n---\n- [ ] Task\n---');
		expect(tasks.map((t) => t.text)).toEqual(['Task']);
	});
});
