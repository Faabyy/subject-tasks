/** Formats a date as `YYYY-MM-DD` in the local time zone, the same format as `ParsedTask.due`. */
export function toDateString(date: Date): string {
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}
