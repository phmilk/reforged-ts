# The names the game gives where the names files disagree

Which name the game gives a Built-in object when its enUS names files set it twice, or set it in a section cased unlike its Rawcode, measured for [#564](https://github.com/phmilk/reforged-ts/issues/564). `reforged-builtins`' generator settled both by assumption until then (`nameFileOrder` in `packages/reforged-builtins/src/generate.ts`, `Profile` in `packages/reforged-builtins/src/profile.ts`). Each claim is marked **Observed** (recorded by the Probe run below) or **Inferred** (follows from it, not measured).

## TL;DR

- **A name set twice: the first one wins** (Observed), within one section (`Ubtr` is "Noble", not "Death Knight") and across files (`Almf` is "Death Coil" from `CampaignAbilityStrings.txt`, not "Item Lesser Mark of the Forsaken" from `ItemAbilityStrings.txt`). The generator assumed the last one.
- **Sections match their Rawcode regardless of case** (Observed): `Ansp` is "Spy" from `[ANsp]`, `Aisy` and `AEqu` are named from `[AIsy]` and `[Aequ]`. The generator matched exactly, so they were `Unnamed_`.
- **Buffs: no Native gives their name** (Observed), so the rules apply to them by inference: they share the abilities' names files and the profile reader (Inferred).
- The generator now follows the game: 19 constants change name.

## The run

- Probe: `probe/probes/builtins-names.ts`.
- Run `3adad009-fea9-452b-badd-38261defcde5`, 2026-10-10, `finished`, 65 records. An earlier run of the Probe without its buff steps, `aac34446-5ba3-441d-8a72-570e28a6ca0e`, gave the same records for every unit and ability.
- Build 3.0.0.24268 (Patch of the Typings and of the client, from the install's build config; its `.build.info` gives 3.0.0.24248, see [#564](https://github.com/phmilk/reforged-ts/issues/564)).
- Locale: enUS. The controls named once read as their enUS names (`hfoo` "Footman", `AHhb` "Holy Light"), although the Battle.net app is set to ptBR and the install holds ptBR text too.

The Natives: `GetObjectName` for every object, `GetUnitName` of a unit created for each unit, `BlzGetAbilityTooltip` at level 0 for each ability and buff. For buffs also `BlzGetAbilityExtendedTooltip`, the buff added to a unit with `UnitAddAbility` and read with `BlzGetUnitAbility`, and the buff of an aura (`BOac` of `AOac`, `BHab` of `AHab`) read the same way 3 seconds after the aura was added.

## Names set twice

The first two columns are the enUS names files, read in the code-point order of their paths; the Native is `GetObjectName`, and `GetUnitName` agrees for `Ubtr`.

| Object | First name (file)                                            | Later name (file)                                             | The game                       |
| ------ | ------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------ |
| `Ubtr` | "Noble" (`CampaignUnitStrings.txt`)                          | "Death Knight" (`CampaignUnitStrings.txt`, same section)      | "Noble"                        |
| `AIfd` | "Item Red Drake Summon" (`ItemAbilityStrings.txt`)           | "Item Blue Drake Summon" (same file)                          | "Item Red Drake Summon"        |
| `AIff` | "Item Furbolg Summon" (`ItemAbilityStrings.txt`)             | "Item Blue Dragonspawn Overseer Summon" (same file)           | "Item Furbolg Summon"          |
| `Abdf` | "Breath of Frost" (`CampaignAbilityStrings.txt`)             | "Item Blue Dragon Figurine" (`ItemAbilityStrings.txt`)        | "Breath of Frost"              |
| `AIee` | "Forsaken Gaze" (`CampaignAbilityStrings.txt`)               | "Item Edric's Eye" (`ItemAbilityStrings.txt`)                 | "Forsaken Gaze"                |
| `Almf` | "Death Coil" (`CampaignAbilityStrings.txt`)                  | "Item Lesser Mark of the Forsaken" (`ItemAbilityStrings.txt`) | "Death Coil"                   |
| `Aesq` | "Essence of the Spider Queen" (`CampaignAbilityStrings.txt`) | "Item Essence of the Spider Queen" (`ItemAbilityStrings.txt`) | "Essence of the Spider Queen"  |
| `Atkj` | "Knight's Javelin" (`CampaignAbilityStrings.txt`)            | "Item Knight's Javelin" (`ItemAbilityStrings.txt`)            | "Knight's Javelin"             |
| `Atff` | "Cannibalize" (`CampaignAbilityStrings.txt`)                 | "Item Forsaken Fangs" (`ItemAbilityStrings.txt`)              | "Cannibalize"                  |
| `Apoa` | "Drunken Haze" (`CampaignAbilityStrings.txt`)                | "Item Drunken Haze (Pint of Ale)" (`ItemAbilityStrings.txt`)  | "Drunken Haze"                 |
| `Auic` | "Infectious Claws" (`CampaignAbilityStrings.txt`)            | "Item Infectious Claws" (`ItemAbilityStrings.txt`)            | "Infectious Claws"             |
| `Asic` | "Summon Infectious Ghoul" (`CampaignAbilityStrings.txt`)     | "Item Summon Infectious Ghoul" (`ItemAbilityStrings.txt`)     | "Summon Infectious Ghoul"      |
| `AFRw` | "Item Summon Banshee" (`CampaignAbilityStrings.txt`)         | "Summon Banshee" (`ItemAbilityStrings.txt`)                   | "Item Summon Banshee"          |
| `Bdet` | "Detected" (`CommonAbilityStrings.txt`, `Bufftip`)           | "Dust of Appearance" (`ItemAbilityStrings.txt`, `Bufftip`)    | not readable: "Default string" |

**Observed:** every unit and ability takes its first name, within a section (`Ubtr`, `AIfd`, `AIff`) and across files. `AFRw` rules out a preference for a name with or without "Item": its first name has it. **Inferred:** the files are read in the code-point order of their paths, as the generator reads them. The run settles that order for the pair `CampaignAbilityStrings.txt` before `ItemAbilityStrings.txt` only, the only pair whose names disagree for a readable object; `Bdet`'s pair, `CommonAbilityStrings.txt` before `ItemAbilityStrings.txt`, follows the same order.

## Sections cased unlike their Rawcode

| Object | Section (file)                          | Name in the section                | The game (`GetObjectName`)     |
| ------ | --------------------------------------- | ---------------------------------- | ------------------------------ |
| `Ansp` | `[ANsp]` (`NeutralAbilityStrings.txt`)  | "Spy"                              | "Spy"                          |
| `Aisy` | `[AIsy]` (`ItemAbilityStrings.txt`)     | "Item Attack Speed Bonus"          | "Item Attack Speed Bonus"      |
| `AEqu` | `[Aequ]` (`NeutralAbilityStrings.txt`)  | "Equipment Slots"                  | "Equipment Slots"              |
| `BOac` | `[Boac]` (`NeutralAbilityStrings.txt`)  | "Command Aura" (`Bufftip`)         | not readable: "Default string" |
| `Xesn` | `[XEsn]` (`NightElfAbilityStrings.txt`) | "Sentinel (Effect)" (`EditorName`) | not readable: "Default string" |

`BlzGetAbilityTooltip` gave `Ansp` "Spy" from `[ANsp]`'s `Tip` too. **Observed:** the game matches a section to its Rawcode regardless of case, for the three abilities.

## Buffs

**Observed:** for every buff, the controls `BHbd` and `BHab` included, `GetObjectName` gives "Default string", `BlzGetAbilityTooltip` "Tool tip missing!" and `BlzGetAbilityExtendedTooltip` an empty string; `UnitAddAbility` of a buff's Rawcode returns `false`, and `BlzGetUnitAbility` finds nothing, after it and on the bearer of an aura (whose `GetUnitAbilityLevel` of the aura's buff stayed 0). No Native the run tried reads a buff's name, so the buffs `Bdet`, `BOac` and `Xesn` are not measured. A buff's tooltip title shows on screen only, a check for a human.

**Inferred:** buffs are named in the same `Units/*AbilityStrings.txt` files as abilities, the same sections of them (`[Boac]` sits in `NeutralAbilityStrings.txt` beside `[ANsp]`), so the profile reader that gives the abilities their names gives the buffs theirs. The generator applies the same two rules to them.

## What the generator does now

- `Profile` matches sections, as keys, regardless of case, and keeps a key's first value; a later value set again is still reported as a warning, for the record of a new Patch.
- `nameFileOrder` is unchanged: code-point order of the paths.
- The World Editor's own strings files (`UI/WorldEditGameStrings.txt`, then `UI/WorldEditStrings.txt`), through which destructables and doodads are named, keep the later value of a key both set, as before: the World Editor reads them, not the game, so no Probe settles them. `WESTRING_DOOD_YOIG` is "Iron Gate", then "Iron Gate (A)", which `YOig` keeps.

The regenerated index of 3.0.0 renames 19 constants: the 14 objects named twice, and the 5 of a section cased unlike its Rawcode, which were `Unnamed_`.
