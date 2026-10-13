import { sortTasks } from './sortTasks';
import type { VaultTask } from './types';

export interface SubjectGroup {
	/** Subject folder name, or `''` for notes that are not in a subject folder. */
	subject: string;
	/** Tasks of this subject in display order. */
	tasks: VaultTask[];
}

/**
 * Groups tasks by subject and sorts the tasks inside each group.
 * Groups are ordered by name; the group without a subject comes last.
 */
export function groupBySubject(tasks: readonly VaultTask[], today: string): SubjectGroup[] {
	const bySubject = new Map<string, VaultTask[]>();

	for (const task of tasks) {
		const list = bySubject.get(task.subject);
		if (list) list.push(task);
		else bySubject.set(task.subject, [task]);
	}

	return [...bySubject.entries()]
		.map(([subject, list]) => ({ subject, tasks: sortTasks(list, today) }))
		.sort((a, b) => {
			if (a.subject === '') return b.subject === '' ? 0 : 1;
			if (b.subject === '') return -1;
			return a.subject.localeCompare(b.subject, undefined, { sensitivity: 'base', numeric: true });
		});
}
