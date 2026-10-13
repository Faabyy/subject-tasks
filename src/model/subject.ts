/**
 * Maps note paths to subjects. Pure functions, no Obsidian imports.
 * Paths are vault paths with `/` as separator, as Obsidian uses them.
 */

/** Removes surrounding whitespace and leading or trailing slashes from a folder path. */
export function trimSlashes(folder: string): string {
	return folder.trim().replace(/^\/+|\/+$/g, '');
}

/** True if the note is inside one of the excluded folders (or a subfolder of it). */
export function isExcluded(path: string, excludedFolders: readonly string[]): boolean {
	for (const raw of excludedFolders) {
		const folder = trimSlashes(raw);
		// An empty entry must not match everything.
		if (folder === '') continue;
		// The trailing slash keeps "Archive" from matching "Archive2/note.md".
		if (path.startsWith(`${folder}/`)) return true;
	}
	return false;
}

/**
 * The subject is the first folder below the root folder.
 *
 * - `null`: the note is outside the root folder and not part of any subject.
 * - `''`: the note is inside the root folder but not inside a subject folder.
 */
export function getSubject(path: string, rootFolder: string): string | null {
	const root = trimSlashes(rootFolder);
	let relative = path;

	if (root !== '') {
		if (!path.startsWith(`${root}/`)) return null;
		relative = path.slice(root.length + 1);
	}

	const slash = relative.indexOf('/');
	return slash === -1 ? '' : relative.slice(0, slash);
}
