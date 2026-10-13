import { ItemView, Keymap, MarkdownView, Notice, debounce } from 'obsidian';
import type { WorkspaceLeaf } from 'obsidian';
import { toDateString } from '../model/dates';
import { filterTasks } from '../model/filterTasks';
import { groupByFolder } from '../model/groupByFolder';
import { locateLine } from '../model/locateLine';
import { isOverdue } from '../model/sortTasks';
import type { VaultTask } from '../model/types';
import type { TasksByFolderSettings } from '../settings/settings';
import type { TaskIndex } from '../vault/taskIndex';

export const VIEW_TYPE_TASKS_BY_FOLDER = 'tasks-by-folder-view';

/** Wait this long after the last keystroke before the list is redrawn. */
const SEARCH_DELAY_MS = 150;

/** `Math/Algebra.md` becomes `Algebra`. */
function noteName(path: string): string {
	const file = path.slice(path.lastIndexOf('/') + 1);
	return file.endsWith('.md') ? file.slice(0, -3) : file;
}

/** Sidebar view that lists the open tasks of the vault, grouped by folder. */
export class TasksByFolderView extends ItemView {
	private readonly index: TaskIndex;
	private readonly getSettings: () => TasksByFolderSettings;

	private query = '';
	private onlyOverdue = false;
	private listEl!: HTMLElement;

	/** Which task a rendered row belongs to. One click handler on the list finds it through this map. */
	private taskByRow = new WeakMap<HTMLElement, VaultTask>();

	private readonly renderSoon = debounce(() => this.renderList(), SEARCH_DELAY_MS, true);

	constructor(leaf: WorkspaceLeaf, index: TaskIndex, getSettings: () => TasksByFolderSettings) {
		super(leaf);
		this.index = index;
		this.getSettings = getSettings;
	}

	getViewType(): string {
		return VIEW_TYPE_TASKS_BY_FOLDER;
	}

	getDisplayText(): string {
		return 'Tasks by folder';
	}

	getIcon(): string {
		return 'list-checks';
	}

	async onOpen(): Promise<void> {
		const root = this.contentEl;
		root.empty();
		root.addClass('tasks-by-folder-view');

		const controls = root.createDiv({ cls: 'tasks-by-folder-controls' });

		const search = controls.createEl('input', {
			cls: 'tasks-by-folder-search',
			attr: { type: 'search', placeholder: 'Search tasks', 'aria-label': 'Search tasks' },
		});
		this.registerDomEvent(search, 'input', () => {
			this.query = search.value;
			this.renderSoon();
		});

		const toggle = controls.createEl('label', { cls: 'tasks-by-folder-toggle' });
		const overdueBox = toggle.createEl('input', { attr: { type: 'checkbox' } });
		toggle.createSpan({ text: 'Overdue only' });
		this.registerDomEvent(overdueBox, 'change', () => {
			this.onlyOverdue = overdueBox.checked;
			this.renderList();
		});

		this.listEl = root.createDiv({ cls: 'tasks-by-folder-list' });

		// One listener for all rows. Adding one per row would pile up with every redraw.
		this.registerDomEvent(this.listEl, 'click', (evt) => this.onRowActivated(evt));
		this.registerDomEvent(this.listEl, 'auxclick', (evt) => this.onRowActivated(evt));
		this.registerDomEvent(this.listEl, 'keydown', (evt) => {
			if (evt.key === 'Enter' || evt.key === ' ') {
				evt.preventDefault();
				this.onRowActivated(evt);
			}
		});

		this.register(this.index.onChange(() => this.renderList()));
		this.register(() => this.renderSoon.cancel());

		this.renderList();
	}

	private renderList(): void {
		const today = toDateString(new Date());
		const settings = this.getSettings();

		const filter = { query: this.query, onlyOverdue: this.onlyOverdue, showCompleted: settings.showCompleted };
		const tasks = filterTasks(this.index.getTasks(), filter, today);

		this.listEl.empty();
		this.taskByRow = new WeakMap();

		if (tasks.length === 0) {
			const filtered = this.query.trim() !== '' || this.onlyOverdue;
			this.listEl.createDiv({
				cls: 'tasks-by-folder-empty',
				text: filtered ? 'No tasks match the filter.' : 'No open tasks.',
			});
			return;
		}

		for (const group of groupByFolder(tasks, today)) {
			const groupEl = this.listEl.createDiv({ cls: 'tasks-by-folder-group' });

			const header = groupEl.createDiv({ cls: 'tasks-by-folder-group-header' });
			header.createSpan({ cls: 'tasks-by-folder-group-name', text: group.folder === '' ? 'No folder' : group.folder });
			header.createSpan({ cls: 'tasks-by-folder-group-count', text: String(group.tasks.length) });

			for (const task of group.tasks) {
				this.renderRow(groupEl, task, today);
			}
		}
	}

	private renderRow(parent: HTMLElement, task: VaultTask, today: string): void {
		const overdue = isOverdue(task, today);

		const row = parent.createDiv({
			cls: 'tasks-by-folder-item',
			attr: { role: 'button', tabindex: '0' },
		});
		row.toggleClass('is-overdue', overdue);
		row.toggleClass('is-done', task.status !== 'open');

		row.createDiv({ cls: 'tasks-by-folder-item-text', text: task.text === '' ? '(empty task)' : task.text });

		const meta = row.createDiv({ cls: 'tasks-by-folder-item-meta' });
		if (task.due !== null) {
			meta.createSpan({ cls: 'tasks-by-folder-item-due', text: task.due });
		}
		meta.createSpan({ cls: 'tasks-by-folder-item-note', text: noteName(task.path) });

		this.taskByRow.set(row, task);
	}

	private onRowActivated(evt: MouseEvent | KeyboardEvent): void {
		// A plain click is `click`; a middle click arrives as `auxclick` with button 1. Ignore the right button.
		if (evt instanceof MouseEvent && evt.type === 'auxclick' && evt.button !== 1) return;

		const target = evt.target;
		if (!(target instanceof HTMLElement)) return;

		const row = target.closest<HTMLElement>('.tasks-by-folder-item');
		const task = row ? this.taskByRow.get(row) : undefined;
		if (!task) return;

		void this.openTask(task, evt);
	}

	/** Opens the note and puts the cursor on the task. Ctrl or Cmd (or a middle click) opens a new tab. */
	private async openTask(task: VaultTask, evt: MouseEvent | KeyboardEvent): Promise<void> {
		const { workspace, vault } = this.app;

		const file = vault.getFileByPath(task.path);
		if (!file) {
			new Notice(`Could not find the note ${task.path}.`);
			return;
		}

		const leaf = workspace.getLeaf(Keymap.isModEvent(evt));
		await leaf.openFile(file);

		const view = leaf.view;
		if (!(view instanceof MarkdownView)) return;

		const { editor } = view;
		const lines = editor.getValue().split('\n');
		const position = { line: locateLine(lines, task.line, task.raw), ch: 0 };

		editor.setCursor(position);
		editor.scrollIntoView({ from: position, to: position }, true);
	}
}
