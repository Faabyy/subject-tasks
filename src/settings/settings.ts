export interface TasksByFolderSettings {
	/** Folder whose direct subfolders are the groups. Empty means the whole vault. */
	rootFolder: string;
	/** Folders whose notes are ignored. */
	excludedFolders: string[];
	/** Whether completed tasks are shown in the view. */
	showCompleted: boolean;
}

export const DEFAULT_SETTINGS: TasksByFolderSettings = {
	rootFolder: '',
	excludedFolders: [],
	showCompleted: false,
};
