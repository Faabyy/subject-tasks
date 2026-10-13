/**
 * Finds the line of a task in the current content of a note.
 *
 * The index may be a moment behind the editor, so the task can have moved.
 * If the expected line still holds the task, it is used. Otherwise the nearest
 * line with exactly the same text is used. If there is none, the expected line
 * is kept, limited to the lines that exist.
 */
export function locateLine(lines: readonly string[], expectedLine: number, raw: string): number {
	if (lines[expectedLine] === raw) return expectedLine;

	let best = -1;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i] !== raw) continue;
		if (best === -1 || Math.abs(i - expectedLine) < Math.abs(best - expectedLine)) best = i;
	}
	if (best !== -1) return best;

	return Math.max(0, Math.min(expectedLine, lines.length - 1));
}
