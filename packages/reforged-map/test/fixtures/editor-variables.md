# Provenance of `editor-variables.w3m`

`editor-variables.w3m/` is a map folder saved by the 3.0 World Editor, the fixture of [#500](https://github.com/phmilk/reforged-ts/issues/500): one GUI variable of every object type the Variable Editor offers, plus `integer` and `ordercode`, each as a scalar and as an array, with and without an initial value. `test/editor-saved.test.ts` reads it through the entry point. `.gitattributes` keeps git from changing its files (`-text -diff`).

- **Source**: the Template's map folder, [phmilk/reforged-ts-template](https://github.com/phmilk/reforged-ts-template) at commit [`1c9df66301dd100b4550f88d26c32e02eae45ee2`](https://github.com/phmilk/reforged-ts-template/tree/1c9df66301dd100b4550f88d26c32e02eae45ee2) (`maps/reforged-ts-template.w3m/`).
- **Editor**: `C:\Program Files (x86)\Warcraft III\_retail_\x86_64\World Editor.exe`, `ProductVersion 3.0.0.24268 (ede670caa6)`, Patch 3.0.0.24268, on Windows 11 (OS locale pt-BR, game enUS).
- **Saved on**: 2026-10-06, by an agent driving the editor from WSL.

## How it was made

The variables were **seeded into `war3map.wtg` by a script, then loaded and saved by the World Editor**. They were not typed into the editor's variable panel: the Trigger Editor ignores the `WM_COMMAND` and `BM_CLICK` messages the agent could send without taking the user's keyboard and mouse.

1. The Template's map folder was copied to a scratch folder that no other process held, `%TEMP%\reforged-500\maps\reforged-ts-template.w3m`, with a pristine copy beside it. A World Editor save replaces the whole folder and can wipe it if another process holds a file in it (#475).
2. A Python script rewrote the pristine `war3map.wtg` (567 bytes) into a seeded one (2,865 bytes, sha256 `a72157b6b54f30c74e22aea011defe7dddf5426b8f9739c6a6b2cd4300779561`). It set the variables count of the header's ID lists and wrote one record per variable after the header: name, type, `1`, is array, size, is initialized, initial value, id `0x06000000 + n`, parent `0`. It then appended one element per variable (classifier `64`, id, name, parent `0`) after the Template's three elements. Nothing else changed. The variables:

   | Variable Editor type | Scalar                                     | Array (size 3)                                       | Initial value |
   | -------------------- | ------------------------------------------ | ---------------------------------------------------- | ------------- |
   | `unitcode`           | `UnitType`, `UnitTypeInit`                 | `UnitTypeArray`, `UnitTypeArrayInit`                 | `hfoo`        |
   | `itemcode`           | `ItemType`, `ItemTypeInit`                 | `ItemTypeArray`, `ItemTypeArrayInit`                 | `ratc`        |
   | `abilcode`           | `AbilityCode`, `AbilityCodeInit`           | `AbilityCodeArray`, `AbilityCodeArrayInit`           | `AHbz`        |
   | `buffcode`           | `Buff`, `BuffInit`                         | `BuffArray`, `BuffArrayInit`                         | `Binv`        |
   | `destructablecode`   | `DestructibleType`, `DestructibleTypeInit` | `DestructibleTypeArray`, `DestructibleTypeArrayInit` | `LTlt`        |
   | `techcode`           | `TechType`, `TechTypeInit`                 | `TechTypeArray`, `TechTypeArrayInit`                 | `Rhme`        |
   | `ordercode`          | `Order`                                    | `OrderArray`                                         | none          |
   | `integer`            | `Integer`, `IntegerInit`                   | `IntegerArray`, `IntegerArrayInit`                   | `7`           |

   Each `…Init` variable has the initial value; the others have none.

3. The editor was started with `World Editor.exe -launch -loadfile "<scratch>\maps\reforged-ts-template.w3m"`. The Trigger Editor listed the 30 variables. Each one was selected in its tree (`TVM_SELECTITEM`), and the variable panel was read back (`WM_GETTEXT`, `CB_GETCURSEL`, `BM_GETCHECK`). Every variable showed the expected name, type (`Unit-Type`, `Item-Type`, `Ability Code`, `Buff`, `Destructible-Type`, `Tech-Type`, `Order`, `Integer`), array flag and size. The initial values were resolved to objects: `Footman`, `Claws of Attack +12`, `Blizzard`, `Invisibility`, `Summer Tree Wall`, `Iron Forged Swords` and `7`. The variables without a value showed `None`, or `0 (Default)` for an integer.
4. File > Save Map (`WM_COMMAND` 4 to the main window) saved the map with no dialog and no error. The editor rewrote every file. It wrote its own `war3map.wtg` (2,874 bytes; the root element is now named after the map) and generated `war3map.lua`, with the `udg_` header and the initial values in `InitGlobals` (`FourCC("hfoo")`, loops over the arrays).
5. A second save with no edit left every file byte-identical: the output is the editor's own fixed point. The editor was then closed with `WM_CLOSE` on the unmodified map.

The saved folder was copied here, minus `conversation.json`. That file is byte-identical to the Template's, and Prettier would reformat it, since this folder is not in `.prettierignore`. The reader needs only `war3map.lua` and `war3map.wtg`. Against the Template's, `war3map.lua`, `war3map.wtg` and `war3mapUnits.doo` changed: the editor rewrites eight bytes of the latter (offsets `0x43` to `0x4A`) as `FF` on a save, as #475 saw. Every other file is byte-identical.

## What the editor showed

- **The Variable Editor's types.** In the 3.0 editor, the variable panel's type list is the `[TriggerTypes]` of `UI/TriggerData.txt` (`War3.w3mod`, read from the install's CASC storage) whose second field (a global variable may have this type) is `1`. It holds 65 types, and the panel's combo box lists the same 65. Of those, the ones whose base type is `integer` are:
  - **Object types**, Rawcodes of an Object kind: `unitcode` (Unit-Type), `itemcode` (Item-Type), `abilcode` (Ability Code), `buffcode` (Buff), `destructablecode` (Destructible-Type) and `techcode` (Tech-Type). They are #497's table, **with no type beyond it**: no upgrade-only type, no hero-skill type, no doodad type.
  - `ordercode` (Order), an order id.
  - **Enumerations, which stay `number`**: `animtype`, `subanimtype`, `imagetype`, `mousebuttontype`, `terrainshape`, `terraintype`, `equipmenttype` (Equipment Type, new in 3.0) and `itemtag` (Tag, new in 3.0). Their values are the constants of `common.j` (`EQUIPMENT_TYPE_HEAD`, `ITEMTAG_TYPE_SHOP`), or tile ids for `terraintype`, which reforged-types deliberately keeps out of `Rawcode`.
  - `Ability` is the `ability` handle of 1.31+, not a Rawcode. `Ability Code` is `abilcode`.
- **An order has no initial value the editor can write.** TriggerData has no preset of type `ordercode`. A first attempt seeded `stop` as `OrderInit`'s initial value: the editor showed `stop` in the panel, but on save it wrote `stop` into the script as a bare identifier. Its script check failed (`Line 104: Syntax error - Undeclared identifier 'stop'` and an internal error of the Lua transpiler). It then disabled the `Melee Initialization` trigger and saved an empty `war3map.lua`. That save was discarded: the editor was closed without saving, the folder restored from the pristine copy, and the seeding redone without the order's initial values. So `ordercode` comes as a scalar and an array without an initial value only.
