import { Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, SubjectTasksSettings } from './settings/settings';
import { SubjectTasksSettingTab } from './settings/SubjectTasksSettingTab';
import { TaskIndex } from './vault/taskIndex';

export default class SubjectTasksPlugin extends Plugin {
	settings!: SubjectTasksSettings;
	index!: TaskIndex;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SubjectTasksSettingTab(this.app, this));

		this.index = new TaskIndex(this, () => this.settings);
		this.index.start();

		this.addCommand({
			id: 'refresh',
			name: 'Refresh task index',
			callback: () => {
				void this.refreshIndex();
			},
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
