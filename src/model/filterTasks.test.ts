import { describe, expect, it } from 'vitest';
import { filterTasks } from './filterTasks';
import { makeTask } from './testHelpers';

const TODAY = '2026-10-13';
const ALL = { query: '', onlyOverdue: false, showCompleted: true };

const open = makeTask({ text: 'Read chapter', path: 'Deutsch/Book.md', subject: 'Deutsch' });
const overdue = makeTask({ text: 'Hand in report', due: '2026-10-01', path: 'Mathe/Algebra.md', subject: 'Mathe' });
const done = makeTask({ text: 'Finished item', status: 'done', statusChar: 'x', path: 'Mathe/Algebra.md', subject: 'Mathe' });
const custom = makeTask({ text: 'In progress', status: 'other', statusChar: '/', path: 'Mathe/Algebra.md', subject: 'Mathe' });
const tasks = [open, overdue, done, custom];

describe('filterTasks: completed tasks', () => {
	it('hides done tasks and custom statuses by default', () => {
		const result = filterTasks(tasks, { ...ALL, showCompleted: false }, TODAY);
		expect(result).toEqual([open, overdue]);
	});

	it('shows them when asked', () => {
		expect(filterTasks(tasks, ALL, TODAY)).toEqual(tasks);
	});
});

describe('filterTasks: overdue only', () => {
	it('keeps only overdue tasks', () => {
		expect(filterTasks(tasks, { ...ALL, onlyOverdue: true }, TODAY)).toEqual([overdue]);
	});

	it('does not count a task due today', () => {
		const today = makeTask({ due: TODAY });
		expect(filterTasks([today], { ...ALL, onlyOverdue: true }, TODAY)).toEqual([]);
	});
});

describe('filterTasks: search', () => {
	it('returns everything for an empty or blank query', () => {
		expect(filterTasks(tasks, { ...ALL, query: '' }, TODAY)).toEqual(tasks);
		expect(filterTasks(tasks, { ...ALL, query: '   ' }, TODAY)).toEqual(tasks);
	});

	it('matches the task text without regard to case', () => {
		expect(filterTasks(tasks, { ...ALL, query: 'CHAPTER' }, TODAY)).toEqual([open]);
	});

	it('matches the note path, which includes the subject', () => {
		expect(filterTasks(tasks, { ...ALL, query: 'mathe' }, TODAY)).toEqual([overdue, done, custom]);
		expect(filterTasks(tasks, { ...ALL, query: 'algebra.md' }, TODAY)).toEqual([overdue, done, custom]);
	});

	it('requires every word, in any order', () => {
		expect(filterTasks(tasks, { ...ALL, query: 'report mathe' }, TODAY)).toEqual([overdue]);
		expect(filterTasks(tasks, { ...ALL, query: 'mathe report' }, TODAY)).toEqual([overdue]);
		expect(filterTasks(tasks, { ...ALL, query: 'report deutsch' }, TODAY)).toEqual([]);
	});

	it('does not treat special characters as a pattern', () => {
		const special = makeTask({ text: 'Solve (x+1)* [a]' });
		expect(filterTasks([special], { ...ALL, query: '(x+1)*' }, TODAY)).toEqual([special]);
		expect(filterTasks([open], { ...ALL, query: '.*' }, TODAY)).toEqual([]);
	});

	it('returns nothing when nothing matches', () => {
		expect(filterTasks(tasks, { ...ALL, query: 'xyz' }, TODAY)).toEqual([]);
	});
});

describe('filterTasks: combined', () => {
	it('applies all filters together', () => {
		const result = filterTasks(tasks, { query: 'report', onlyOverdue: true, showCompleted: false }, TODAY);
		expect(result).toEqual([overdue]);
	});
});
