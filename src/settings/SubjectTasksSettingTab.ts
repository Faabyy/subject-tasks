import { App, PluginSettingTab, Setting } from 'obsidian';
import type SubjectTasksPlugin from '../main';

export class SubjectTasksSettingTab extends PluginSettingTab {
	plugin: SubjectTasksPlugin;

	constructor(app: App, plugin: SubjectTasksPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Placeholder until phase 5 adds the full set of options.
		new Setting(containerEl)
			.setName('Root folder')
			.setDesc(
				'Folder whose subfolders are the subjects. Leave empty to use the whole vault.',
			)
			.addText((text) =>
				text
					.setPlaceholder('School')
					.setValue(this.plugin.settings.rootFolder)
					.onChange(async (value) => {
						this.plugin.settings.rootFolder = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
