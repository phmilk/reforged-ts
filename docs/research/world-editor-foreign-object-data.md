# What the World Editor does to Object data another tool wrote

Research for [#475](https://github.com/phmilk/reforged-ts/issues/475), part of the wayfinder map [#457](https://github.com/phmilk/reforged-ts/issues/457). Observed on 2026-10-05 on the maintainer's Windows 11 machine (OS locale pt-BR, game enUS), World Editor of Patch 3.0.0.24268 (`C:\Program Files (x86)\Warcraft III\_retail_\x86_64\World Editor.exe`, `ProductVersion 3.0.0.24268 (ede670caa6)`). Everything ran on a throwaway copy of the Template's map folder, with the method of [#461](https://github.com/phmilk/reforged-ts/blob/research/world-editor-open-object/docs/research/world-editor-open-object.md): the editor started with `-launch -loadfile`, driven by `WM_COMMAND` window messages, captured with `PrintWindow`. Terms from `CONTEXT.md`: Object data, Rawcode, Custom object, Built-in object, Object definition, Object sync, Object manifest, Studio, Object Editor.

## Answer

1. **A literal name in `war3mapSkin.w3u`**: the World Editor **loads it** and shows it (UTF-8 included: `Literal Skin Knight ç`), but its **next save converts it to a `TRIGSTR`**, even a save with no edit. It appends `STRING n` to `war3map.wts` with the editor's comment and writes `TRIGSTR_nnn` in the Skin file. This happens to every localizable string field (`unam`, `utip`). A literal name in the base `war3map.w3u` (HiveWE's layout) is converted too, and **moved to `war3mapSkin.w3u`**. A non-localizable string such as a model path (`umdl`) stays literal, but it also moves to the Skin file. So the editor puts every field back in the file it belongs to.
2. **TRIGSTR numbering**: **nothing is renumbered.** `TRIGSTR_nnn` references and `STRING n` keep their numbers, and gaps stay (8 removed: 7, 9, 50 stay as they are). A new string gets **the highest number seen at load plus one**. That count includes strings nothing references (an orphan `STRING 80` made the next ones 81 and 82), and it is never a gap-filling number. But a save **drops every string nothing references**. It **sorts `war3map.wts` by number** and **writes its own comment** above each Object data string. A reference to a string missing from `war3map.wts` is saved as an empty literal `""`, and the name is lost.
3. **Unchanged objects**:
   - **On its own output, a no-edit save is a fixed point.** Every file of the folder came back byte-identical, four times out of four, though every file is rewritten (new timestamps, new file ids).
   - **On another tool's output, an object is kept byte for byte as long as it is already in the editor's canonical form.** It keeps its field order, its set count and flag, its end markers (even zero end markers on a Built-in object, where the editor writes the Rawcode), and its place in both tables. It keeps all of that across a save that edits another object, too.
   - **These objects are rewritten even with no edit:** any localizable literal string (to a `TRIGSTR`), any field in the wrong file (moved, the object's fields then in load order, base file first), any object of the base file missing from the Skin file (added there with zero modifications), and any unresolved `TRIGSTR` (to `""`).
   - `war3map.wts` is rewritten whenever another tool wrote it (sorted, commented, orphans dropped).
   - **A drift check must therefore compare object by object, with `TRIGSTR` resolved**, not files by bytes. Comparing one object's bytes (its slice of the base and Skin files) works only when Object sync wrote it in the editor's canonical form.
4. **Unsaved edits**: **only the window title tells.** The main window (class `OsWindow`, found with `EnumWindows`/`GetWindowText`) is titled `Warcraft III World Editor - [<map path>]`, and becomes `… [<map path> *]` once the map holds unsaved edits.
   - **Nothing else changes on an edit.** There is no lock file, no temporary file, nothing written on disk, and no handle on any map file. Every file opens exclusively, and the Restart Manager names no process.
   - **Without injection, a tool can also tell that the map is open, though not whether it is modified.** While a map is open, the editor holds **directory handles on the map folder** and on each `_Locales\*.w3mod`, with list-directory access and delete sharing. Handle enumeration (`NtQuerySystemInformation` plus `DuplicateHandle`) sees them, and they make a rename of the folder fail.
   - `Get-Process`'s `MainWindowTitle` is not reliable: it gave `Object Editor` while that module was active.
   - From #461: a `-launch -loadfile` while the map is modified shows a "Save changes?" box.

**Also found: a World Editor save can destroy the map folder.** A save writes the whole map into a sibling folder `<map>Temp`, moves the original aside as `<map>Backup`, puts `<map>Temp` in its place and deletes `<map>Backup`. If **another process holds any file of the map folder open without delete sharing** during the save, the save **silently loses the map**. Reproduced twice:

- the files sorting before the held one are deleted;
- the new content is gone;
- the editor shows no error and its title says saved.

A second save from the editor's memory put the map files back, but files the editor treats as imports were lost for good. Node holds files with delete sharing (libuv), and a save with such a handle held went through intact.

## What it means for Object sync and the Studio

- **Write the editor's canonical form**, so that a World Editor save is a no-op on what Object sync or the Studio wrote:
  - every localizable string as a `TRIGSTR_nnn`, with its `STRING n` in `war3map.wts` and the editor's comment (`// Units: h000 (Name), Name (Name)`);
  - every Skin field (the metadata's `netsafe` split) in `war3mapSkin.w3*`;
  - every object of the base file listed in the Skin file as well, with zero modifications if it has no Skin field there;
  - `war3map.wts` sorted by number, with a UTF-8 BOM and CRLF;
  - no string that nothing references, since the editor deletes it.
- **A new `TRIGSTR` number must be above every number in `war3map.wts`**, orphans included. Never fill a gap: the editor keeps counting from its own maximum, so both writers then stay ahead of each other's numbers. A writer must never leave a reference pointing at a missing string, or the editor erases the value.
- **The drift check of the Object manifest compares objects, not files**: base and Skin merged, `TRIGSTR` resolved to text, fields compared as a set (or in order, since the editor keeps it). A per-object byte comparison is a valid fast path only after Object sync writes canonical bytes. Whole-file hashes change for unrelated reasons: another object edited, a string added, `war3map.wts` sorted.
- **Rawcodes are reused, `TRIGSTR` numbers are not.** The editor suggested `h001` for a new Custom unit right after `h001` had been removed on disk, so a Rawcode that Object sync removed can come back as a World Editor object. The Object manifest must tell "removed by the code" from "made in the editor since".
- **Before writing the map folder or sending `-launch -loadfile`**, the Studio and Object sync can look for a World Editor main window whose title holds the map path, compared with `/` and `\` alike and ignoring case:
  - no window: write freely;
  - the window without `*`: write, then send `-launch -loadfile` to reload;
  - `*`: stop and ask the user to save or discard in the World Editor first. Otherwise the reload prompt, or the user's next save, decides which writer loses.
- **Never keep a map file open**, and never open one without delete sharing: Node's `fs` is safe, a .NET `FileStream` with the default share mode is not. A watcher on the map folder sees the folder replaced by every World Editor save, so it must watch the parent or re-attach.
- **Do not keep the Object manifest inside the map folder.** The World Editor lists every unknown file in the folder in a new `war3map.imp` as an imported file, which the build would then pack into the map.

## What was observed

### Setup

- The Template's map folder `reforged-ts-template.w3m` copied to a scratch directory, with a pristine copy kept beside it. The Template had no Object data.
- The editor started with `Start-Process "World Editor.exe" -ArgumentList '-launch','-loadfile','"<scratch>\maps\reforged-ts-template.w3m"'`. No Battle.net login was asked.
- The main menu read with `GetMenu`: File > Save Map is command 4, Close Map 64189, Exit 22. Module > Object Editor is 1795. In the Object Editor, File > New Custom Unit is 8, Edit > Find 260, View > Display Values As Raw Data 524. These are the ids of #461.
- A minimal reader and writer of Object data format 3 (units layout) and of `war3map.wts`, written for this test, read every file the editor saved and wrote it back byte-identical.

### Baseline made in the editor

`h000` from `hfoo` (Probe Footman), `h001` from `hkni` (Probe Knight) and `h002` from `hrif` (Probe Rifleman) were created in the Object Editor and saved. The editor wrote:

- `war3map.w3u`, 72 bytes: format 3, no Built-in objects; three Custom objects, each with 1 set, flag 0 and no modifications;
- `war3mapSkin.w3u`, 144 bytes: the same three objects, each with only `unam`, type 3, values `TRIGSTR_007`, `TRIGSTR_008` and `TRIGSTR_009`, end marker `00000000`;
- `war3map.wts`: `STRING 7` to `9` appended after the Template's strings 1 to 6, each with a comment `// Units: h000 (Probe Footman), Name (Name)`;
- `war3map.w3i`: byte 4 changed from 2 to 3. It changed again (3 to 4) on the later save with an edit, never on a save without one: a counter of saves with changes;
- `war3mapUnits.doo` rewritten (bytes 68 to 75 became `FF`).

**No-edit save of the editor's own files**: every file of the folder byte-identical; every timestamp moved.

### Round 1: foreign data planted, reloaded, saved with no edit

These were written to disk while the map was open and unmodified, then reloaded with a second `-launch -loadfile` (#461):

- **Built-in objects**, out of Rawcode order: `hpea` first, with `uhpm` 321 and `ua1b` 9, end markers `hpea` (the editor's convention); then `hfoo`, with `uhpm` 456, `umvs` 300 and `ua1b` 13, end markers `00000000` (not the convention), fields in neither alphabetical nor metadata order.
- **Custom objects**, in the order `h002`, `h000`, `h003`, `h004`, `h005`:
  - `h002`, untouched, only moved;
  - `h000`, plus `uhpm` 999 in the base file;
  - `h003` from `hkni`, its name a literal `Literal Skin Knight ç` in the Skin file;
  - `h004` from `hfoo`, its name a literal `Literal Base Footman` in the **base** file, and listed in the Skin file with zero modifications (HiveWE's layout);
  - `h005` from `hpea`, named `TRIGSTR_050`.
  - `h001` was removed from both files.
- **`war3map.wts`**: `STRING 8` removed (a gap); `STRING 50` and then an unreferenced `STRING 30` appended, without comments.

After the reload, the Object Editor showed `h003:hkni (Literal Skin Knight ç)`, `h004:hfoo (Literal Base Footman)` and `h005:hpea (High Number Peasant)`. `h001` was gone, and `hpea` and `hfoo` showed as modified. The title had no `*`. Save (command 4) with no edit:

| What                                | After the save                                                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `hpea`, `hfoo` in `war3map.w3u`     | Byte-identical: same object order, same field order, `hfoo`'s zero end markers kept                                          |
| `hpea`, `hfoo` in `war3mapSkin.w3u` | **Added**, 1 set, flag 0, zero modifications                                                                                 |
| `h002`, `h000`                      | Byte-identical in both files, same positions                                                                                 |
| `h003` (literal in Skin)            | `unam` = `TRIGSTR_051`; `STRING 51` = `Literal Skin Knight ç`, comment `// Units: h003 (Literal Skin Knight ç), Name (Name)` |
| `h004` (literal in base)            | `unam` **removed from `war3map.w3u`**, `unam` = `TRIGSTR_052` in `war3mapSkin.w3u`; `STRING 52` = `Literal Base Footman`     |
| `h005` (`TRIGSTR_050`)              | Kept `TRIGSTR_050`; `STRING 50` kept its number and gained the editor's comment                                              |
| Gap at 8                            | Kept; nothing renumbered                                                                                                     |
| Orphan `STRING 30`                  | **Dropped**                                                                                                                  |
| Other files                         | Byte-identical (`war3map.w3i` not counted up)                                                                                |

A second no-edit save right after: the whole folder byte-identical to the first.

### Round 2: more foreign data, reloaded, saved with no edit

These were written to disk, then reloaded the same way:

- `h002`: a literal `utip` (`Literal tooltip`) in the Skin file, and a literal `umdl` (`units\human\Footman\Footman`) in the base file;
- `h000`: its `unam` pointed at `TRIGSTR_070`, which `war3map.wts` does not hold;
- `h006` from `hmtm`: named `TRIGSTR_060`, and its `STRING 60` placed **before** `STRING 7` in `war3map.wts`;
- an unreferenced `STRING 80` appended.

After a no-edit save:

- `h002`:
  - `umdl` **moved to `war3mapSkin.w3u` and kept literal**;
  - `utip` became `TRIGSTR_081`, with the comment `// Units: h002 (Probe Rifleman), Tip (Tooltip - Basic)`;
  - its Skin fields were then `umdl`, `unam`, `utip`: the field read from the base file first, then the Skin file's own.
- `h000`: `unam` became `""`, the name lost. `STRING 7` (`Probe Footman`), now referenced by nothing, was dropped.
- `STRING 60` was written **after** `STRING 52`, so the file is sorted by number.
- `STRING 80` was dropped, but the new tooltip got 81: numbering continues from the highest number loaded, orphans included.
- Every other object was byte-identical.

### An edit, then a save

A new Custom unit was created from `hmtm` in the Object Editor:

- The "Object ID" box **suggested `h001`**, the Rawcode removed on disk in round 1. `h007` was typed instead.
- The title became `Warcraft III World Editor - [<path> *]`.

With the map modified:

- every one of the 19 files of the map folder opened with `FileShare.None`;
- the Restart Manager (`RmGetList`) listed no process for any of them;
- no file appeared or changed in the map folder, in its parent, in `%TEMP%` (two levels deep) or in `Documents\Warcraft III`.

Save: `h007` was **appended** to both tables, `unam` = `TRIGSTR_082` (after 81, though 80 was gone by then). **Every other object was byte-identical**, in place, in both files. `war3map.w3i` byte 4 went from 3 to 4.

### An unsaved edit, then close without saving

A Custom unit `h008` was created, and the title showed `*`:

- `WM_COMMAND` 22 (File > Exit) posted to the main window did nothing.
- `WM_CLOSE` posted to the main window opened a `#32770` box titled `Warning`, `Save changes to 'C:/.../reforged-ts-template.w3m'?`, with buttons `&Sim` (id 6), `&Não` (id 7) and `Cancelar` (id 2).
- `BM_CLICK` on id 7: the process exited, and the folder was byte-identical to the last save.

Two files changed in `Documents\Warcraft III` (under OneDrive here): `Logs\War3EditorLog.txt` and `WorldEditPreferences.txt`, both stamped at exit. The log shows each save as `Opening map - <map>Temp/`, then `<map>/`.

### What the editor holds while a map is open

The editor was relaunched on the map, unmodified. Its handles were listed without injection: `NtQuerySystemInformation(SystemExtendedHandleInformation)`, then `DuplicateHandle` with `PROCESS_DUP_HANDLE`, then `GetFileType` and `GetFinalPathNameByHandle`, the approach of Sysinternals' `handle`.

- **Map folder:** the editor holds `reforged-ts-template.w3m` and each of its 12 `_Locales\*.w3mod` directories, with access `0x100081` (list directory, read attributes, synchronize). These directories open with `DELETE` access by another process, so they share delete, but renaming the map folder fails with access denied. Before the editor started and after it exited, the rename worked.
- **No map file**: no handle on any file of the map folder.
- **Elsewhere:** its working directory (inherited from whoever started it); the CASC `Data` files of the install; `War3EditorLog.txt`.

So a tool can see that a map is open without injecting anything. It cannot see that the map is modified, except through the title.

### How a save replaces the folder

Polling the parent folder during a no-edit save showed `reforged-ts-template.w3mTemp` appear first, then `reforged-ts-template.w3mBackup`, and both gone within a second. The file ids of the folder, of `_Locales` and of every file changed, and the bytes stayed identical. Unknown files survive a save, but not as they were:

- `extra-unknown.json` and `extra-dir\notes.txt` were copied into the new folder.
- The editor **added a new `war3map.imp`** listing them as imported files. Their flag was `0x15` on the first save and `0x1D` on the next, so the editor's own output settles only after two saves once imports appear.
- It also staged them in `%TEMP%\WEImports00`, which was deleted when the editor exited.

**Saves while another process holds a file of the map folder open:**

| Held                                               | Result                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `war3map.w3u`, `FileShare.ReadWrite \| Delete`     | Save went through, folder intact                                                                                                                                                                                                                                                                                             |
| `war3map.w3u`, `FileShare.ReadWrite` (no delete)   | `w3mTemp` and `w3mBackup` appeared and vanished. The folder was left with **only the files sorting from `war3map.w3u` on** (`war3map.w3u`, `.wct`, `.wpm`, `.wtg`, `.wts`, `war3mapMap.blp`, `war3mapSkin.w3u`, `war3mapUnits.doo`) in their old version; 14 files deleted, the new save lost; no message, title without `*` |
| `war3map.wts`, `FileShare.Read` (no delete), again | Same: only `war3map.wts`, `war3mapMap.blp`, `war3mapSkin.w3u` and `war3mapUnits.doo` left                                                                                                                                                                                                                                    |

After each, a plain save from the editor wrote the map back from memory: identical to the folder before the bad save. The exception was the two unknown files and `war3map.imp` after the first bad save. The editor reads imports from disk, so those were lost.

libuv, under Node's `fs`, opens files with `FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE` unless asked for `UV_FS_O_EXLOCK` ([`src/win/fs.c` L509-L513](https://github.com/libuv/libuv/blob/32f8ea9f92cf21a83c3e7073bc013e32b6df81b9/src/win/fs.c#L509-L513)). That is the first, harmless row.

At the end, the editor was closed with `WM_CLOSE` on an unmodified map: no prompt, and the process exited. `Get-Process 'World Editor'` returned nothing.

## Not determined

- **An edit to an existing object's field**, such as `hfoo`'s hit points through the Object Editor's field list, was not made. Whether the edited field keeps its place in the object or moves to the end is unknown, and so is the order the editor gives fields it creates. Objects with an edit are compared by value anyway.
- **Ability, doodad and upgrade files** (`.w3a`, `.w3d`, `.w3q`, with levels and data pointers) and the other kinds were not planted, only units (`war3map.w3u`). Nothing suggests they behave differently, but that was not checked.
- **A set count above 1, an unknown field id and an unknown modification type** were not planted.
- **Strings referenced only from triggers or `war3map.w3i`**: the strings 1 to 6 that `war3map.w3i` references were kept. Whether a string referenced only from a trigger survives was not tested.
- **The `*` for every kind of edit**: only Object Editor edits (creating a Custom unit) were made. Terrain, triggers and placed units were not tried.
- **The editor's exact steps when the move to `<map>Backup` fails**: copy and delete, inferred from what was left. Only the outcome was observed.

## Method, step by step

1. Copied `reforged-ts-template\maps\reforged-ts-template.w3m` to `scratchpad\we-foreign\maps\` and kept a pristine copy.
2. Started the editor as above. `PostMessage(main, WM_COMMAND, 1795)` opened the Object Editor. `WM_COMMAND` 524 turned raw data display on (it was off). For each new unit:
   - Find (260) with the base label (`hfoo (`): `WM_SETTEXT` into the Find dialog's `Edit`, then `BM_CLICK` on `&OK`;
   - `WM_COMMAND` 8, which opens `Create New Custom Unit`;
   - `WM_SETTEXT` on the name `Edit` (id 12), then `BM_CLICK` on OK (id 10);
   - in the `Object ID - <base>` box, `WM_SETTEXT` on its `Edit` and `BM_CLICK` on `&OK`.
3. Saved with `WM_COMMAND` 4 and waited for the `*` to leave the title. Kept a copy of the folder after each save, and diffed folders with `diff -rq` and objects with the reader.
4. Planted with a Node script through the reader and writer (it round-trips the editor's files byte for byte), kept a copy, and reloaded with a second `World Editor.exe -launch -loadfile "<same folder>"`. That process exits, and the running editor reloads from disk (#461). Re-invoked command 1795, then used Find on each planted Rawcode and captured the window.
5. Before and after the edit:
   - looked for locks by opening every file with `FileShare.None`, and asked the Restart Manager (`RmStartSession`, `RmRegisterResources`, `RmGetList`);
   - tried renaming the map folder;
   - listed files newer than a marker in the map's parent, `%TEMP%` and `Documents\Warcraft III`.
6. Listed the editor's handles as described, probed every directory with `CreateFileW(DELETE, share all, FILE_FLAG_BACKUP_SEMANTICS)`, and polled the parent folder with `Directory.GetFileSystemEntries` during saves.
7. Closed:
   - a modified map with `WM_CLOSE`, then `BM_CLICK` on `IDNO` (7);
   - an unmodified map with `WM_CLOSE`, without a prompt;
   - checked `Get-Process 'World Editor'` each time.

## Sources

- Observation on the maintainer's machine, as listed above (Patch 3.0.0.24268).
- [#461 findings](https://github.com/phmilk/reforged-ts/blob/research/world-editor-open-object/docs/research/world-editor-open-object.md): launch switches, menu command ids, reload by a second `-loadfile`, the "Save changes?" prompt.
- [#471 findings](https://github.com/phmilk/reforged-ts/blob/research/hivewe-compatibility-and-features/docs/research/hivewe-compatibility-and-features.md): HiveWE writes names as literals into the base file and lists objects in the Skin files with zero modifications. The question this note answers, whether the World Editor moves Skin fields found in the base file back, was open there.
- [#460 findings](https://github.com/phmilk/reforged-ts/blob/research/object-data-editors-and-libraries/docs/research/object-data-editors-and-libraries.md): the format 3 layout (set count, flag, end marker conventions) used by the reader and writer.
- [libuv `src/win/fs.c`](https://github.com/libuv/libuv/blob/32f8ea9f92cf21a83c3e7073bc013e32b6df81b9/src/win/fs.c#L509-L513): the share mode Node uses on Windows.
- Microsoft's Win32 documentation of [`RmGetList`](https://learn.microsoft.com/en-us/windows/win32/api/restartmanager/nf-restartmanager-rmgetlist), [`DuplicateHandle`](https://learn.microsoft.com/en-us/windows/win32/api/handleapi/nf-handleapi-duplicatehandle), [`GetFinalPathNameByHandleW`](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfinalpathnamebyhandlew), [`CreateFileW`](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew) (`FILE_FLAG_BACKUP_SEMANTICS` for directories, share modes).
