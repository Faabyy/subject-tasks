# Manual test checklist

The code that talks to Obsidian (the sidebar view, the index, the settings tab, `main.ts`) cannot be unit tested without Obsidian. Run through this list before a release. Use a **separate test vault** with invented notes, never your real notes. The folder `test-vault-samples/` has notes made for this, and `node scripts/generate-vault.mjs <empty folder> 2000` makes a large vault.

Mark each line with the Obsidian version and platform you tested it on.

## Setup

- [ ] The plugin folder is named `tasks-by-folder` (the plugin id).
- [ ] The plugin is listed under *Settings → Community plugins* and can be enabled and disabled without errors in the developer console (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd>).
- [ ] After a restart of Obsidian the plugin is still enabled and the view comes back.

## The list

- [ ] *Tasks by folder: Open view* opens the view in the right sidebar. Running it again brings the same view to the front and does not open a second one.
- [ ] Tasks are grouped by the first folder below the root folder. Notes outside any folder are under "No folder".
- [ ] Order inside a group: overdue first (most overdue on top), then by due date (today included), then tasks without a date.
- [ ] Overdue dates are red. A task due today is not.
- [ ] Notes without tasks never appear. Tasks in code blocks, frontmatter and indented code blocks never appear.
- [ ] Search finds words in the task text and in the note path. Several words must all match.
- [ ] *Overdue only* keeps only overdue tasks.
- [ ] An empty list says "No open tasks." or "No tasks match the filter."

## Following the vault

- [ ] Adding a task line to a note shows it in the list within a few seconds.
- [ ] Editing a task's text or date updates it.
- [ ] Renaming a note keeps its tasks in the list, under the new name or folder.
- [ ] Moving a note to another folder moves its tasks to the other group.
- [ ] Deleting a note removes its tasks.
- [ ] *Tasks by folder: Refresh task index* shows a notice with the number of tasks, notes and the time.

## Opening a task

- [ ] Clicking the text opens the note with the cursor on the task's line.
- [ ] <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+click or middle-click opens a new tab.
- [ ] <kbd>Enter</kbd> and <kbd>Space</kbd> on a focused task open the note.
- [ ] If lines were added above the task a moment ago, the cursor still lands on the task.
- [ ] A task of a note that was deleted a moment ago shows a notice and does not break the list.

## Ticking tasks (writes to notes)

- [ ] Ticking an open task changes `[ ]` to `[x]` in the note and nothing else on that line or in the note.
- [ ] With *Show completed tasks* on, unticking a done task changes `[x]` or `[X]` back to `[ ]`.
- [ ] It works for `-`, `*`, `+`, numbered lists (`1.`, `1)`), nested tasks, and tasks in quotes and callouts.
- [ ] The tick keeps the indentation, the due date and other text on the line.
- [ ] A task with a custom status such as `[/]` has a disabled checkbox.
- [ ] **Stale list:** edit the note so that lines move (or the text changes) and tick the old entry right away. A notice says nothing was written, the note is unchanged, and the list redraws. (The developer console snippet in the project notes does this reliably in one step.)
- [ ] After a refused tick, the file's modification time did not change.
- [ ] Notes with Windows line endings keep them.
- [ ] The keyboard works: <kbd>Tab</kbd> to the checkbox, <kbd>Space</kbd> ticks.

## Settings

- [ ] *Root folder*: setting a folder shows only tasks below it, with its subfolders as groups. A folder that does not exist gives a clear message in the list.
- [ ] A root folder such as `../x` or `a|b` is rejected with a message and not saved.
- [ ] *Excluded folders*: listed folders (and their subfolders) disappear from the list. Blank lines and duplicates are ignored.
- [ ] *Show completed tasks* shows or hides done tasks without a reload.
- [ ] The values survive a restart.
- [ ] A damaged `data.json` (for example `"excludedFolders": "oops"`) does not stop the plugin from loading.
- [ ] Obsidian 1.13 or newer: the settings show up in the settings search.
- [ ] Obsidian before 1.13: the classic settings page shows the same three settings and the same messages. **Not yet tested on a real old version.**

## Other windows, themes, size

- [ ] The view works in a popout window (right-click the tab, *Move to new window*): clicking and ticking work there too.
- [ ] Light and dark theme and a community theme: text, the red date and hover colors are readable.
- [ ] A 2000-note vault: *Refresh task index* takes well under a second, and the view opens and scrolls without noticeable delay.

## Mobile (Obsidian on Android or iOS)

- [ ] The plugin loads (no desktop-only error) and the view opens from the sidebar or the command palette.
- [ ] Tapping a task opens the note. Tapping the checkbox ticks the task.
- [ ] The settings page is usable with the on-screen keyboard.

## Results

| Date | Obsidian version | Platform | Who | Result |
| --- | --- | --- | --- | --- |
| 2026-10-13 | 1.14.4 | Desktop, Linux | Fabian | List, opening, ticking, stale list and settings tested (new settings path). Not tested: mobile, popout window, Obsidian before 1.13. |
