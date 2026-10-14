# Provenance of `editor-objects.w3m`

`editor-objects.w3m/` is a map folder saved by the 3.0 World Editor, the fixture of [#591](https://github.com/phmilk/reforged-ts/issues/591). It holds a Custom object of each of the seven Object kinds, a modified Built-in object of each kind, a Custom object with a non-ASCII name, a multi-level ability, and a Custom buff and a Custom destructable both at `B000`. `test/editor-objects.test.ts` reads it through the entry point and the lookup, and type-checks what the entry point generates from it against the fixtures of `editor-objects-map-project/`. `.gitattributes` keeps git from changing its files (`-text -diff`).

- **Source**: the Template's map folder, [phmilk/reforged-ts-template](https://github.com/phmilk/reforged-ts-template) at commit [`4e176b71331dc01c691cb028fe03442939b9b375`](https://github.com/phmilk/reforged-ts-template/tree/4e176b71331dc01c691cb028fe03442939b9b375) (`maps/reforged-ts-template.w3m/`).
- **Editor**: `C:\Program Files (x86)\Warcraft III\_retail_\x86_64\World Editor.exe`, `ProductVersion 3.0.0.24268 (ede670caa6)`, Patch 3.0.0.24268, on Windows 11.
- **Saved on**: 2026-10-14, by an agent driving the editor from WSL.

## How it was made

The objects were **seeded into the Object data files by a script, then loaded and saved by the World Editor**, as #500 seeded its variables. They were not created in the Object Editor.

1. The Template's map folder was copied to a scratch folder that no other process held, `%TEMP%\reforged-591\maps\reforged-ts-template.w3m`, with a pristine copy beside it. A World Editor save replaces the whole folder, and can wipe it if another process holds a file in it (#475).
2. A script wrote the seven base Object data files with the encoder of the package's tests (`test/support/object-data.ts`, format version 3, one set of flag 0 per object), names as literal text, and no Skin file:

   | File          | Modified Built-in object     | Custom object                                                                                 |
   | ------------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
   | `war3map.w3u` | `hfoo`, `unam` Militia       | `h000` from `hfoo`, `unam` Captain; `h001` from `hkni`, `unam` Chevalier Élu                  |
   | `war3map.w3t` | `ratc`, `igol` 600           | `I000` from `ratc`, `unam` Captain's Claws                                                    |
   | `war3map.w3a` | `AHhb`, `amcs` 70 at level 1 | `A000` from `AHbz`, `anam` Arctic Blizzard, `alev` 3, `amcs` 80, 100 and 120 at levels 1 to 3 |
   | `war3map.w3h` | `Binf`, `ftip` Burning Fire  | `B000` from `Binf`, `ftip` Holy Fire                                                          |
   | `war3map.w3b` | `LTlt`, `bhps` 80 (unreal)   | `B000` from `LTlt`, `bnam` Gate                                                               |
   | `war3map.w3d` | `AObr`, `dnam` Skull Brazier | `D000` from `AOks`, `dnam` Statue of the Captain                                              |
   | `war3map.w3q` | `Rhar`, `gglb` 200           | `R000` from `Rhme`, `gnam` Sharper Swords                                                     |

   Three modified Built-in objects are renamed: the Footman as Militia, Inner Fire's tooltip as Burning Fire, and the Brazier Skull as Skull Brazier. The four others change another field.

3. The editor was started with `World Editor.exe -launch -loadfile "<scratch>\maps\reforged-ts-template.w3m"`. It loaded the map with no dialog.
4. File > Save Map (`WM_COMMAND` 4 to the main window) saved the map with no dialog. A second save with no edit rewrote 31 files, every one byte-identical: the output is the editor's own fixed point. The editor was then closed with `WM_CLOSE` on the unmodified map.

The saved folder was copied here, minus `conversation.json` (byte-identical to the Template's, which Prettier would reformat) and two folders the editor created empty, `_Locales/` (one empty `<locale>.w3mod/` per locale) and `war3mapImported/`, which git cannot hold.

## What the editor wrote

- **Both files of every kind.** Each of the seven kinds has a base file and a Skin file, in format version 3. Every object of a kind has an entry in both, with one set of flag 0; an entry whose fields all went to the other file holds no modification.
- **Names in the Skin file, as `TRIGSTR_nnn`.** The editor moved every name into the Skin file and into `war3map.wts` (strings 7 to 17, each with a comment line naming the object and the field, `// Units: h000 (Captain), Name (Name)`, or for a buff's tooltip `// Buffs/Effects: B000 (), Bufftip (Tooltip)`), the Template's six strings kept. The doodads are the exception: their `dnam` stays in `war3map.w3d`, as a `TRIGSTR_nnn`, and their Skin entries hold no modification. The other fields stay in the base file.
- **`alev` was dropped.** The Custom ability `A000` keeps its mana cost at levels 1, 2 and 3 (`amcs`, level and data pointer `0`), but the editor wrote no `alev`: the seeded field is not one the 3.0 editor keeps for it. The ability has three levels, as its base, Blizzard, has.
- **The non-ASCII name** is UTF-8 in `war3map.wts`, `Chevalier Élu`.
- **`war3map.w3i`** changed in one bit: the flags go from `0x9C10` to `0xDC10` (`0x4000` set). The Game Data Set and Game Data Version are the Template's, Melee and Forsaken Kingdom.
- **`war3mapUnits.doo`** changed, as #475 and #500 saw the editor rewrite it on a save. Every other file not named above is byte-identical to the Template's.

The readers read all of it with no warning and no change: nothing the editor wrote was unexpected.
