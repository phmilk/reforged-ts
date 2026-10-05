# Opening the World Editor's Object Editor on one Rawcode

Research for [#461](https://github.com/phmilk/reforged-ts/issues/461), part of the wayfinder map [#457](https://github.com/phmilk/reforged-ts/issues/457). Observed on 2026-10-05 on the maintainer's Windows 11 machine (OS locale pt-BR, game enUS), World Editor of Patch 3.0.0.24268 (`C:\Program Files (x86)\Warcraft III\_retail_\x86_64\World Editor.exe`), on a throwaway copy of the Template's map folder.

## Answer

The World Editor can be brought to one Rawcode of one map, but only by combining a command line, which opens the map, with window messages, which drive the Object Editor. No switch selects a module or an object, and no extension of the 3.0 editor exposes "open object".

| Way                                                                                                                                                               | Works?                                                                                                                                                                                                                                                                              | Cost                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Command line**: `World Editor.exe -launch -loadfile <map folder or file>`                                                                                       | **Opens the map, nothing more.** No switch picks the Object Editor, a tab or a Rawcode. When an editor already runs, the new process hands the file to it and exits, and the running editor **reloads the map from disk** (asking "Save changes?" first if it holds unsaved edits). | Windows only, the game installed, the path of `World Editor.exe` to find. No Battle.net login was asked (the Battle.net app was running). Cheap to keep across Patches: the same switches the editor itself uses to start Test Map.                                                                                                                                                                                                                                                                                                                                            |
| **Window messages** to the running editor (`WM_COMMAND` on its Win32 menus, `TCM_SETCURFOCUS` on the tab control, `WM_SETTEXT` and `BM_CLICK` in the Find dialog) | **Yes, end to end**: Object Editor opened, the Abilities tab chosen, `AHbz` selected; `hfoo`, a Custom object `h000` and one written to disk by another program (`h001`) as well. No focus and no keyboard simulation needed.                                                       | Windows only, an editor already running with the map open. About 150 lines of C# or PowerShell (or a native Node addon). Fragile against Patches in its constants (menu command ids, tab order, the "Display Values As Raw Data" label format), which a Patch can change silently; the dialog titles it matches follow the editor's locale. It cannot cheaply tell "found" from "not found": a failed Find shows no message, and the tree's text is readable only through the editor's process memory. It toggles a user preference (raw data display), to restore afterwards. |
| **Keyboard simulation** (F6, Ctrl+D, Ctrl+F through `SendInput`)                                                                                                  | Possible, not tried: everything it would do, the messages above do better.                                                                                                                                                                                                          | Needs the editor in the foreground, races with the user typing, breaks when the user rebinds keys (File > Configure Controls).                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **UI Automation**                                                                                                                                                 | Did not see the Object Editor's controls in this test (its tree showed no items).                                                                                                                                                                                                   | Not pursued further; the plain Win32 messages already reach every control.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Extensions** (JNGP, WEX/SharpCraft, YDWE)                                                                                                                       | **None for 3.0.** All target Patches 1.26 to 1.29, whose editor was replaced at Reforged; none ever offered "open object" to another process. HiveWE is a separate editor, not an extension.                                                                                        | Not an option.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

On disk changes: the World Editor **does not notice** a `war3map.w3u` (or `war3map.wts`) changed on disk while the map is open, and **any save rewrites every file of the map folder from memory**, even a save with nothing modified, so a change written by another program is silently lost unless the editor reloads the map first. A second `-launch -loadfile` on the same map is that reload.

## The recipe that worked

From an agent or an editor extension, to show `AHbz` of map `M`:

1. `World Editor.exe -launch -loadfile "<M>"`. If no editor runs, it starts one on `M`; if one runs, it reloads `M` in it (a "Save changes?" box first when the open map has unsaved edits: its buttons follow the OS locale, here `&Sim` / `&Não` / `Cancelar`, so press them by control id, `IDYES` 6 / `IDNO` 7, not by text).
2. Wait for the main window (class `OsWindow`) whose title is `Warcraft III World Editor - [<M>]`.
3. Post `WM_COMMAND` 1795 (Module > Object Editor, F6) to the main window. A dialog-class window (`#32770`) titled `Object Editor` appears, or comes back. Post it again after a reload: after the reload of step 1, the Object Editor ignored Find until the module was invoked again.
4. Choose the tab with `TCM_SETCURFOCUS` (`0x1330`) on its `SysTabControl32`, index 0 Units, 1 Items, 2 Destructibles, 3 Doodads, 4 Abilities, 5 Buffs/Effects, 6 Upgrades. `TCM_SETCURFOCUS` notifies the editor and the tab really changes; `TCM_SETCURSEL` would move the highlight only.
5. Make sure "Display Values As Raw Data" (command 524, Ctrl+D) is checked: `GetMenuState(GetMenu(objectEditor), 524, MF_BYCOMMAND) & MF_CHECKED`; post `WM_COMMAND` 524 if not. With it, the tree labels a Built-in object `hfoo (Footman)` and a Custom object `h000:hfoo (Probe Footman)` (its Rawcode, then the Rawcode it derives from). Without it, the labels are names only and Find does not match a Rawcode.
6. Post `WM_COMMAND` 260 (Edit > Find..., Ctrl+F) to the Object Editor. A dialog titled `Find` opens with one `Edit` and an `&OK` button (and a `Match Case` check box). `WM_SETTEXT` the Rawcode into the `Edit` and post `BM_CLICK` to `&OK`. The first matching object of the tab is selected and its fields shown.
7. Restore the raw data setting if step 5 changed it.

Find matches a substring of the label, in tree order, and the Built-in objects come before the Custom ones. To avoid matching the base Rawcode inside another label, search `hfoo (` for a Built-in object and `h000:` for a Custom object, with Match Case.

The tree is a `SysTreeView32`, the field list a `SysListView32`. Their item counts are readable by message (`TVM_GETCOUNT` gave 1003 items on the Units tab), but their texts only through memory allocated in the editor's process (`VirtualAllocEx`/`ReadProcessMemory`), which is why a tool cannot cheaply confirm what got selected.

## Detail

### The command line

`World Editor.exe` and `Warcraft III.exe` share one table of switches. The strings of `World Editor.exe` hold it in a row, and `Warcraft III.exe` holds the same table: `launch`, `crash`, `loadfile`, `gametype`, `region`, `locale`, `audiolocale`, `windowmode`, `width`, `vsync`, `nowfpause`, `plugin`, `graphicsapi`, `soundapi`, `csdk-aurora-dnsname`, `csdk-gameutil-filter`, `enablenagle`, `audioquality`, `legacykerning`, `editor`, `routerconfig`, `routerapp`, `automation`, `errordir`. None names a module, a window or an object. `automation` belongs with the game's internal test natives (`AutomationTestStart` and the like, whose names sit next to it), not with the editor's UI.

- `-launch` runs the executable without the Battle.net app launching it. Without it, from 1.32 on, the game and editor hand over to the Battle.net app ([Hive: How to launch map test with command line?](https://www.hiveworkshop.com/threads/how-to-launch-map-test-with-command-line.326160/), Drake53, 2020-07-22).
- `-loadfile <path>` opens a map in the editor: a map folder (observed) or a `.w3x`/`.w3m` file (as community scripts use it: [war3-pfx-boilerplate `runWorldEditor.bat`](https://github.com/wiselencave/war3-pfx-boilerplate/blob/main/runWorldEditor.bat), the "Open World Editor" command of the VS Code extension [warcraft-vscode](https://github.com/warcraft-iii/warcraft-vscode/blob/main/src/app/runner/editor.ts)). In the game, the same switch loads a map or a replay.
- `-editor` does **not** open the editor. It is what the editor passes to `Warcraft III.exe` for Test Map: its strings hold `"%s" -launch`, ` -editor`, ` -loadfile "`, ` -windowmode windowed` and `%s -testmapprofile %s`. The Probe runner starts the game the same way (`-loadfile <staged folder> -launch -editor -windowmode windowed`, [probe/README.md](../../probe/README.md)).

A Rawcode cannot be passed at all: nothing in the editor reads one from the command line.

### The editor's windows

The main window is a custom `OsWindow`, but its menu bar is a plain Win32 menu, readable with `GetMenu`/`GetSubMenu`/`GetMenuItemID`, and the modules are dialog windows (`#32770`) of standard common controls. Command ids read on 3.0.0.24268:

| Window        | Command                                                                                  | Id              |
| ------------- | ---------------------------------------------------------------------------------------- | --------------- |
| Main          | Module > Object Editor (F6)                                                              | 1795            |
| Main          | File > Save Map (Ctrl+S)                                                                 | 4               |
| Main          | Edit > View Selection > View In Object Editor (Ctrl+F1), for an object placed on the map | 4356            |
| Object Editor | File > New Custom Unit...                                                                | 8               |
| Object Editor | Edit > Find... / Find Next / Find Previous                                               | 260 / 261 / 262 |
| Object Editor | View > Display Values As Raw Data (Ctrl+D)                                               | 524             |
| Object Editor | View > Sort Objects By Name (Ctrl+T)                                                     | 525             |
| Object Editor | Module > Object Editor (F6)                                                              | 771             |

The same command has different ids in different windows (Object Editor is 1795 in the main window's menu, 771 in the Object Editor's own), so ids are per window. The ids are the editor's resources: no source documents them, and a Patch may renumber them. A tool can read them at run time instead, by walking the menu, but the item texts it would match are in the editor's locale.

The editor's string table names its commands (`WECOMMAND_MODULE_OBJEDIT`, `WECOMMAND_OE_FIND`, `WECOMMAND_OE_TOGGLERAWDATA`, `WECOMMAND_VIEWINOBJECTEDITOR`, and so on), which is how the menu entries map to features; it holds no command that takes a Rawcode.

### The Object data a save writes

Creating a Custom object `h000` from `hfoo`, named "Probe Footman", then saving, wrote:

- `war3map.w3u`, 32 bytes: format 3, no modified Built-in objects, one Custom object `hfoo` → `h000` with one set and no modifications;
- `war3mapSkin.w3u`, 56 bytes, the same layout, holding the name: field `unam`, type 3 (string), value `TRIGSTR_007`;
- `war3map.wts`, a new `STRING 7` with the comment `// Units: h000 (Probe Footman), Name (Name)` and the text `Probe Footman`;
- every other file of the folder again (all timestamps moved), with `war3map.w3i` changed in one byte (offset 4, 2 → 3, which looks like a save counter), `war3mapUnits.doo` changed, and `war3map.lua` rewritten with the same content.

A file pair in the same format 3 written by a 30-line Node script (`h000` from `hfoo` and `h001` from `hkni`, `h001` named by a literal `"Disk Knight"` in `war3mapSkin.w3u`), plus `Disk Footman` in `war3map.wts`, loaded without complaint on reload: the tree showed `h000:hfoo (Disk Footman)` and `h001:hkni (Disk Knight)`.

### Changes on disk while the map is open

1. With the map open and saved, `war3map.w3u` and `war3mapSkin.w3u` gained `h001` on disk and `war3map.wts` renamed `h000`. After ten seconds the editor showed no prompt, the Object Editor still showed `h000:hfoo (Probe Footman)`, and Find `h001` selected nothing.
2. Save (command 4) with nothing modified: the files were rewritten from memory, back to the editor's version (`h001` gone, `Probe Footman` back).
3. The same disk edit again, then a second `World Editor.exe -launch -loadfile <same folder>`: that process exited within 20 seconds, and the running editor reloaded the map, showing `h000:hfoo (Disk Footman)` and `h001:hkni (Disk Knight)` with the Object Editor still open.
4. A Custom object `h002` created in the editor (map marked modified, `*` in the title), then the second launch again: a `Warning` box asked "Save changes to '…reforged-ts-template.w3m'?"; answering No reloaded from disk, `h002` discarded and `h001` kept.

So the World Editor behaves as the only writer of the map folder: it reads the folder when it opens it and writes all of it when it saves. A second program writing Object data works only if the editor has nothing unsaved, and is told to reload by a second `-loadfile`, after every external write.

### Extensions

- **JNGP** (Jass NewGen Pack) and its successor **WEX** (SharpCraft World Editor Extended) inject into the classic `worldedit.exe`. Their last bundle supports up to 1.28.5 / WE 1.29.0, updated 2018-04-21 ([Hive: SharpCraft World Editor Extended Bundle](https://www.hiveworkshop.com/threads/sharpcraft-world-editor-extended-bundle.292127/)); the Hive thread for mappers says it is no longer supported after Reforged's changes ([Hive: World Editor Extended (WEX) - for mappers](https://www.hiveworkshop.com/threads/world-editor-extended-wex-for-mappers.291851/)).
- **YDWE PK** requires Warcraft III 1.26 or 1.27 installed to run, and can only target Reforged maps never saved by the Reforged editor ([Hive: YDWE PK](https://www.hiveworkshop.com/threads/ydwe-pk-world-editor.351329/)).
- **HiveWE** is a separate world editor with its own object editor ([HiveWE](https://github.com/stijnherfst/HiveWE)); it starts the game for testing with `-launch -loadfile` ([`hivewe.cpp`](https://github.com/stijnherfst/HiveWE/blob/main/src/main_window/hivewe.cpp)) and never drives the World Editor.
- **WurstScript** registered `World Editor.exe -loadfile "%L"` as the open command of map files in its old Wurstpack (`Wurstpack/wehack.lua`), and its language server starts the game with `-loadfile` (`RunMap.java`); nothing drives the Object Editor.
- **warcraft-vscode**, a VS Code extension, opens the editor with `World Editor.exe -loadfile <map folder>` and stops there ([`editor.ts`](https://github.com/warcraft-iii/warcraft-vscode/blob/main/src/app/runner/editor.ts)). It also ships an object-editing library in Lua (`crates/wc3-core/assets/objediting/`), relevant to authoring Object data in code.

No source found any way for another process to ask the 3.0 editor for an object.

## Cost per way

|                             | Command line                         | Window messages                                                                    | Keyboard simulation                      |
| --------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------- |
| Platforms                   | Windows (the editor is Windows only) | Windows                                                                            | Windows                                  |
| Needs the game installed    | yes                                  | yes                                                                                | yes                                      |
| Map already open            | opens it, or reloads it if open      | required (step 1 provides it)                                                      | required                                 |
| Reaches one Rawcode         | no                                   | yes                                                                                | yes, in principle                        |
| Needs focus                 | no                                   | no                                                                                 | yes                                      |
| Locale                      | none                                 | dialog titles, button texts (match by class and control id instead)                | none, but key bindings are user settings |
| Maintenance against Patches | low: switches the editor itself uses | medium: menu command ids, tab order, label format, dialog layout, all undocumented | medium to high                           |
| Can confirm success         | the window title shows the map       | not cheaply                                                                        | no                                       |

## What was observed (commands run)

All on 2026-10-05; the editor was the only one started and ended with `taskkill /F /PID 26360` at the end (a plain close was not tried).

1. Strings of `World Editor.exe` and `Warcraft III.exe` extracted with a small Node script (ASCII and UTF-16LE runs) and searched for switches, `WECOMMAND_*` names and the Test Map command line.
2. `Start-Process "World Editor.exe" -ArgumentList '-launch','-loadfile','"<scratch>\maps\reforged-ts-template.w3m"'`: the editor opened the folder, maximized, title `Warcraft III World Editor - [<path>]`, no Battle.net login asked. Captured with `PrintWindow` (`PW_RENDERFULLCONTENT`), like the Probe runner's helper.
3. `GetMenu` walk of the main window and of the Object Editor: the command ids above.
4. `PostMessage(main, WM_COMMAND, 1795)`: the `Object Editor` window appeared, Units tab, Peasant selected.
5. Find with raw data off: `hkni` changed nothing (no message box); `Knight` selected the Knight.
6. `WM_COMMAND` 524, then Find `hfoo`: tree labels became `hpea (Peasant)`, `hfoo (Footman)`…, and `hfoo (Footman)` was selected.
7. Find `AHbz` on the Units tab: nothing. `TCM_SETCURFOCUS` 4, `TCM_GETCURSEL` returned 4, the Abilities tab showed, then Find `AHbz` selected Blizzard (fields `aart` = `ReplaceableTextures\CommandButtons\BTNBlizzard.blp`).
8. `WM_COMMAND` 8 (New Custom Unit) on the Units tab, name `Probe Footman` set by `WM_SETTEXT`, OK; an `Object ID - hfoo` box asked for the Rawcode (shown because raw data display was on), `h000` given; Find `h000` selected `h000:hfoo (Probe Footman)`. Save by `WM_COMMAND` 4 on the main window, no dialog.
9. The disk-change sequence of [Changes on disk while the map is open](#changes-on-disk-while-the-map-is-open).
10. UI Automation (`AutomationElement.FromHandle` on the tree, `FindAll` of its descendants) returned nothing; `TVM_GETCOUNT` returned 1003 and `TVM_GETNEXTITEM(TVGN_CARET)` a handle.
11. Raw data display toggled back off (`GetMenuState` confirmed unchecked), then the editor ended with `taskkill /F`.

## Sources

- Observation on the maintainer's machine, as listed above (Patch 3.0.0.24268).
- [Hive: Complete Command-Line Arguments Guide](https://www.hiveworkshop.com/threads/complete-command-line-arguments-guide.288224/) (MindWorX, 2016, updated 2018; additions by BogdanW3, 2021): the game's switches, `-loadfile`, `-launch`, `-windowmode`, `-testmapprofile`; no World Editor switch beyond `-loadfile`.
- [Hive: How to launch map test with command line?](https://www.hiveworkshop.com/threads/how-to-launch-map-test-with-command-line.326160/): `-launch` needed from 1.32 on.
- [HiveWE `hivewe.cpp`](https://github.com/stijnherfst/HiveWE/blob/main/src/main_window/hivewe.cpp), [WurstScript `wehack.lua` and `RunMap.java`](https://github.com/wurstscript/WurstScript), [warcraft-vscode `editor.ts`](https://github.com/warcraft-iii/warcraft-vscode/blob/main/src/app/runner/editor.ts), [war3-pfx-boilerplate `runWorldEditor.bat`](https://github.com/wiselencave/war3-pfx-boilerplate/blob/main/runWorldEditor.bat): how tools launch the editor and the game.
- [Hive: SharpCraft World Editor Extended Bundle](https://www.hiveworkshop.com/threads/sharpcraft-world-editor-extended-bundle.292127/), [Hive: WEX for mappers](https://www.hiveworkshop.com/threads/world-editor-extended-wex-for-mappers.291851/), [Hive: YDWE PK](https://www.hiveworkshop.com/threads/ydwe-pk-world-editor.351329/): the extensions' supported Patches.
- [w3ts: World Editor](https://cipherxof.github.io/w3ts/docs/editor-support/): w3ts opens maps by dragging the folder onto the editor and documents no launch or reload.
- Microsoft's Win32 documentation of [`TCM_SETCURFOCUS`](https://learn.microsoft.com/en-us/windows/win32/controls/tcm-setcurfocus), [`TCM_SETCURSEL`](https://learn.microsoft.com/en-us/windows/win32/controls/tcm-setcursel) (no notification sent), [`GetMenuState`](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmenustate), [`BM_CLICK`](https://learn.microsoft.com/en-us/windows/win32/controls/bm-click).
