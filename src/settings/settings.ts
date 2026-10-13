export interface SubjectTasksSettings {
	/** Folder whose direct subfolders count as subjects. Empty means the whole vault. */
	rootFolder: string;
	/** Folders whose notes are ignored. */
	excludedFolders: string[];
	/** Whether completed tasks are shown in the view. */
	showCompleted: boolean;
}

export const DEFAULT_SETTINGS: SubjectTasksSettings = {
	rootFolder: '',
	excludedFolders: [],
	showCompleted: false,
};
