import type { ParsedTask } from '../parser/taskParser';

/** A task together with the note it lives in. */
export interface VaultTask extends ParsedTask {
	/** Vault path of the note, for example `School/Math/Algebra.md`. */
	path: string;
	/** Group folder: the first folder below the root folder. Empty if the note is not inside one. */
	folder: string;
}
