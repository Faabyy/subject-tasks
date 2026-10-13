import { describe, expect, it } from 'vitest';
import { parseTasks } from '../parser/taskParser';
import { toVaultTasks } from './vaultTasks';

const tasks = parseTasks('- [ ] One 📅 2026-10-20\n- [x] Two');

describe('toVaultTasks', () => {
	it('adds path and subject and keeps the parsed fields', () => {
		const result = toVaultTasks('Math/Algebra.md', tasks, { rootFolder: '', excludedFolders: [] });
		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject({
			path: 'Math/Algebra.md',
			subject: 'Math',
			line: 0,
			text: 'One',
			due: '2026-10-20',
			status: 'open',
		});
		expect(result[1]).toMatchObject({ line: 1, status: 'done' });
	});

	it('returns nothing for excluded notes', () => {
		expect(toVaultTasks('Archive/Old.md', tasks, { rootFolder: '', excludedFolders: ['Archive'] })).toEqual([]);
	});

	it('returns nothing for notes outside the root folder', () => {
		expect(toVaultTasks('Private/Diary.md', tasks, { rootFolder: 'School', excludedFolders: [] })).toEqual([]);
	});

	it('uses an empty subject for a note directly in the root', () => {
		const result = toVaultTasks('Inbox.md', tasks, { rootFolder: '', excludedFolders: [] });
		expect(result.every((t) => t.subject === '')).toBe(true);
	});

	it('does not change the input tasks', () => {
		const before = JSON.stringify(tasks);
		toVaultTasks('Math/Algebra.md', tasks, { rootFolder: '', excludedFolders: [] });
		expect(JSON.stringify(tasks)).toBe(before);
	});
});
