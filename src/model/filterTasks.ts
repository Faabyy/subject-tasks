import { isOverdue } from './sortTasks';
import type { VaultTask } from './types';

export interface TaskFilter {
	/** Search words, separated by spaces. Every word must appear in the task text or the note path. */
	query: string;
	onlyOverdue: boolean;
	/** Open tasks are always shown; this adds completed tasks and tasks with a custom status. */
	showCompleted: boolean;
}

export function filterTasks(tasks: readonly VaultTask[], filter: TaskFilter, today: string): VaultTask[] {
	const words = filter.query.toLowerCase().split(/\s+/).filter((word) => word !== '');

	return tasks.filter((task) => {
		if (task.status !== 'open' && !filter.showCompleted) return false;
		if (filter.onlyOverdue && !isOverdue(task, today)) return false;

		if (words.length > 0) {
			const haystack = `${task.text}\n${task.path}`.toLowerCase();
			if (!words.every((word) => haystack.includes(word))) return false;
		}

		return true;
	});
}
