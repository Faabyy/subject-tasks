import { describe, expect, it } from 'vitest';
import { compareTasks, isOverdue, sortTasks } from './sortTasks';
import { makeTask } from './testHelpers';

const TODAY = '2026-10-13';

describe('isOverdue', () => {
	it('is true for an open task with a past date', () => {
		expect(isOverdue({ status: 'open', due: '2026-10-12' }, TODAY)).toBe(true);
	});

	it('is false for today', () => {
		expect(isOverdue({ status: 'open', due: TODAY }, TODAY)).toBe(false);
	});

	it('is false for the future', () => {
		expect(isOverdue({ status: 'open', due: '2026-10-14' }, TODAY)).toBe(false);
	});

	it('is false without a date', () => {
		expect(isOverdue({ status: 'open', due: null }, TODAY)).toBe(false);
	});

	it('is false for done tasks and custom statuses', () => {
		expect(isOverdue({ status: 'done', due: '2020-01-01' }, TODAY)).toBe(false);
		expect(isOverdue({ status: 'other', due: '2020-01-01' }, TODAY)).toBe(false);
	});

	it('compares across month and year boundaries', () => {
		expect(isOverdue({ status: 'open', due: '2025-12-31' }, '2026-01-01')).toBe(true);
		expect(isOverdue({ status: 'open', due: '2026-09-30' }, '2026-10-01')).toBe(true);
		expect(isOverdue({ status: 'open', due: '2026-10-01' }, '2026-09-30')).toBe(false);
	});
});

describe('sortTasks', () => {
	const texts = (tasks: ReturnType<typeof sortTasks>) => tasks.map((t) => t.text);

	it('puts overdue first, then dated by date, then undated', () => {
		const sorted = sortTasks(
			[
				makeTask({ text: 'undated' }),
				makeTask({ text: 'future', due: '2026-11-01' }),
				makeTask({ text: 'today', due: TODAY }),
				makeTask({ text: 'overdue', due: '2026-10-05' }),
				makeTask({ text: 'soon', due: '2026-10-20' }),
			],
			TODAY,
		);
		expect(texts(sorted)).toEqual(['overdue', 'today', 'soon', 'future', 'undated']);
	});

	it('puts the most overdue task first', () => {
		const sorted = sortTasks(
			[makeTask({ text: 'recent', due: '2026-10-12' }), makeTask({ text: 'old', due: '2026-09-01' })],
			TODAY,
		);
		expect(texts(sorted)).toEqual(['old', 'recent']);
	});

	it('puts open tasks before custom statuses before done tasks', () => {
		const sorted = sortTasks(
			[
				makeTask({ text: 'done', status: 'done', due: '2026-10-01' }),
				makeTask({ text: 'other', status: 'other', due: '2026-10-01' }),
				makeTask({ text: 'open', due: null }),
			],
			TODAY,
		);
		expect(texts(sorted)).toEqual(['open', 'other', 'done']);
	});

	it('breaks ties by path and then by line', () => {
		const sorted = sortTasks(
			[
				makeTask({ text: 'b2', path: 'Math/b.md', line: 2 }),
				makeTask({ text: 'a5', path: 'Math/a.md', line: 5 }),
				makeTask({ text: 'b1', path: 'Math/b.md', line: 1 }),
				makeTask({ text: 'a1', path: 'Math/a.md', line: 1 }),
			],
			TODAY,
		);
		expect(texts(sorted)).toEqual(['a1', 'a5', 'b1', 'b2']);
	});

	it('gives the same result for any input order', () => {
		const tasks = [
			makeTask({ text: 'x', due: '2026-10-20', path: 'b.md' }),
			makeTask({ text: 'y', due: '2026-10-20', path: 'a.md' }),
			makeTask({ text: 'z', due: null }),
			makeTask({ text: 'w', due: '2026-10-01' }),
		];
		const expected = texts(sortTasks(tasks, TODAY));
		expect(texts(sortTasks([...tasks].reverse(), TODAY))).toEqual(expected);
		expect(texts(sortTasks([tasks[2]!, tasks[0]!, tasks[3]!, tasks[1]!], TODAY))).toEqual(expected);
	});

	it('does not change the input array', () => {
		const tasks = [makeTask({ text: 'b', due: '2026-11-01' }), makeTask({ text: 'a', due: '2026-10-01' })];
		sortTasks(tasks, TODAY);
		expect(tasks.map((t) => t.text)).toEqual(['b', 'a']);
	});

	it('returns an empty list for no tasks', () => {
		expect(sortTasks([], TODAY)).toEqual([]);
	});

	it('compareTasks is zero for the same task', () => {
		const task = makeTask();
		expect(compareTasks(task, task, TODAY)).toBe(0);
	});
});
