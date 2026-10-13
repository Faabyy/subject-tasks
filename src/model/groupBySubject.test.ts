import { describe, expect, it } from 'vitest';
import { groupBySubject } from './groupBySubject';
import { makeTask } from './testHelpers';

const TODAY = '2026-10-13';

describe('groupBySubject', () => {
	it('returns no groups for no tasks', () => {
		expect(groupBySubject([], TODAY)).toEqual([]);
	});

	it('groups by subject and orders groups by name', () => {
		const groups = groupBySubject(
			[
				makeTask({ subject: 'Physik', text: 'p' }),
				makeTask({ subject: 'Deutsch', text: 'd' }),
				makeTask({ subject: 'Mathe', text: 'm1' }),
				makeTask({ subject: 'Mathe', text: 'm2', line: 1 }),
			],
			TODAY,
		);
		expect(groups.map((g) => [g.subject, g.tasks.length])).toEqual([
			['Deutsch', 1],
			['Mathe', 2],
			['Physik', 1],
		]);
	});

	it('ignores case and treats umlauts like their base letter when ordering', () => {
		const groups = groupBySubject(
			[makeTask({ subject: 'zeichnen' }), makeTask({ subject: 'Übung' }), makeTask({ subject: 'Albert' })],
			TODAY,
		);
		expect(groups.map((g) => g.subject)).toEqual(['Albert', 'Übung', 'zeichnen']);
	});

	it('orders numbers naturally', () => {
		const groups = groupBySubject([makeTask({ subject: 'Kurs 10' }), makeTask({ subject: 'Kurs 2' })], TODAY);
		expect(groups.map((g) => g.subject)).toEqual(['Kurs 2', 'Kurs 10']);
	});

	it('puts the group without a subject last', () => {
		const groups = groupBySubject(
			[makeTask({ subject: '' }), makeTask({ subject: 'Zeichnen' }), makeTask({ subject: 'Archiv' })],
			TODAY,
		);
		expect(groups.map((g) => g.subject)).toEqual(['Archiv', 'Zeichnen', '']);
	});

	it('sorts the tasks inside a group by due date', () => {
		const groups = groupBySubject(
			[
				makeTask({ subject: 'Mathe', text: 'later', due: '2026-11-01' }),
				makeTask({ subject: 'Mathe', text: 'overdue', due: '2026-10-01' }),
				makeTask({ subject: 'Mathe', text: 'undated' }),
			],
			TODAY,
		);
		expect(groups[0]?.tasks.map((t) => t.text)).toEqual(['overdue', 'later', 'undated']);
	});
});
