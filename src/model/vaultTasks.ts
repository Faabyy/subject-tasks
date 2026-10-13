import type { ParsedTask } from '../parser/taskParser';
import type { SubjectTasksSettings } from '../settings/settings';
import { getSubject, isExcluded } from './subject';
import type { VaultTask } from './types';

/**
 * Attaches path and subject to the tasks of one note.
 * Returns no tasks for notes that are excluded or outside the root folder.
 */
export function toVaultTasks(
	path: string,
	tasks: readonly ParsedTask[],
	settings: Pick<SubjectTasksSettings, 'rootFolder' | 'excludedFolders'>,
): VaultTask[] {
	if (isExcluded(path, settings.excludedFolders)) return [];

	const subject = getSubject(path, settings.rootFolder);
	if (subject === null) return [];

	return tasks.map((task) => ({ ...task, path, subject }));
}
