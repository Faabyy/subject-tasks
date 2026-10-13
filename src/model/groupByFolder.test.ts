import { describe, expect, it } from 'vitest';
import { groupByFolder } from './groupByFolder';
import { makeTask } from './testHelpers';

const TODAY = '2026-10-13';

describe('groupByFolder', () => {
	it('returns no groups for no tasks', () => {
		expect(groupByFolder([], TODAY)).toEqual([]);
	});

	it('groups by folder and orders groups by name', () => {
		const groups = groupByFolder(
			[
				makeTask({ folder: 'Physik', text: 'p' }),
				makeTask({ folder: 'Deutsch', text: 'd' }),
				makeTask({ folder: 'Mathe', text: 'm1' }),
				makeTask({ folder: 'Mathe', text: 'm2', line: 1 }),
			],
			TODAY,
		);
		expect(groups.map((g) => [g.folder, g.tasks.length])).toEqual([
			['Deutsch', 1],
			['Mathe', 2],
			['Physik', 1],
		]);
	});

	it('ignores case and treats umlauts like their base letter when ordering', () => {
		const groups = groupByFolder(
			[makeTask({ folder: 'zeichnen' }), makeTask({ folder: 'Übung' }), makeTask({ folder: 'Albert' })],
			TODAY,
		);
		expect(groups.map((g) => g.folder)).toEqual(['Albert', 'Übung', 'zeichnen']);
	});

	it('orders numbers naturally', () => {
		const groups = groupByFolder([makeTask({ folder: 'Kurs 10' }), makeTask({ folder: 'Kurs 2' })], TODAY);
		expect(groups.map((g) => g.folder)).toEqual(['Kurs 2', 'Kurs 10']);
	});

	it('puts the group without a folder last', () => {
		const groups = groupByFolder(
			[makeTask({ folder: '' }), makeTask({ folder: 'Zeichnen' }), makeTask({ folder: 'Archiv' })],
			TODAY,
		);
		expect(groups.map((g) => g.folder)).toEqual(['Archiv', 'Zeichnen', '']);
	});

	it('sorts the tasks inside a group by due date', () => {
		const groups = groupByFolder(
			[
				makeTask({ folder: 'Mathe', text: 'later', due: '2026-11-01' }),
				makeTask({ folder: 'Mathe', text: 'overdue', due: '2026-10-01' }),
				makeTask({ folder: 'Mathe', text: 'undated' }),
			],
			TODAY,
		);
		expect(groups[0]?.tasks.map((t) => t.text)).toEqual(['overdue', 'later', 'undated']);
	});
});
