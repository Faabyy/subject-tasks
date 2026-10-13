import type { VaultTask } from './types';

/** Builds a task for tests. Only the fields a test cares about need to be given. */
export function makeTask(overrides: Partial<VaultTask> = {}): VaultTask {
	return {
		line: 0,
		status: 'open',
		statusChar: ' ',
		text: 'Task',
		due: null,
		raw: '- [ ] Task',
		path: 'Math/a.md',
		subject: 'Math',
		...overrides,
	};
}
