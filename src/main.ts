import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, SubjectTasksSettings } from './settings/settings';
import { SubjectTasksSettingTab } from './settings/SubjectTasksSettingTab';

export default class SubjectTasksPlugin extends Plugin {
	settings!: SubjectTasksSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SubjectTasksSettingTab(this.app, this));
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
