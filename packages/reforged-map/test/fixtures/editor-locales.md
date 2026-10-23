# Provenance of `editor-locales.w3m`

`editor-locales.w3m/` is a map folder saved by the 3.0 World Editor, the fixture of [#711](https://github.com/phmilk/reforged-ts/issues/711). It holds one Custom unit, `h000` from `hfoo`, whose name and tooltip are translated into ptBR and deDE under `_Locales/`. `.gitattributes` keeps git from changing its files (`-text -diff`). What the World Editor and the game do with these files: [`docs/research/locales.md`](../../../../docs/research/locales.md).

- **Editor**: `C:\Program Files (x86)\Warcraft III\_retail_\x86_64\World Editor.exe`, `ProductVersion 3.0.1.24371 (dc6b234dd5)`, Patch 3.0.1, on Windows 11.
- **Saved on**: 2026-10-23, by a human in the editor, with the files between the two saves written by an agent.

## How it was made

1. A human made a new map in the World Editor (File > New), created the Custom unit `h000` from the Footman in the Object Editor, named it `Locale Footman` and set its basic tooltip (`utip`) to `Tooltip padrão`. They saved it with File > Save Map As, type "Warcraft III Scenario Folder", as `C:\Users\wylle\reforged-ts-711\Locales711.w3m`.
2. The 3.0.1 editor has no screen for translating a string: neither the Object Editor's text field nor the Scenario or Advanced menus offer a locale. So an agent wrote the translations by hand: `_Locales/ptBR.w3mod/war3map.wts` and `_Locales/deDE.w3mod/war3map.wts`, each holding only `STRING 3` (the name) and `STRING 4` (the tooltip), in the root file's form (UTF-8 with a byte order mark, CRLF).
3. The human closed the editor, opened `Locales711.w3m` again and saved it with no edit (File > Save Map). That folder is this fixture.

It is copied here minus `conversation.json` (which Prettier would reformat) and the folders the editor created empty: the ten `_Locales/<locale>.w3mod/` without a file, and `war3mapImported/`, which git cannot hold.

## What the editor wrote

- **The translations, kept byte for byte.** The no-edit save rewrote neither locale's `war3map.wts`.
- **`war3map.imp`, new.** The save added an import list of format 1 with two entries, flag `0x15` each: `_Locales/deDE.w3mod/war3map.wts` and `_Locales/ptBR.w3mod/war3map.wts`. The editor counts a locale's string table as an imported file.
- **`war3map.wts`** rewritten byte-identical: `STRING 1` and `2` (the player and the force), `STRING 3` and `4` with a comment line naming the object and the field (`// Units: h000 (Locale Footman), Name (Name)`).
- **`war3mapSkin.w3u`** holds the name and the tooltip as `TRIGSTR_003` and `TRIGSTR_004`; `war3map.w3u` holds the entry with no modification.
- **`war3map.w3i`** changed in one byte (offset 4, 1 to 2); **`war3mapUnits.doo`** changed in eight bytes (offsets 68 to 75, `00` to `FF`), as #475 and #500 saw the editor rewrite it on a save. Every other file is byte-identical to the first save's.
- **The map script is JASS** (`war3map.j`): the map was made new, and the editor's default is JASS.
