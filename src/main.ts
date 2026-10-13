import { Notice, Plugin } from 'obsidian';
import { normalizeSettings } from './settings/normalizeSettings';
import type { TasksByFolderSettings } from './settings/settings';
import { TasksByFolderSettingTab } from './settings/TasksByFolderSettingTab';
import { TaskIndex } from './vault/taskIndex';
import { TasksByFolderView, VIEW_TYPE_TASKS_BY_FOLDER } from './view/TasksByFolderView';

export default class TasksByFolderPlugin extends Plugin {
	override settings!: TasksByFolderSettings;
	index!: TaskIndex;

	override async onload() {
		await this.loadSettings();
		this.addSettingTab(new TasksByFolderSettingTab(this.app, this));

		this.index = new TaskIndex(this, () => this.settings);
		this.index.start();

		this.registerView(
			VIEW_TYPE_TASKS_BY_FOLDER,
			(leaf) => new TasksByFolderView(leaf, this.index, () => this.settings),
		);

		this.addCommand({
			id: 'open-view',
			name: 'Open view',
			callback: () => {
				void this.openView();
			},
		});

		this.addCommand({
			id: 'refresh',
			name: 'Refresh task index',
			callback: () => {
				void this.refreshIndex();
			},
		});
	}

	/** Shows the view in the right sidebar, or brings it to the front if it is already open. */
	private async openView() {
		await this.app.workspace.ensureSideLeaf(VIEW_TYPE_TASKS_BY_FOLDER, 'right', {
			active: true,
			reveal: true,
		});
	}

	private async refreshIndex() {
		const stats = await this.index.rebuild();
		new Notice(
			`Found ${stats.tasks} tasks in ${stats.notesWithTasks} of ${stats.notes} notes (${Math.round(stats.durationMs)} ms).`,
		);
	}

	async loadSettings() {
		// The file may be missing, edited by hand or damaged; normalizeSettings never throws.
		this.settings = normalizeSettings(await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// The list depends on the settings, so the view has to redraw.
		this.index.notifyChanged();
	}
}
