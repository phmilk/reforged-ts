# The Studio beside the World Editor

The walk [#843](https://github.com/phmilk/reforged-ts/issues/843) left to a person: the Studio of Spec [#829](https://github.com/phmilk/reforged-ts/issues/829) run on the Template's map beside the World Editor, to check the turn-taking of [ADR 0015](../adr/0015-map-folder-owns-object-data-and-any-faithful-editor-may-edit-it.md) end to end and to compare the Objects area with the prototype of [#476](https://github.com/phmilk/reforged-ts/issues/476). Each claim is marked **Observed** (seen at the screen or read back from a file in the run below) or **Inferred** (follows from them, not observed).

## TL;DR

- **The World Editor reloads the map it holds on `-launch -loadfile` only right after it saved that map itself** (Observed, eight sends). Otherwise it shows "The file '<path>' is already open and active." and keeps the map as it loaded it, while the Studio's toast says "The World Editor reloads the map." [#871](https://github.com/phmilk/reforged-ts/issues/871).
- **A World Editor save that puts back the Studio's last save is detected** (Observed): "A World Editor save put back 1 field the Studio had saved", with "Apply them again", "Show" and "Keep the World Editor's", each of which works. When the World Editor never loaded the Studio's save before the last one, its value is a third one and nothing is offered (Observed). Together with the reload above, an edit can be lost without a word (Inferred).
- **The rest of ADR 0015's behaviour holds** (Observed): the Studio creates, edits and deletes objects, reloads on a change on disk, refuses to save while the World Editor's title ends in ` *]`, merges its unsaved edits on top of a World Editor save, shows Object definitions read-only, and loses nothing across five World Editor saves while it runs.
- **An Object definition shows its base's values** (Observed), not its own: [#872](https://github.com/phmilk/reforged-ts/issues/872).
- **The layout is #476's** (Observed): A's tabs, tree and field table, C's global search and "Differs from", B's Table mode, the Diff of unsaved changes and since the last commit, icon and model pickers with a live preview. The differences that matter are [#873](https://github.com/phmilk/reforged-ts/issues/873), [#874](https://github.com/phmilk/reforged-ts/issues/874) and [#875](https://github.com/phmilk/reforged-ts/issues/875).

## The run

2026-11-05, Build 3.0.1.24371, Windows 11. Screen checks, which stay for a human ([`probe/README.md`](../../probe/README.md#what-stays-for-a-human)): one person at the World Editor and a browser, the files read back from disk between the steps; no Probe runs. The library at master `1c92698c`, built in a Windows clone; the Template's `main` in another, pointed at it with `pnpm use:local`. The Template's `tsconfig.base.json` names `reforged-types/3.0.0`, which master no longer ships, so the build failed until it named 3.0.1 ([reforged-ts-template#147](https://github.com/phmilk/reforged-ts-template/issues/147)). The Studio ran from the bin:

```sh
node <reforged-ts>/packages/reforged-studio/dist/cli/studio.js --map reforged-ts-template.w3m --project . --world-editor "C:\Program Files (x86)\Warcraft III\_retail_\x86_64\World Editor.exe"
```

It ran without `--world-editor` at first. With no default for it, a save offered no reload and the "Reload the World Editor after a save" box did nothing (Observed): [#873](https://github.com/phmilk/reforged-ts/issues/873).

## A save, and a reload in the World Editor

A Custom unit `h000` made with "New object" from the Footman, its Name set to "Studio Footman" and Hit Points Maximum (Base) to 999, then 1000, with the box ticked (Observed):

- The save wrote `war3map.w3u` (`h000` from `hfoo`, `uhpm` 999), `war3mapSkin.w3u` (`unam` = `TRIGSTR_007`) and `war3map.wts` (STRING 7, "Studio Footman", under the comment `// Units: h000 (Studio Footman), Name (Name)`).
- On the second save the World Editor reloaded in the same process: a few dialogs flashed, the map's clock went back to zero, and the title changed from `[c/Users/…]` (the map opened through File, Open) to `[C:/Users/…]` (the path `-loadfile` gave). The Object Editor, open across the reload, then listed Custom Units (1), Studio Footman, 1000 hit points.
- F5 kept the box ticked.
- The field table showed "Differs from Footman (hfoo) (2)" with each base value ("was Footman", "was 420"), and an unsaved edit with a bar and a reset icon.

### When the World Editor reloads

Each send with the World Editor holding the map without unsaved edits; the Studio's check said `"open"` each time (Observed):

| Send                                  | The World Editor before it       | Result                                             |
| ------------------------------------- | -------------------------------- | -------------------------------------------------- |
| Studio save, 1000                     | had saved the map itself         | reloaded                                           |
| Studio save, 1234                     | had just been reloaded           | the warning, no reload                             |
| Studio save, 1234 again               | had opened the map in File, Open | the warning, no reload                             |
| `reloadWorldEditor` by hand           | had saved the map itself         | reloaded, and the warning showed too               |
| Studio save, "Apply them again"       | had just been reloaded           | the warning, no reload                             |
| by hand, the whole path in lower case | the same                         | the warning, naming the lower-case path: no reload |
| Studio save, the delete below         | had saved the map itself         | reloaded, no warning                               |
| Studio save, a new object             | had just been reloaded           | the warning, no reload                             |

The warning is a modal "Warning" with an OK button, naming the map folder's path as `-loadfile` gave it. The editor compares the path without case (Observed, the sixth row). Its save writes a new folder and swaps it in (ADR 0015), which would explain why a reload is accepted right after it (Inferred). How to reload reliably is [#871](https://github.com/phmilk/reforged-ts/issues/871).

## A World Editor save that reverts a Studio save

- **Not detected, a third value** (Observed). With the World Editor holding 1000 (the reload of the 1234 save never reached it), the Studio saved 1234, then 2000 with the box unticked; the toast offered "Reload in the World Editor". The World Editor then placed a unit and saved: `uhpm` went back to 1000 on disk. The Studio said "The map folder changed on disk: the Studio read it again." and showed 1000, with no offer: 1000 is neither the value before its last save (1234) nor the one it wrote (2000), as the rule of [the Studio's README](../../packages/reforged-studio/README.md#taking-turns-with-the-world-editor) says.
- **Detected** (Observed). With the World Editor holding 1000 and the Studio's last save 1000 to 1234, a World Editor save put 1000 back. The Studio showed "A World Editor save put back 1 field the Studio had saved: h000 uhpm." with "Apply them again", "Show" and "Keep the World Editor's".
- **"Apply them again"** set 1234 as one unsaved edit, "Applied them again as unsaved edits: save to write them.", and the save wrote it (Observed).
- **"Keep the World Editor's"**, after the next revert, left 1000 and no unsaved edit, "Kept the World Editor's values." (Observed).

## A delete with placements

The World Editor placed a Studio Footman and saved. "Delete" on `h000` (Observed):

- The dialog "Delete a unit h000?" said: "Deleting h000 removes it from the map folder's Object data at the next save. It is placed 1 time on the terrain, in war3mapUnits.doo. The Studio leaves that placement there: the game already skips it, and the World Editor drops it without asking at its next save."
- The first save was refused, since the World Editor held an unsaved placement: "Not saved: The World Editor shows unsaved edits for C:\…\reforged-ts-template.w3m (its title ends in " *]"): nothing was written. Save or discard them in the World Editor first, then save again." Nothing was written; the delete stayed as one unsaved edit.
- The World Editor saved. The Studio, with that unsaved edit, showed "The map folder changed on disk; your unsaved edits are kept." with "Reload and keep my edits on top", and that gave "Reloaded the map folder and put 1 edit on top." The banner stayed on screen a moment after the merge ([#875](https://github.com/phmilk/reforged-ts/issues/875)).
- The save wrote `war3map.w3u` with no Custom object, dropped STRING 7 from `war3map.wts`, and left `war3mapUnits.doo` with its placement. The World Editor reloaded (a World Editor save had come just before), and the placed Studio Footman was gone from the terrain, the two built-in units beside it still there.

## Object definitions, read-only

A Custom unit `h001` from the Rifleman, Name "Code Rifleman", saved, then "Adopt into code" (Observed):

- "Adopted the unit h001 into src/objects/unit/CodeRifleman_h001.ts.": `defineUnit({ rawcode: "h001", base: FourCC("hrif"), fields: { unam: "Code Rifleman" } })`, and an `object-manifest.json` that owns it. The map folder was not written.
- The tree moved it under Object definitions (1), with a lock. Its header reads "🔒 Object definition · src/objects/unit/CodeRifleman_h001.ts" and "Read-only: defined in src/objects/unit/CodeRifleman_h001.ts, line 4.", with "Open in editor" and only Compare left of the actions. Values are text with no picker, and a click edits nothing.
- Its field table shows the Rifleman's values: Name reads "Rifleman", with no "Differs from"; the Table mode counts 0 changed fields. [#872](https://github.com/phmilk/reforged-ts/issues/872).
- The runtime file `.reforged-studio.json` showed as untracked in the Map project, which [reforged-ts-template#145](https://github.com/phmilk/reforged-ts-template/issues/145) already covers.

## No map file held open

Five World Editor saves while the Studio ran (19:27 to 20:04) each wrote the whole folder, and the Studio read it again after each (Observed). No save lost a file: the folder's file list stayed the same throughout, and the World Editor raised no error. ADR 0015 notes that a held file loses imports without an error, and this map has none, so the walk does not test that part (Inferred): [#876](https://github.com/phmilk/reforged-ts/issues/876) walks a map with imports.

## Compared with #476

As decided (Observed unless marked):

- A's layout: tabs per Object kind, a tree, a field table of Field, Id and Value, with display and raw values side by side ("Code Rifleman TRIGSTR_007", "Large (large)").
- The tree groups by origin first (Custom objects, Object definitions, Built-in objects), then the World Editor's grouping within a race: Campaign and Melee, then Heroes, Buildings and Units.
- C's global search (Ctrl+K) across the kinds: "rifle" found Code Rifleman (Units, Object definition chip with its file), Rifleman (Units, Built-in) and Long Rifles (Abilities and Upgrades, Built-in), each with its icon.
- C's "Differs from <base>" with each base value.
- B's Table mode: the map's objects and their changed columns by default, with "Show every object" and "Show every field".
- The origin chips (Custom, Object definition with 🔒 and its file, Built-in); a modified field highlighted, an unsaved edit with a stronger highlight and a bar.
- The Game data set named at the top ("Melee (Forsaken Kingdom)"), with "Show objects outside it".
- The Diff of unsaved changes, and since the last commit in the text `git diff` gives with the textconv driver.
- Icons in the tree, the header and the icon fields; the icon picker, a grid filtered by path with "Use this path".
- Model fields with a thumbnail and their path, and a model picker of 3473 paths searched by path, with a live 3D preview that follows the selection.
- The delete's confirmation names the placements; reset to base, copy, compare and undo across saves are offered.

The differences (Observed unless marked):

- The race groups read raw `WESTRING_RACE_*` keys, and three Human units (Dragonhawk Rider, Priest, Sorceress) have no icon: [#874](https://github.com/phmilk/reforged-ts/issues/874).
- Requirements shows `hbla` as text, not the linked chip #476 calls for; the walker missed "New object" and the Diff's second tab, the header overflows at a half-screen width, and a few labels: [#875](https://github.com/phmilk/reforged-ts/issues/875).
- After a quiet reload, the banner says "The map folder changed on disk: the Studio read it again." with Dismiss, without #476's "Show what changed" (Observed). Added to [#875](https://github.com/phmilk/reforged-ts/issues/875#issuecomment-6672456535): the Diff since the last commit is no substitute while the World Editor's change is not committed.
- Compare, Table mode bulk edits, the Rawcode suggestion and deep links to an unknown Rawcode were not walked: [#876](https://github.com/phmilk/reforged-ts/issues/876).
