import { App, PluginSettingTab, Setting, normalizePath } from 'obsidian';
import type { SettingDefinitionItem } from 'obsidian';
import type TasksByFolderPlugin from '../main';
import { cleanFolderPath, parseFolderList, validateFolderList, validateFolderPath } from './normalizeSettings';

const ROOT_FOLDER = 'rootFolder';
const EXCLUDED_FOLDERS = 'excludedFolders';
const SHOW_COMPLETED = 'showCompleted';

const ROOT_FOLDER_DESC = 'Tasks are grouped by the first folder below this one. Leave empty to use the whole vault.';
const EXCLUDED_FOLDERS_DESC = 'Notes in these folders are ignored. Put each folder on its own line.';
const SHOW_COMPLETED_DESC = 'Also list done tasks and tasks with a custom status. Open tasks are always listed.';

/**
 * Settings tab.
 *
 * Obsidian 1.13 and newer draw the tab from `getSettingDefinitions()` and never
 * call `display()`. Older versions only know `display()`. The plugin supports
 * both (minAppVersion is below 1.13), so both are here and share the same
 * checks and the same `applyValue()`.
 */
export class TasksByFolderSettingTab extends PluginSettingTab {
	plugin: TasksByFolderPlugin;

	constructor(app: App, plugin: TasksByFolderPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	// ---- Obsidian 1.13 and newer ----

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'Root folder',
				desc: ROOT_FOLDER_DESC,
				control: {
					type: 'folder',
					key: ROOT_FOLDER,
					placeholder: 'Projects',
					validate: (value) => validateFolderPath(value) ?? undefined,
				},
			},
			{
				name: 'Excluded folders',
				desc: EXCLUDED_FOLDERS_DESC,
				control: {
					type: 'textarea',
					key: EXCLUDED_FOLDERS,
					placeholder: 'Archive',
					rows: 4,
					validate: (value) => validateFolderList(value) ?? undefined,
				},
			},
			{
				name: 'Show completed tasks',
				desc: SHOW_COMPLETED_DESC,
				control: { type: 'toggle', key: SHOW_COMPLETED },
			},
		];
	}

	getControlValue(key: string): unknown {
		switch (key) {
			case ROOT_FOLDER:
				return this.plugin.settings.rootFolder;
			case EXCLUDED_FOLDERS:
				return this.plugin.settings.excludedFolders.join('\n');
			case SHOW_COMPLETED:
				return this.plugin.settings.showCompleted;
			default:
				return undefined;
		}
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		await this.applyValue(key, value);
	}

	// ---- Obsidian before 1.13 ----

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const rootSetting = new Setting(containerEl).setName('Root folder').setDesc(ROOT_FOLDER_DESC);
		rootSetting.addText((text) =>
			text
				.setPlaceholder('Projects')
				.setValue(this.plugin.settings.rootFolder)
				.onChange(async (value) => {
					const message = validateFolderPath(value);
					this.showMessage(rootSetting, ROOT_FOLDER_DESC, message);
					if (message === null) await this.applyValue(ROOT_FOLDER, value);
				}),
		);

		const excludedSetting = new Setting(containerEl).setName('Excluded folders').setDesc(EXCLUDED_FOLDERS_DESC);
		excludedSetting.addTextArea((area) => {
			area.setPlaceholder('Archive')
				.setValue(this.plugin.settings.excludedFolders.join('\n'))
				.onChange(async (value) => {
					const message = validateFolderList(value);
					this.showMessage(excludedSetting, EXCLUDED_FOLDERS_DESC, message);
					if (message === null) await this.applyValue(EXCLUDED_FOLDERS, value);
				});
			area.inputEl.rows = 4;
		});

		new Setting(containerEl)
			.setName('Show completed tasks')
			.setDesc(SHOW_COMPLETED_DESC)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showCompleted).onChange(async (value) => {
					await this.applyValue(SHOW_COMPLETED, value);
				}),
			);
	}

	/** Replaces the description with an error message while the input is invalid, and restores it afterwards. */
	private showMessage(setting: Setting, description: string, message: string | null): void {
		setting.setDesc(message ?? description);
		setting.descEl.toggleClass('tasks-by-folder-setting-error', message !== null);
	}

	// ---- shared ----

	/** Stores one value, cleaned up, and saves. Only called with values that passed the checks above. */
	private async applyValue(key: string, value: unknown): Promise<void> {
		const { settings } = this.plugin;

		switch (key) {
			case ROOT_FOLDER: {
				const path = cleanFolderPath(String(value));
				settings.rootFolder = path === '' ? '' : normalizePath(path);
				break;
			}
			case EXCLUDED_FOLDERS:
				settings.excludedFolders = parseFolderList(String(value)).map((folder) => normalizePath(folder));
				break;
			case SHOW_COMPLETED:
				settings.showCompleted = value === true;
				break;
			default:
				return;
		}

		await this.plugin.saveSettings();
	}
}
