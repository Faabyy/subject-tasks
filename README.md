# Tasks by folder

An [Obsidian](https://obsidian.md) plugin that shows the open tasks of your whole vault in one sidebar view, grouped by folder and sorted by due date.

Open tasks (`- [ ]`) tend to end up scattered over dozens of notes. This plugin collects them in one place, grouped by the folder they live in, so you can see what is due without opening every note. I first built it for my school notes, with one folder per subject. It works for any folder structure: courses, projects, clients, areas of life.

> **Not tested on mobile yet.** The plugin uses no Node or Electron APIs and is built to work on mobile, but I have only tested it on desktop (Obsidian 1.14.4).

## What it does

- **One list for the whole vault.** Open the view from the command palette and see every open task.
- **Grouped by folder.** A group is the first folder below a root folder you choose. With no root folder set, it is the first folder in the note's path. Notes that sit directly in the root are listed under "No folder".
- **Sorted by urgency.** Overdue tasks come first, then tasks by due date (today included), then tasks without a date.
- **Overdue tasks stand out.** They get the CSS class `is-overdue` and a red date.
- **Click to jump.** Clicking a task opens its note with the cursor on that line. Hold <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> or middle-click to open it in a new tab. If the note changed in the meantime, the plugin looks for the task's line instead of trusting the old line number.
- **Tick tasks from the list.** Click the checkbox to mark a task done or open again. The plugin changes only the character between the brackets (`[ ]` and `[x]`) and writes nothing if the note has changed since the list was drawn (see [Safety when ticking](#safety-when-ticking)).
- **Filters.** Search by words (all words must match the task text or the note path) and an "Overdue only" switch.
- **Always up to date.** Editing, renaming or deleting notes updates the list within a moment.

## Safety when ticking

Ticking a task is the only thing this plugin ever writes to your notes. To keep it safe:

- Only the character inside the brackets changes. The rest of the line, all other lines and the line endings stay exactly as they were.
- The check and the write happen in one step (`Vault.process`). The line must still be exactly the line the list showed, at the same position. If you edited the note, or lines moved, in the meantime, nothing is written and you get a notice. Tick again once the list has updated.
- Tasks with a custom status such as `[/]` or `[-]` are shown, but their checkbox is disabled. Only open and done tasks can be ticked.
- No completion date is added.

## Commands

| Command | What it does |
| --- | --- |
| Open view | Shows the task list in the right sidebar. |
| Refresh task index | Reads the vault again and shows how many tasks were found and how long it took. Normally not needed. |

The plugin sets no default hotkeys. You can assign your own under *Settings → Hotkeys*.

## How tasks are recognized

A task is a Markdown list item with a checkbox. Obsidian decides what counts as a task (this plugin asks Obsidian's own metadata cache), and the plugin then reads the details from that line.

| Written as | Recognized |
| --- | --- |
| `- [ ] text`, `* [ ] text`, `+ [ ] text` | yes |
| `1. [ ] text`, `1) [ ] text` | yes |
| Tasks nested in other lists | yes |
| Tasks inside quotes and callouts (`> - [ ] text`) | yes |
| `[x]` or `[X]` | done |
| Other characters, such as `[/]` or `[-]` | custom status |
| Inside code blocks or frontmatter | no |
| An empty `- [ ]` with no text, or `- [ ]text` | no (Obsidian does not treat these as tasks either) |

**Due date.** Write `📅 2026-10-20` anywhere in the task, the same format the [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) plugin uses.

- The date must be real: `2026-02-30` is ignored and stays visible in the task text, so you can spot the typo.
- With several `📅` dates in one task, the last valid one counts.
- Other date formats and other emoji (such as ⏳ or ✅) are not read.

By default only open tasks are shown. Done tasks and tasks with a custom status appear only with the *Show completed tasks* option.

## Settings

| Setting | Default | Meaning |
| --- | --- | --- |
| Root folder | empty (whole vault) | Tasks are grouped by the first folder below this one. |
| Excluded folders | none | Notes in these folders are ignored. |
| Show completed tasks | off | Also list done tasks and tasks with a custom status. |

Changes apply right away, and the list redraws. Paths are cleaned up when you type them (backslashes, leading and trailing slashes, spaces around parts), and a path that cannot be a folder inside the vault, such as one with `..` or a `:`, is rejected with a message instead of being saved. If the root folder does not exist, the list says so instead of just being empty. A settings file that is missing, damaged or edited by hand never stops the plugin from starting: every invalid value falls back to its default.

The settings screen uses Obsidian's search-friendly settings on version 1.13 and newer, and a classic settings page on older versions.

## Installation

The plugin is not in the community plugin directory yet. Until it is, install a release by hand:

1. Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/Faabyy/tasks-by-folder/releases/latest).
2. Put the three files in `<your vault>/.obsidian/plugins/tasks-by-folder/`. The folder name must be `tasks-by-folder`.
3. Turn off restricted mode (*Settings → Community plugins*) and enable *Tasks by folder*.

To build it yourself instead, clone this repository into that folder and run `npm install` and `npm run build` there.

It needs Obsidian **1.7.2** or newer. It uses no Node or Electron APIs and is built to work on mobile, but I have not tested it there.

Try it in a separate test vault first, not in your real notes. The folder `test-vault-samples/` contains invented notes with the edge cases this plugin handles.

## Why another task plugin?

There are good task plugins already. If you want a lot of features, use one of them:

- [Taskgregator](https://community.obsidian.md/plugins/taskgregator) is a full task dashboard with priorities, smart lists and editing.
- [Sidebar Task Hub](https://github.com/kamil-bartczak/obsidian-sidebar-task-hub) lists tasks in the sidebar, grouped by folder, file and heading.
- [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) can group by the top-level folder with `group by root`, but only inside query blocks in a note, not in a sidebar.

This plugin is deliberately small:

1. **Folder-shaped.** The group is simply the first folder, with no setup beyond an optional root folder.
2. **One fixed order.** Overdue, then by date, then undated. There is nothing to configure or query.
3. **Notes stay the only source of truth.** There are no priorities, no recurring tasks, no query language, no database, no sync and no network access.
4. **Minimal changes to your notes.** The only thing it writes is the checkbox, and only if the line is unchanged.
5. **Code you can read.** The parser and the sorting are plain functions with unit tests and no Obsidian dependency.

This comparison is based on the other plugins' documentation pages, not on long-term use. Details may have changed.

## Development

Node.js 22.12 or newer is needed for the tests (Vitest 5 requires it). Building the plugin works on older versions too.

```
npm install
npm run dev     # builds main.js and rebuilds on every change
npm run build   # type check and production build
npm test        # unit tests (Vitest)
npm run test:coverage  # unit tests with a coverage report
npm run typecheck      # TypeScript only, strict
npm run lint    # ESLint with the Obsidian plugin rules
```

For quick reloads in a test vault, install the [Hot Reload](https://github.com/pjeby/hot-reload) plugin and add an empty file named `.hotreload` to the plugin folder.

Project layout:

```
src/
  main.ts            wiring only: settings, commands, view registration
  parser/            task lines to tasks (pure functions, unit tested)
  model/             folders, sorting, grouping, filtering (pure, unit tested)
  vault/taskIndex.ts keeps all tasks in memory and follows vault changes
  view/              the sidebar view
  settings/          settings and the settings tab
scripts/             generate a large fake vault, measure parsing outside Obsidian
test-vault-samples/  invented notes for trying the plugin in a test vault
```

Reading the whole vault is fast: in a generated vault of 2000 notes (about 5500 tasks), *Refresh task index* takes around 20 ms in Obsidian on a desktop PC. Generate your own with `node scripts/generate-vault.mjs <empty folder> 2000`.

## Quality

- **Strict TypeScript** (`strict`, plus unused code, `override`, exact optional properties and more) and ESLint with the Obsidian plugin rules. The type check and ESLint run in CI on every push.
- **Unit tests** cover the parser, folders, sorting, grouping, filtering, the ticking logic and the settings cleanup. These pure modules have 100% line coverage and about 96% branch coverage, and the test run fails if they drop (see `vitest.config.mjs`). `npm run test:coverage` shows the current numbers.
- **The code that talks to Obsidian** (the view, the index, the settings tab) is not unit tested; counted over all of `src` the line coverage is about 36%. It is checked by hand with [docs/manual-test-checklist.md](docs/manual-test-checklist.md). The checklist also says what has been tested so far: Obsidian 1.14.4 on desktop. Not tested yet: mobile, and Obsidian versions before 1.13.

## Privacy

Tasks by folder reads the Markdown notes in your vault to find tasks. It makes no network requests, collects no data, and keeps nothing outside your vault except its own settings file.

## License

[MIT](LICENSE).

---

Co-Authored-By: Claude Code
