import { describe, expect, it } from 'vitest';
import { getFolder, isExcluded, trimSlashes } from './folder';

describe('trimSlashes', () => {
	it.each([
		['School', 'School'],
		['/School/', 'School'],
		['School//', 'School'],
		['  School/Math/  ', 'School/Math'],
		['', ''],
		['/', ''],
	])('%j becomes %j', (input, expected) => {
		expect(trimSlashes(input)).toBe(expected);
	});
});

describe('getFolder: whole vault as root', () => {
	it('uses the first folder', () => {
		expect(getFolder('Math/Algebra.md', '')).toBe('Math');
	});

	it('uses only the first folder for deeper paths', () => {
		expect(getFolder('Math/Algebra/Week 1/Notes.md', '')).toBe('Math');
	});

	it('returns an empty group for a note in the vault root', () => {
		expect(getFolder('Inbox.md', '')).toBe('');
	});

	it('keeps spaces and umlauts in the folder name', () => {
		expect(getFolder('Politik und Wirtschaft/Übung.md', '')).toBe('Politik und Wirtschaft');
	});
});

describe('getFolder: with a root folder', () => {
	it('uses the first folder below the root', () => {
		expect(getFolder('School/Math/Algebra.md', 'School')).toBe('Math');
	});

	it('works with a nested root folder', () => {
		expect(getFolder('Stuff/School/Math/Algebra.md', 'Stuff/School')).toBe('Math');
	});

	it('returns an empty group for a note directly in the root', () => {
		expect(getFolder('School/Overview.md', 'School')).toBe('');
	});

	it('returns null outside the root', () => {
		expect(getFolder('Private/Diary.md', 'School')).toBeNull();
		expect(getFolder('Inbox.md', 'School')).toBeNull();
	});

	it('does not match a folder that only starts with the root name', () => {
		expect(getFolder('SchoolArchive/Math/Algebra.md', 'School')).toBeNull();
	});

	it('is case sensitive like vault paths', () => {
		expect(getFolder('school/Math/Algebra.md', 'School')).toBeNull();
	});

	it('ignores slashes around the root folder setting', () => {
		expect(getFolder('School/Math/Algebra.md', '/School/')).toBe('Math');
	});
});

describe('isExcluded', () => {
	it('matches notes in the folder', () => {
		expect(isExcluded('Archive/Old.md', ['Archive'])).toBe(true);
	});

	it('matches notes in subfolders', () => {
		expect(isExcluded('Archive/2024/Old.md', ['Archive'])).toBe(true);
	});

	it('matches a nested excluded folder', () => {
		expect(isExcluded('School/Archive/Old.md', ['School/Archive'])).toBe(true);
		expect(isExcluded('School/Math/New.md', ['School/Archive'])).toBe(false);
	});

	it('does not match a folder with a similar name', () => {
		expect(isExcluded('Archive2/Note.md', ['Archive'])).toBe(false);
		expect(isExcluded('MyArchive/Note.md', ['Archive'])).toBe(false);
	});

	it('does not match a note named like the folder', () => {
		expect(isExcluded('Archive.md', ['Archive'])).toBe(false);
	});

	it('ignores empty entries instead of excluding everything', () => {
		expect(isExcluded('Math/Algebra.md', [''])).toBe(false);
		expect(isExcluded('Math/Algebra.md', ['  ', '/'])).toBe(false);
	});

	it('ignores slashes around entries', () => {
		expect(isExcluded('Archive/Old.md', ['/Archive/'])).toBe(true);
	});

	it('returns false for an empty list', () => {
		expect(isExcluded('Archive/Old.md', [])).toBe(false);
	});

	it('checks every entry', () => {
		expect(isExcluded('Drafts/a.md', ['Archive', 'Drafts'])).toBe(true);
	});
});
