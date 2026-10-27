# Provenance of `editor-sync.w3m`

`editor-sync.w3m/` is a map folder saved by the 3.0 World Editor, the fixture of [#713](https://github.com/phmilk/reforged-ts/issues/713): the World Editor contract of Object sync. Object sync wrote Object definitions of every kind into a copy of `editor-objects.w3m`, and the World Editor loaded the result and saved it twice. `test/editor-sync.test.ts` syncs the same definitions into `editor-objects.w3m` again and asserts that every Object data file, Skin file, `war3map.wts`, locale table and `war3map.imp` it writes is byte-identical to the editor's save, and that a sync over the editor's save writes no byte. `.gitattributes` keeps git from changing its files (`-text -diff`).

- **Source**: `test/fixtures/editor-objects.w3m` ([its provenance](editor-objects.md)), at commit `59fa2789`.
- **Definitions**: `test/support/editor-sync.ts`, at the same commit as this file.
- **Editor**: `C:\Program Files (x86)\Warcraft III\_retail_\x86_64\World Editor.exe`, Patch 3.0.1, Build 3.0.1.24371 (the editor version its save wrote into `war3map.w3i`), on Windows 11.
- **Index and field table**: those of `reforged-builtins` for Game version 3.0.1, field table of format 2.
- **Saved on**: 2026-10-24, by an agent driving the editor from WSL.

## How it was made

1. `editor-objects.w3m` was copied to a scratch folder that no other process held, `%TEMP%\reforged-713\maps\reforged-ts-template.w3m`, with a pristine copy beside it. A World Editor save replaces the whole folder, and can wipe it if another process holds a file in it (#475).
2. A Map project on the WSL side, with `typescript` and `reforged-builtins` linked into its `node_modules`, held the definitions of `test/support/editor-sync.ts` under `src/objects/`. The package's `syncObjectDefinitions`, built from the same commit, synced them into the scratch folder twice, the World Editor check on and finding no window:
   - **The first run** synced `SYNCED_DEFINITIONS` and `REMOVED_DEFINITIONS`: a Custom unit `h002` from `hfoo` with a localized name (`Sergeant`, deDE `Feldwebel`, ptBR `Sargento`), a localizable tooltip, a number and a list of Rawcodes; a change to the Built-in unit `hkni`; a three-level Custom ability `A001` from `AHbz` with a levelled localizable tooltip, a levelled mana cost and number of waves (integers) and a levelled damage (an unreal); a Custom buff `B001` from `BHbz`; and a Custom item `I001` from `ratc`.
   - **The second run** synced `SYNCED_DEFINITIONS` alone: the item's definition gone, Object sync removed `I001`, with its placements warning, and its `STRING 20`.

   Every value differs from its base's, since the editor drops some modifications equal to their base's value ([`editor-contract.md`](editor-contract.md)).

3. The editor was started with `World Editor.exe -launch -loadfile "<scratch>\maps\reforged-ts-template.w3m"`, through the package's `reloadWorldEditor`. It loaded the map with no dialog: the 3.0.1 World Editor still loads a map folder given to `-loadfile`.
4. File > Save Map (`WM_COMMAND` 4 to the main window) saved the map with no dialog, then a second time with no edit. The editor was then closed with `WM_CLOSE` on the unmodified map.

The saved folder was copied here, minus `conversation.json` and the folders the editor created empty: the ten `_Locales/<locale>.w3mod/` without a file, and `war3mapImported/`, which git cannot hold.

## What the save settled

- **No difference.** The 14 Object data and Skin files, `war3map.wts`, the deDE and ptBR tables and `war3map.imp` that Object sync wrote came back byte-identical from both saves.
- **`war3map.imp` flag `0x1d`.** A first run, with the writer listing a locale table with flag `0x15` as the editor's save of `editor-locales.w3m` does, came back identical from the first save, but the second save set bit `0x08` of each entry, `0x1d`, and a third save kept `0x1d`. So the writer lists a new locale table with flag `0x1d`, the editor's fixed point, and the run above, from scratch, needed no other change.
- **The locale layout** of [`docs/research/locales.md`](../../../../docs/research/locales.md) holds after a sync: each table a whole copy of `war3map.wts` in its form, with the translation under the string's own number, and the default text elsewhere.
- **The removed item's string**, `STRING 20`, stays gone: the gap is kept, and the ability's strings are numbered from 21.
- **`war3map.w3i`** changed only in the editor's fields: the save count, and the editor version from 3.0.0.24268 to 3.0.1.24371. `war3mapUnits.doo` is byte-identical to `editor-objects.w3m`'s.
