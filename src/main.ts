import { Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, SubjectTasksSettings } from './settings/settings';
import { SubjectTasksSettingTab } from './settings/SubjectTasksSettingTab';
import { TaskIndex } from './vault/taskIndex';
import { SubjectTasksView, VIEW_TYPE_SUBJECT_TASKS } from './view/SubjectTasksView';

export default class SubjectTasksPlugin extends Plugin {
	settings!: SubjectTasksSettings;
	index!: TaskIndex;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SubjectTasksSettingTab(this.app, this));

		this.index = new TaskIndex(this, () => this.settings);
		this.index.start();

		this.registerView(
			VIEW_TYPE_SUBJECT_TASKS,
			(leaf) => new SubjectTasksView(leaf, this.index, () => this.settings),
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
		await this.app.workspace.ensureSideLeaf(VIEW_TYPE_SUBJECT_TASKS, 'right', {
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
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<SubjectTasksSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
