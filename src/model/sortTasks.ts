import type { ParsedTask, TaskStatus } from '../parser/taskParser';
import type { VaultTask } from './types';

/** A task is overdue if it is still open and its due date lies before `today` (`YYYY-MM-DD`). */
export function isOverdue(task: Pick<ParsedTask, 'status' | 'due'>, today: string): boolean {
	return task.status === 'open' && task.due !== null && task.due < today;
}

// Open tasks first, then custom statuses, then completed ones.
const STATUS_RANK: Record<TaskStatus, number> = { open: 0, other: 1, done: 2 };

/** Overdue first, then tasks with a date (today included), then tasks without a date. */
function dueRank(task: VaultTask, today: string): number {
	if (isOverdue(task, today)) return 0;
	return task.due === null ? 2 : 1;
}

/**
 * Sort order: status, then overdue / dated / undated, then due date, then
 * note path and line, so the order is always the same for the same input.
 * Dates are `YYYY-MM-DD` strings, so plain string comparison sorts them correctly.
 */
export function compareTasks(a: VaultTask, b: VaultTask, today: string): number {
	const byStatus = STATUS_RANK[a.status] - STATUS_RANK[b.status];
	if (byStatus !== 0) return byStatus;

	const byDueRank = dueRank(a, today) - dueRank(b, today);
	if (byDueRank !== 0) return byDueRank;

	if (a.due !== null && b.due !== null && a.due !== b.due) return a.due < b.due ? -1 : 1;
	if (a.path !== b.path) return a.path < b.path ? -1 : 1;
	return a.line - b.line;
}

/** Returns a sorted copy. */
export function sortTasks(tasks: readonly VaultTask[], today: string): VaultTask[] {
	return [...tasks].sort((a, b) => compareTasks(a, b, today));
}
