# Provenance of `editor-contract.w3m`

`editor-contract.w3m/` is a map folder saved by the 3.0 World Editor, the fixture of [#640](https://github.com/phmilk/reforged-ts/issues/640): the writer's contract. The Object data editor applied a script of edits to a copy of `editor-objects.w3m`, and the World Editor loaded the result and saved it. `test/editor-contract.test.ts` applies the same edits to `editor-objects.w3m` again and asserts that every Object data file, Skin file and `war3map.wts` it writes is byte-identical to the editor's save. `.gitattributes` keeps git from changing its files (`-text -diff`).

- **Source**: `test/fixtures/editor-objects.w3m` ([its provenance](editor-objects.md)), at commit `d3c0594f`.
- **Script of edits**: `test/support/editor-contract.ts`, at the same commit as this file.
- **Editor**: `C:\Program Files (x86)\Warcraft III\_retail_\x86_64\World Editor.exe`, `ProductVersion 3.0.1.24371 (dc6b234dd5)`, a later Build of Patch 3.0.1.24370, on Windows 11.
- **Index and field table**: those of `reforged-builtins` for Game version 3.0.1, `commentName` included ([#654](https://github.com/phmilk/reforged-ts/issues/654)).
- **Saved on**: 2026-10-21, by an agent driving the editor from WSL.

## How it was made

1. `editor-objects.w3m` was copied to a scratch folder that no other process held, `%TEMP%\reforged-640\maps\reforged-ts-template.w3m`, with a pristine copy beside it. A World Editor save replaces the whole folder, and can wipe it if another process holds a file in it (#475).
2. `seedForeignLiteral` patched `war3map.w3u` by hand: the Custom unit `h001` got `unam` "Chevalier" as literal text in its base entry, beside the `TRIGSTR` its Skin entry holds, as a tool other than the World Editor writes a name. The input is not made by the code under test.
3. The package's `openObjectData`, built from the same commit, opened the folder with the Map project's `reforged-builtins`, `applyContractEdits` applied the edits, and `save({ worldEditorCheck: false })` wrote them, the editor not yet running. For each Object kind the edits add a Custom object with a localizable and a non-localizable string and change a field of a Built-in object. They also set multi-level ability fields, rename two objects, overwrite the foreign literal, and remove the Custom upgrade `R000`. Two cases of #654 are added: a Custom buff from `BHbz` with no editor name, and a Custom upgrade from `Rhra` named at level 1 only. Every value differs from the base's, since the editor drops a modification equal to its base's value (below).
4. The editor was started with `World Editor.exe -launch -loadfile "<scratch>\maps\reforged-ts-template.w3m"`. It loaded the map with no dialog.
5. File > Save Map (`WM_COMMAND` 4 to the main window) saved the map with no dialog, then a second time with no edit. The editor was then closed with `WM_CLOSE` on the unmodified map.

The saved folder was copied here, minus `conversation.json` and two folders the editor created empty, `_Locales/` and `war3mapImported/`, as for `editor-objects.w3m`.

## What the save settled

- **No difference.** The 14 Object data and Skin files and `war3map.wts` the writer wrote came back byte-identical from the editor's save, at the first run of the script on 3.0.1. No field needed an override of the field table.
- **A levelled field's comment names no level**: `// Abilities: A001 (Greater Light), Tip (Tooltip - Normal)` for `atp1` at level 2.
- **`unsf` and `ushr`** (`netsafe` 11) stay in the Skin file, as the field table says. Every other field set stays in the table's file (`dnam` and `dfil` in `war3map.w3d`).
- **The name in a comment line** (#654): a buff is named by its editor name alone, `B001 (Weakness)`; without one, by its base's, `B003 (Blizzard (Caster))` from `BHbz`, or `()` from a base with none, `Bslo ()`. An upgrade is named by its name at level 0 alone, `R001 (Sharper Powder)`; without one, by its base's names of every level, `R002 (Black Gunpowder,Refined Gunpowder,Imbued Gunpowder)`.
- **The foreign literal**: the writer removed `unam` "Chevalier" from `h001`'s base entry and put the new name into its `STRING 9`, and the editor kept that.
- **The removed Custom upgrade's string**, `STRING 17`, stays gone. The new strings are numbered from 18.
- **`war3map.w3i`** changed only in the editor's fields: the save count, and the editor version from 3.0.0.24268 to 3.0.1.24371. `war3mapUnits.doo` is byte-identical to `editor-objects.w3m`'s.

## What the script avoids

A first run of #640 on the same editor showed that it **drops a modification equal to its base's value**, in part: `Hbz1` of a Custom ability from `AHbz` at levels 1 and 2 (6 and 8, as Blizzard's), its `aart`, a buff's `fart` and an item's `ifil`. It kept `Hbz1` 99 at level 3, and a unit's `uhpm` equal to its base's. The writer holds no field's value, so it cannot do the same: the script sets values that differ from the base's.
