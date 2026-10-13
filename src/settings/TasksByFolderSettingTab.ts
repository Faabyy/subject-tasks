import { App, PluginSettingTab, Setting } from 'obsidian';
import type TasksByFolderPlugin from '../main';

export class TasksByFolderSettingTab extends PluginSettingTab {
	plugin: TasksByFolderPlugin;

	constructor(app: App, plugin: TasksByFolderPlugin) {
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
				'Tasks are grouped by the first folder below this one. Leave empty to use the whole vault.',
			)
			.addText((text) =>
				text
					.setPlaceholder('Projects')
					.setValue(this.plugin.settings.rootFolder)
					.onChange(async (value) => {
						this.plugin.settings.rootFolder = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
