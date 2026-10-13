import { describe, expect, it } from 'vitest';
import {
	cleanFolderPath,
	normalizeSettings,
	parseFolderList,
	validateFolderList,
	validateFolderPath,
} from './normalizeSettings';
import { DEFAULT_SETTINGS } from './settings';

describe('cleanFolderPath', () => {
	it.each([
		['School', 'School'],
		['/School/', 'School'],
		['School//Math', 'School/Math'],
		['  School / Math  ', 'School/Math'],
		['School\\Math', 'School/Math'],
		['C:\\School\\Math', 'C:/School/Math'],
		['./School/./Math', 'School/Math'],
		['', ''],
		['   ', ''],
		['/', ''],
		['.', ''],
		['Übung/Größe', 'Übung/Größe'],
	])('%j becomes %j', (input, expected) => {
		expect(cleanFolderPath(input)).toBe(expected);
	});
});

describe('validateFolderPath', () => {
	it.each(['', 'School', 'School/Math', '/School/', 'Übung', 'Folder with spaces', 'a.b/c-d_e', '2026 (alt)'])(
		'accepts %j',
		(path) => {
			expect(validateFolderPath(path)).toBeNull();
		},
	);

	it.each(['..', '../Other', 'School/../Other', 'School/..', '..\\Other'])('rejects the parent folder in %j', (path) => {
		expect(validateFolderPath(path)).toMatch(/inside the vault/);
	});

	it.each(['C:\\School', 'a:b', 'what?', 'star*', 'quote"', 'a<b', 'a>b', 'a|b'])(
		'rejects the forbidden character in %j',
		(path) => {
			expect(validateFolderPath(path)).toMatch(/cannot contain/);
		},
	);

	it('accepts a part that only starts with two dots', () => {
		expect(validateFolderPath('..hidden')).toBeNull();
		expect(validateFolderPath('a../b')).toBeNull();
	});
});

describe('parseFolderList', () => {
	it('splits into lines and cleans each one', () => {
		expect(parseFolderList('Archive\n /Drafts/ \nSchool\\Old')).toEqual(['Archive', 'Drafts', 'School/Old']);
	});

	it('drops blank lines and duplicates and keeps the order', () => {
		expect(parseFolderList('b\n\n  \na\nb\n/a/')).toEqual(['b', 'a']);
	});

	it('handles Windows line endings', () => {
		expect(parseFolderList('a\r\nb\r\n')).toEqual(['a', 'b']);
	});

	it('returns an empty list for empty text', () => {
		expect(parseFolderList('')).toEqual([]);
		expect(parseFolderList('\n\n')).toEqual([]);
	});
});

describe('validateFolderList', () => {
	it('accepts a good list and an empty one', () => {
		expect(validateFolderList('Archive\nDrafts')).toBeNull();
		expect(validateFolderList('')).toBeNull();
	});

	it('names the first bad line', () => {
		const message = validateFolderList('Archive\n../Outside\nBad|Name');
		expect(message).toContain('../Outside');
		expect(message).not.toContain('Bad|Name');
	});
});

describe('normalizeSettings', () => {
	it('returns the defaults for nothing at all', () => {
		expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
		expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
		expect(normalizeSettings({})).toEqual(DEFAULT_SETTINGS);
	});

	it('returns the defaults for data that is not an object', () => {
		for (const raw of ['text', 42, true, [], [1, 2]]) {
			expect(normalizeSettings(raw)).toEqual(DEFAULT_SETTINGS);
		}
	});

	it('keeps good values', () => {
		const raw = { rootFolder: 'School', excludedFolders: ['School/Archive'], showCompleted: true };
		expect(normalizeSettings(raw)).toEqual(raw);
	});

	it('cleans paths from a hand-edited file', () => {
		const result = normalizeSettings({ rootFolder: ' /School/ ', excludedFolders: ['/Archive/', 'Drafts\\Old'] });
		expect(result.rootFolder).toBe('School');
		expect(result.excludedFolders).toEqual(['Archive', 'Drafts/Old']);
	});

	it('falls back to the default for values of the wrong type', () => {
		const result = normalizeSettings({ rootFolder: 5, excludedFolders: 'Archive', showCompleted: 'yes' });
		expect(result).toEqual(DEFAULT_SETTINGS);
	});

	it('falls back for an invalid root folder', () => {
		expect(normalizeSettings({ rootFolder: '../Outside' }).rootFolder).toBe('');
		expect(normalizeSettings({ rootFolder: 'a|b' }).rootFolder).toBe('');
	});

	it('drops bad, empty and duplicate excluded folders and keeps the good ones', () => {
		const result = normalizeSettings({ excludedFolders: ['Archive', 7, null, '', '../x', 'a|b', 'Archive', '/Archive/', 'Drafts'] });
		expect(result.excludedFolders).toEqual(['Archive', 'Drafts']);
	});

	it('drops unknown keys', () => {
		const result = normalizeSettings({ rootFolder: 'School', somethingOld: 1 });
		expect(result).not.toHaveProperty('somethingOld');
	});

	it('does not share the default list with its callers', () => {
		const a = normalizeSettings({});
		a.excludedFolders.push('x');
		expect(normalizeSettings({}).excludedFolders).toEqual([]);
		expect(DEFAULT_SETTINGS.excludedFolders).toEqual([]);
	});
});
