import type { ParsedTask } from '../parser/taskParser';

/** A task together with the note it lives in. */
export interface VaultTask extends ParsedTask {
	/** Vault path of the note, for example `School/Math/Algebra.md`. */
	path: string;
	/** Subject folder name. Empty if the note is not inside a subject folder. */
	subject: string;
}
