import type { ParsedTask } from '../parser/taskParser';
import type { TasksByFolderSettings } from '../settings/settings';
import { getFolder, isExcluded } from './folder';
import type { VaultTask } from './types';

/**
 * Attaches path and folder to the tasks of one note.
 * Returns no tasks for notes that are excluded or outside the root folder.
 */
export function toVaultTasks(
	path: string,
	tasks: readonly ParsedTask[],
	settings: Pick<TasksByFolderSettings, 'rootFolder' | 'excludedFolders'>,
): VaultTask[] {
	if (isExcluded(path, settings.excludedFolders)) return [];

	const folder = getFolder(path, settings.rootFolder);
	if (folder === null) return [];

	return tasks.map((task) => ({ ...task, path, folder }));
}
