import { sortTasks } from './sortTasks';
import type { VaultTask } from './types';

export interface FolderGroup {
	/** Name of the group folder, or `''` for notes that are not inside one. */
	folder: string;
	/** Tasks of this group in display order. */
	tasks: VaultTask[];
}

/**
 * Groups tasks by their folder and sorts the tasks inside each group.
 * Groups are ordered by name; the group without a folder comes last.
 */
export function groupByFolder(tasks: readonly VaultTask[], today: string): FolderGroup[] {
	const byFolder = new Map<string, VaultTask[]>();

	for (const task of tasks) {
		const list = byFolder.get(task.folder);
		if (list) list.push(task);
		else byFolder.set(task.folder, [task]);
	}

	return [...byFolder.entries()]
		.map(([folder, list]) => ({ folder, tasks: sortTasks(list, today) }))
		.sort((a, b) => {
			if (a.folder === '') return b.folder === '' ? 0 : 1;
			if (b.folder === '') return -1;
			return a.folder.localeCompare(b.folder, undefined, { sensitivity: 'base', numeric: true });
		});
}
