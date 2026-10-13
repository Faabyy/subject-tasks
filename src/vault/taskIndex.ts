import { debounce, TFile } from 'obsidian';
import type { CachedMetadata, Debouncer, Plugin, TAbstractFile } from 'obsidian';
import type { VaultTask } from '../model/types';
import { toVaultTasks } from '../model/vaultTasks';
import type { TasksByFolderSettings } from '../settings/settings';
import { parseTasks } from '../parser/taskParser';
import type { ParsedTask } from '../parser/taskParser';

export interface IndexStats {
	/** Markdown notes in the vault. */
	notes: number;
	/** Notes that contain at least one task. */
	notesWithTasks: number;
	/** Tasks of any status. */
	tasks: number;
	durationMs: number;
}

/** How many notes are read at the same time during a full rebuild. */
const READ_BATCH_SIZE = 32;

/** How long to wait after the last change before listeners are told. */
const NOTIFY_DELAY_MS = 250;

/**
 * Line numbers Obsidian itself regards as tasks in this note.
 * Obsidian decides what is a task (for example it skips indented code), our
 * parser then reads the details of exactly those lines.
 */
function taskLines(cache: CachedMetadata | null): Set<number> {
	const lines = new Set<number>();
	for (const item of cache?.listItems ?? []) {
		if (item.task !== undefined) lines.add(item.position.start.line);
	}
	return lines;
}

function parseNote(content: string, cache: CachedMetadata | null): ParsedTask[] {
	const lines = taskLines(cache);
	if (lines.size === 0) return [];
	return parseTasks(content).filter((task) => lines.has(task.line));
}

/**
 * Keeps the tasks of all notes in memory.
 *
 * Full build: only notes that the metadata cache says contain tasks are read.
 * Afterwards single notes are updated from the `changed`, `deleted` and
 * `rename` events; the `changed` event brings the content, so nothing is read again.
 */
export class TaskIndex {
	private readonly plugin: Plugin;
	private readonly getSettings: () => TasksByFolderSettings;

	private tasksByPath = new Map<string, ParsedTask[]>();
	private readonly listeners = new Set<() => void>();
	private readonly notifyListeners: Debouncer<[], void>;

	/** Paths changed by events while a full build is running; their data is newer than what the build reads. */
	private readonly touched = new Set<string>();
	private building: Promise<IndexStats> | null = null;

	constructor(plugin: Plugin, getSettings: () => TasksByFolderSettings) {
		this.plugin = plugin;
		this.getSettings = getSettings;
		this.notifyListeners = debounce(
			() => {
				for (const listener of this.listeners) listener();
			},
			NOTIFY_DELAY_MS,
			true,
		);
	}

	/** Registers the vault events and starts the first build once Obsidian's layout is ready. */
	start(): void {
		const { app } = this.plugin;

		this.plugin.register(() => this.notifyListeners.cancel());

		this.plugin.registerEvent(
			app.metadataCache.on('changed', (file, data, cache) => {
				if (file.extension !== 'md') return;
				this.setNote(file.path, parseNote(data, cache));
			}),
		);

		this.plugin.registerEvent(
			app.metadataCache.on('deleted', (file) => {
				if (file.extension !== 'md') return;
				this.setNote(file.path, []);
			}),
		);

		this.plugin.registerEvent(
			app.vault.on('rename', (file: TAbstractFile, oldPath: string) => {
				if (!(file instanceof TFile) || file.extension !== 'md') return;
				this.moveNote(oldPath, file.path);
			}),
		);

		// Notes whose metadata is not ready yet are skipped by the build and arrive later through `changed`.
		app.workspace.onLayoutReady(() => {
			void this.rebuild();
		});
	}

	/** Calls `listener` (debounced) whenever the set of tasks has changed. Returns a function that removes it. */
	onChange(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	/** All tasks of notes that are inside the root folder and not excluded, in no particular order. */
	getTasks(): VaultTask[] {
		const settings = this.getSettings();
		const result: VaultTask[] = [];
		for (const [path, tasks] of this.tasksByPath) {
			result.push(...toVaultTasks(path, tasks, settings));
		}
		return result;
	}

	/** Throws away the index and reads the vault again. A call during a running build returns that build. */
	rebuild(): Promise<IndexStats> {
		this.building ??= this.build().finally(() => {
			this.building = null;
		});
		return this.building;
	}

	private async build(): Promise<IndexStats> {
		const { vault, metadataCache } = this.plugin.app;
		const startedAt = performance.now();

		this.touched.clear();
		const fresh = new Map<string, ParsedTask[]>();
		const notes = vault.getMarkdownFiles();

		// Only notes with tasks are read at all.
		const candidates = notes.filter((file) => taskLines(metadataCache.getFileCache(file)).size > 0);

		for (let i = 0; i < candidates.length; i += READ_BATCH_SIZE) {
			const batch = candidates.slice(i, i + READ_BATCH_SIZE);
			await Promise.all(
				batch.map(async (file) => {
					try {
						const content = await vault.cachedRead(file);
						// An event delivered newer data for this note while we were reading.
						if (this.touched.has(file.path)) return;
						const tasks = parseNote(content, metadataCache.getFileCache(file));
						if (tasks.length > 0) fresh.set(file.path, tasks);
					} catch (error) {
						console.error(`Tasks by folder: could not read ${file.path}`, error);
					}
				}),
			);
		}

		// Take over what events changed while the build ran.
		for (const path of this.touched) {
			const tasks = this.tasksByPath.get(path);
			if (tasks) fresh.set(path, tasks);
			else fresh.delete(path);
		}
		this.touched.clear();

		this.tasksByPath = fresh;
		this.notifyListeners();

		let taskCount = 0;
		for (const tasks of fresh.values()) taskCount += tasks.length;

		return {
			notes: notes.length,
			notesWithTasks: fresh.size,
			tasks: taskCount,
			durationMs: performance.now() - startedAt,
		};
	}

	/** Stores the tasks of one note. An empty list removes the note from the index. */
	private setNote(path: string, tasks: ParsedTask[]): void {
		this.touched.add(path);
		const hadTasks = this.tasksByPath.has(path);

		if (tasks.length > 0) this.tasksByPath.set(path, tasks);
		else this.tasksByPath.delete(path);

		// Notes without tasks are edited all the time; only tell listeners if something relevant changed.
		if (tasks.length > 0 || hadTasks) this.notifyListeners();
	}

	private moveNote(oldPath: string, newPath: string): void {
		this.touched.add(oldPath);
		this.touched.add(newPath);

		const tasks = this.tasksByPath.get(oldPath);
		if (!tasks) return;

		this.tasksByPath.delete(oldPath);
		this.tasksByPath.set(newPath, tasks);
		this.notifyListeners();
	}
}
