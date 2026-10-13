import { describe, expect, it } from 'vitest';
import { locateLine } from './locateLine';

const raw = '- [ ] Task';

describe('locateLine', () => {
	it('uses the expected line if it still holds the task', () => {
		expect(locateLine(['# T', raw, 'x'], 1, raw)).toBe(1);
	});

	it('follows the task when lines were inserted above', () => {
		expect(locateLine(['a', 'b', 'c', raw, 'x'], 1, raw)).toBe(3);
	});

	it('follows the task when lines were removed above', () => {
		expect(locateLine([raw, 'x'], 4, raw)).toBe(0);
	});

	it('picks the nearest line if the same text occurs several times', () => {
		const lines = [raw, 'a', 'b', 'c', raw, 'd', raw];
		expect(locateLine(lines, 5, raw)).toBe(4);
		expect(locateLine(lines, 0, raw)).toBe(0);
		expect(locateLine(lines, 100, raw)).toBe(6);
	});

	it('keeps the expected line if the task is gone', () => {
		expect(locateLine(['a', 'b', 'c'], 1, raw)).toBe(1);
	});

	it('limits the line to the lines that exist', () => {
		expect(locateLine(['a', 'b'], 10, raw)).toBe(1);
	});

	it('returns 0 for an empty note', () => {
		expect(locateLine([], 3, raw)).toBe(0);
		expect(locateLine([''], 3, raw)).toBe(0);
	});
});
