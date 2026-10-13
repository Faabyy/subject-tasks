import { describe, expect, it } from 'vitest';
import { toDateString } from './dates';

describe('toDateString', () => {
	it('formats with leading zeros', () => {
		expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
	});

	it('formats a two-digit month and day', () => {
		expect(toDateString(new Date(2026, 9, 13))).toBe('2026-10-13');
	});

	it('uses the local day, also late in the evening', () => {
		expect(toDateString(new Date(2026, 11, 31, 23, 59, 59))).toBe('2026-12-31');
	});

	it('uses the local day, also just after midnight', () => {
		expect(toDateString(new Date(2027, 0, 1, 0, 0, 1))).toBe('2027-01-01');
	});
});
