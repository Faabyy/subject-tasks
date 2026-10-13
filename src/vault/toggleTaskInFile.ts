import type { App } from 'obsidian';
import { toggleTaskInContent } from '../model/toggleTask';
import type { ToggleRefusal } from '../model/toggleTask';
import type { VaultTask } from '../model/types';

export type ToggleOutcome =
	| { ok: true; status: 'open' | 'done' }
	| { ok: false; reason: ToggleRefusal | 'missing-note' };

/** Thrown inside `Vault.process` to stop it before anything is written. */
class Refused extends Error {
	readonly reason: ToggleRefusal;

	constructor(reason: ToggleRefusal) {
		super(reason);
		this.reason = reason;
	}
}

/**
 * Ticks or unticks a task in its note.
 *
 * The check and the write happen inside one `Vault.process` call, which reads
 * the note, runs our function and saves the result atomically. If the line is
 * not what the list showed, the function throws, nothing is written, and the
 * reason is returned. Real read or write errors are passed on to the caller.
 */
export async function toggleTaskInFile(app: App, task: VaultTask): Promise<ToggleOutcome> {
	const file = app.vault.getFileByPath(task.path);
	if (!file) return { ok: false, reason: 'missing-note' };

	let status: 'open' | 'done' = 'open';

	try {
		await app.vault.process(file, (data) => {
			const result = toggleTaskInContent(data, task);
			if (!result.ok) throw new Refused(result.reason);
			status = result.status;
			return result.content;
		});
	} catch (error) {
		if (error instanceof Refused) return { ok: false, reason: error.reason };
		throw error;
	}

	return { ok: true, status };
}
