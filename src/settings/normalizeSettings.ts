import { DEFAULT_SETTINGS } from './settings';
import type { TasksByFolderSettings } from './settings';

/**
 * Cleaning and checking of folder paths typed by the user, and of the saved
 * settings file. Pure functions, no Obsidian imports.
 */

// Characters that cannot be part of a file or folder name on at least one platform Obsidian runs on.
const FORBIDDEN_CHARACTERS = /[:*?"<>|]/;

/**
 * Turns what the user typed into a vault path: backslashes become slashes, and
 * empty, `.` and surrounding-space parts are dropped, so `/ School//Math/ ` becomes `School/Math`.
 */
export function cleanFolderPath(input: string): string {
	return input
		.replace(/\\/g, '/')
		.split('/')
		.map((part) => part.trim())
		.filter((part) => part !== '' && part !== '.')
		.join('/');
}

/** Returns a message for a path that cannot be a folder inside the vault, or `null` if it is fine. An empty path is fine. */
export function validateFolderPath(input: string): string | null {
	const path = cleanFolderPath(input);

	if (path.split('/').includes('..')) return 'Use a folder inside the vault. Parts like ".." are not allowed.';
	if (FORBIDDEN_CHARACTERS.test(path)) return 'A folder name cannot contain any of these characters: : * ? " < > |';
	return null;
}

/** One folder per line. Blank lines and duplicates are dropped, the order is kept. */
export function parseFolderList(text: string): string[] {
	const folders: string[] = [];
	for (const line of text.split(/\r?\n/)) {
		const folder = cleanFolderPath(line);
		if (folder !== '' && !folders.includes(folder)) folders.push(folder);
	}
	return folders;
}

/** Checks every line of a folder list. The message names the first line that is not valid. */
export function validateFolderList(text: string): string | null {
	for (const line of text.split(/\r?\n/)) {
		const message = validateFolderPath(line);
		if (message !== null) return `"${line.trim()}": ${message}`;
	}
	return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Builds usable settings from whatever the settings file contained.
 * A missing, hand-edited or damaged file never throws: every value that has the
 * wrong type or an invalid path falls back to its default, and unknown keys are dropped.
 */
export function normalizeSettings(raw: unknown): TasksByFolderSettings {
	const data = isRecord(raw) ? raw : {};

	const rootFolder =
		typeof data.rootFolder === 'string' && validateFolderPath(data.rootFolder) === null
			? cleanFolderPath(data.rootFolder)
			: DEFAULT_SETTINGS.rootFolder;

	const excludedFolders: string[] = [];
	if (Array.isArray(data.excludedFolders)) {
		for (const entry of data.excludedFolders as unknown[]) {
			if (typeof entry !== 'string' || validateFolderPath(entry) !== null) continue;
			const folder = cleanFolderPath(entry);
			if (folder !== '' && !excludedFolders.includes(folder)) excludedFolders.push(folder);
		}
	}

	const showCompleted =
		typeof data.showCompleted === 'boolean' ? data.showCompleted : DEFAULT_SETTINGS.showCompleted;

	return { rootFolder, excludedFolders, showCompleted };
}
