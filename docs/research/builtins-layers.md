# The `_Balance` layer each Game Data Version reads

Which layer of the install's object data the game reads for a map's Game Data Set and Game Data Version, measured for [#575](https://github.com/phmilk/reforged-ts/issues/575). `reforged-builtins`' generator had read Custom from `_Balance/Custom_V1` and Melee from `_Balance/Melee_V0`, as #509 specified, whatever the Game Data Version (`GAME_DATA_SETS` in `packages/reforged-builtins/src/generate.ts`). Each claim is marked **Observed** (recorded by the Probe runs below) or **Inferred** (follows from them, not measured).

## TL;DR

- **A map reads `_Balance/<Set>_V<version>`, else the base layer** (Observed), the version being 0 for Reign of Chaos, 1 for The Frozen Throne and 2 for Forsaken Kingdom. The install has `Custom_V0`, `Custom_V1` and `Melee_V0` only, so Melee of The Frozen Throne and both sets of Forsaken Kingdom read the base layer, `War3.w3mod:`.
- **A unit, an item or an ability whose `version` cell is above the map's Game Data Version is left out** (Observed): under The Frozen Throne the base layer's Forsaken Kingdom hero `Hct1`, item `ecss` and ability `AIhs` (version 2) do not exist; under Reign of Chaos, the item `spur` and the ability `AHfs` (version 1) do not either.
- **A destructable is not** (Observed): the base layer's `LTbr`, of version 1, is created under Reign of Chaos.
- **Nor is a buff** (Observed, [#622](https://github.com/phmilk/reforged-ts/issues/622)): Rain of Fire gives its target `BNrf` and `BNrd`, of version 1, under Reign of Chaos, and Sacred Aura gives its bearer `BHas`, of version 2, under Melee of The Frozen Throne.
- **Upgrades follow their layer** (Observed): `GetPlayerTechMaxAllowed` of `Rhpm`, of version 1, gives 1 where the set's layer has it and 2147483647, as for `Rzzz`, which is no upgrade, under Reign of Chaos, whose layers lack it. No layer has an upgrade of a later version than the sets that read it, so the rule would leave none out. Doodads are not measured: no Native creates one.
- **Forsaken Kingdom, which a new map gets, holds every object of the base layer, whatever the set** (Observed). So the Template's map, Melee of Forsaken Kingdom, plays with the base layer whole.
- **Default reads Custom on a map that is not a melee map, and Melee on a melee map** (Observed): its three runs on the Template's map match Custom's, and its runs with the "Melee Map" flag set (`--melee-map`) match Melee's.
- The generator now follows the game: one Game data set per Game Data Set and Game Data Version, `custom-fk` to `melee-roc`, the version rule on units, items and abilities only, and the item `spur`, which no set holds, leaves the index.

## The runs

- Probe: `probe/probes/builtins-layers.ts`, run with `pnpm probe:run builtins-layers --game-data-set <set> --game-data-version <version>`, which sets the two fields in the staged `war3map.w3i` only.
- 2026-10-11, Build 3.0.0.24268 (the install's build config; its `.build.info` gives 3.0.0.24248, see [#564](https://github.com/phmilk/reforged-ts/issues/564)), each `finished` with 10 records:

| Game Data Set | Game Data Version | Run                                    |
| ------------- | ----------------- | -------------------------------------- |
| Default       | Reign of Chaos    | `90ea8a70-20fb-4056-941a-a11dd6a94efd` |
| Default       | The Frozen Throne | `c203caaa-279e-4f85-b2b5-41a8a9933b67` |
| Default       | Forsaken Kingdom  | `8f657b2b-4fa3-41ad-b36e-120fbdd4f615` |
| Custom        | Reign of Chaos    | `3eb394b0-bb97-4b9f-baa1-44af2bcb16e7` |
| Custom        | The Frozen Throne | `e90c63bb-8d9b-4ca1-ac8a-0bb0d72d5530` |
| Custom        | Forsaken Kingdom  | `b14dcb9d-215c-4ae9-a1c8-e56b480e4103` |
| Melee         | Reign of Chaos    | `dc26cd9c-fdfd-472f-a709-df0bac6e250e` |
| Melee         | The Frozen Throne | `d205bd45-dfb7-4a26-9a2c-8c676bc87e20` |
| Melee         | Forsaken Kingdom  | `945d70b5-efcf-4ec7-9ffd-04d7d72c4603` |

With the melee map flag set (`--melee-map`, the bit `0x0004` of the flags), after the abilities' round, 16 records each: Default of The Frozen Throne `5df608fb-9be6-4b34-ab5f-0aee6251e8fa`, read Melee's base layer without `Hct1` (`hpea` 240, no `Asa2`), and Default of Reign of Chaos `0bc41dd4-2ad7-49b1-a219-d3bd82fea8fd`, read `Melee_V0` (no `nzof`, `hsor` 325). A last run of Melee of Forsaken Kingdom, `aeeebf98-3554-4003-a86e-866223ec58c3`, of the Probe as committed, gave every record of the rounds before.

Two later rounds added the version rule's objects of the other kinds, under Custom and Melee (Default is Custom's), each `finished` with the records above unchanged:

| Game Data Set and Version | Items and destructables (14 records)   | Abilities (16 records)                 |
| ------------------------- | -------------------------------------- | -------------------------------------- |
| Custom, Reign of Chaos    | `8a1ad2ca-36c9-4c33-bbd0-00bafe31b35a` | `010f36fb-c857-4abc-98e6-1b7c534012dd` |
| Custom, The Frozen Throne | `a9eb952a-fdf9-4ba8-8db1-70a007c38ed6` | `e6d3d15a-083f-4f63-9008-1b73605327e4` |
| Custom, Forsaken Kingdom  | `27dd7336-0f8d-44c5-841b-08389a78a248` | `fd0ac89d-5c89-4290-a8c4-3ee163e792cc` |
| Melee, Reign of Chaos     | `785ac9e6-9595-463c-b28f-d1ea90c32b30` | `b449cb71-f99e-4f17-b972-63c97998303f` |
| Melee, The Frozen Throne  | `55f301e6-4e47-46f4-95eb-d719352aac42` | `780fe0e8-a25c-421a-8771-ba6d029264b0` |
| Melee, Forsaken Kingdom   | the round above                        | `4afa4282-d4ca-4021-adab-c034f2d11c7b` |

The Natives: `CreateUnit` of each unit for Player 0, then, for a unit created, `BlzGetUnitMaxHP` and, for one that is not a hero, `GetUnitGoldCost`; `CreateItem` of each item; `UnitAddAbility` of each ability to a new `hfoo`; `CreateDestructable` of each destructable.

`GetUnitGoldCost` of a hero crashes the game (Observed: `Hct1`, run `eb5ea727-c756-4fc1-88b8-f0dfff64f56e`, Melee of Forsaken Kingdom, which had created the unit), so the Probe reads no hero's gold cost.

## What tells the layers apart

The objects were chosen from the install's files: their presence or stats differ between the four layers (the base layer's `UnitBalance.slk` column `HP` and `goldcost`, each layer's data file).

| Object         | base | `Custom_V0` | `Custom_V1` | `Melee_V0` |
| -------------- | ---- | ----------- | ----------- | ---------- |
| unit `Hct1`    | yes  | no          | no          | no         |
| unit `Haah`    | yes  | no          | yes         | no         |
| unit `nzof`    | yes  | yes         | yes         | no         |
| `hfoo`'s gold  | 135  | 160         | 135         | 160        |
| `hsor`'s HP    | 325  | 250         | 325         | 325        |
| `hpea`'s HP    | 240  | 220         | 220         | 220        |
| `earc`'s HP    | 275  | 260         | 310         | 260        |
| item `arsc`    | yes  | no          | yes         | no         |
| item `spur`    | no   | yes         | no          | yes        |
| ability `Asa2` | no   | no          | yes         | no         |

The `version` cell of each: `hfoo`, `nzof`, `hsor`, `hpea`, `earc`, `Asa2` 0; `Haah`, `arsc`, `spur` 1; `Hct1` 2.

## The version rule, per kind

The base layer's objects of a version above some map's, and controls:

| Object              | `version` | Layers                  | Created or added under                          |
| ------------------- | --------- | ----------------------- | ----------------------------------------------- |
| item `ecss`         | 2         | base                    | Forsaken Kingdom only                           |
| ability `AIhs`      | 2         | base                    | Forsaken Kingdom only                           |
| ability `AHfs`      | 1         | all four                | The Frozen Throne and Forsaken Kingdom, not RoC |
| destructable `LTbr` | 1         | base (no layer has any) | every run, Reign of Chaos included              |
| destructable `LTcr` | 0         | base                    | every run                                       |
| destructable `Yts1` | none      | base                    | every run                                       |

So the rule holds for units, items and abilities, and not for destructables. `Asa2` was added under Custom of The Frozen Throne alone, `Custom_V1` being the only layer that has it: not under Forsaken Kingdom, whose base layer lacks it.

## Results

Default's three runs gave exactly Custom's, so they are one row.

| Object         | Custom/Default RoC | Custom/Default TFT | Melee RoC  | Melee TFT | any set FK |
| -------------- | ------------------ | ------------------ | ---------- | --------- | ---------- |
| `Hct1` created | no                 | no                 | no         | no        | yes        |
| `Haah` created | no                 | yes                | no         | yes       | yes        |
| `nzof` created | yes                | yes                | no         | yes       | yes        |
| `hfoo`'s gold  | 160                | 135                | 160        | 135       | 135        |
| `hsor`'s HP    | 250                | 325                | 325        | 325       | 325        |
| `hpea`'s HP    | 220                | 220                | 220        | 240       | 240        |
| `earc`'s HP    | 260                | 310                | 260        | 275       | 275        |
| `arsc` created | no                 | yes                | no         | yes       | yes        |
| `spur` created | no                 | no                 | no         | no        | no         |
| `Asa2` added   | no                 | yes                | no         | no        | no         |
| **Layer read** | `Custom_V0`        | `Custom_V1`        | `Melee_V0` | base      | base       |

- Custom of Reign of Chaos is `Custom_V0`: `hsor` 250, `nzof` and no `Haah`. Its `spur`, of version 1, is left out (Observed); so are its 368 units of version 1, by the same rule (Inferred).
- Custom of The Frozen Throne is `Custom_V1`: `earc` 310 and `Asa2`, which only that layer has.
- Melee of Reign of Chaos is `Melee_V0`: no `nzof`, `hsor` 325 and `hfoo` 160.
- Melee of The Frozen Throne is the base layer (`hpea` 240, `earc` 275), without `Hct1`, of version 2: there is no `Melee_V1`.
- Forsaken Kingdom is the base layer whole, `Hct1` included, under every set: there is no layer of version 2.
- The `earc` HP the game gives under `Custom_V0` and `Melee_V0` is 260, the file's `HP` column, not its `realHP` (250).

## Buffs and upgrades

Measured for [#622](https://github.com/phmilk/reforged-ts/issues/622). The install's data has a `version` column for buffs, doodads and upgrades too, so a set could list some of a later version than its own:

| Kind    | Base layer: rows by `version` | `Custom_V0` and `Melee_V0` | `Custom_V1`   |
| ------- | ----------------------------- | -------------------------- | ------------- |
| buff    | 144, 97, 77                   | 144, 94, none              | 144, 96, none |
| upgrade | 58, 32, none                  | 58, none, none             | 58, 32, none  |
| doodad  | 376, 192, 203                 | no file                    | no file       |

So the rule would leave out buffs from the sets of Reign of Chaos (94 rows) and from Melee of The Frozen Throne (77), and no upgrade from any set: the layers of Reign of Chaos hold none of version 1, and no layer holds one of version 2.

- Probe: `probe/probes/builtins-version-rule.ts`, run as `builtins-layers`. No Native creates a buff, so it looks for one on a unit with `GetUnitAbilityLevel` of the buff's Rawcode, as [#581](https://github.com/phmilk/reforged-ts/issues/581) read `BOac`. The data has two pairs of an ability a set holds and a buff of a later version than that set's: Sacred Aura `AHpa` (version 1) and its `BHas` (version 2), in the base layer only, and Rain of Fire `ANrf` (version 0) and its `BNrf` and `BNrd` (version 1), in every layer. Command Aura `ACac` and its `BOac`, both of version 0, are the control. An upgrade is researched with `SetPlayerTechResearched` for Player 0, then read with `GetPlayerTechCount` and `GetPlayerTechMaxAllowed`.
- 2026-10-19, Build 3.0.0.24268, each `finished` with 14 records:

| Game Data Set | Game Data Version | Run                                    |
| ------------- | ----------------- | -------------------------------------- |
| Custom        | Reign of Chaos    | `2efb9adb-03eb-4339-a284-6be4ebad21b5` |
| Custom        | The Frozen Throne | `22336bad-f4b8-437a-a43d-9cba168c567c` |
| Custom        | Forsaken Kingdom  | `57ae746b-8a2f-423f-9e6f-8aad77c19a51` |
| Melee         | Reign of Chaos    | `3c91fab5-68dc-48f8-b996-5c4323bec5b2` |
| Melee         | The Frozen Throne | `4c5f36ff-5431-4ee7-be73-4f08cc61bb98` |
| Melee         | Forsaken Kingdom  | `c2578f7e-704f-48ab-acc0-704a39b4bfad` |

Default is Custom's, as the runs of #575 measured, and is not run again.

| Record                          | Custom RoC    | Melee RoC     | Custom TFT    | Melee TFT     | any set FK    |
| ------------------------------- | ------------- | ------------- | ------------- | ------------- | ------------- |
| `AHpa` added                    | no            | no            | no            | yes           | yes           |
| `BHas` on its bearer            | 0             | 0             | 0             | 1             | 1             |
| `BOac` on its bearer            | 1             | 1             | 1             | 1             | 1             |
| `BNrf` on Rain of Fire's target | 1             | 1             | 1             | 1             | 1             |
| `BNrd` on Rain of Fire's target | 1             | 1             | 1             | 1             | 1             |
| `Rhme`: count, max              | 1, 3          | 1, 3          | 1, 3          | 1, 3          | 1, 3          |
| `Rhpm`: count, max              | 1, 2147483647 | 1, 2147483647 | 1, 1          | 1, 1          | 1, 1          |
| `Rzzz`: count, max              | 1, 2147483647 | 1, 2147483647 | 1, 2147483647 | 1, 2147483647 | 1, 2147483647 |

- **Buffs** (Observed): `BNrf` and `BNrd`, of version 1, reach Rain of Fire's target under both sets of Reign of Chaos, and `BHas`, of version 2, reaches Sacred Aura's bearer under Melee of The Frozen Throne. A buff of a later version is not left out, as a destructable is not. Under the other sets `AHpa` is not added, their layers lacking it, so they settle nothing about `BHas`. The caster never has Rain of Fire's buffs, under any set.
- **Upgrades** (Observed): `GetPlayerTechCount` gives back the level set whatever the Rawcode, `Rzzz` included, so it tells nothing apart. `GetPlayerTechMaxAllowed` does: 2147483647 for an upgrade the map's data does not hold, its maximum level for one it does. `Rhpm` is held where its set's layer lists it and not under Reign of Chaos, whose layers do not. So the layer decides, and no version rule is needed.
- **Doodads** (not measured): no Native creates a doodad. `BlzGetNumDoodads` and `BlzGetDoodadId` read only the doodads a map places, and the Probe map places none; measuring them would mean staging a `war3map.doo` with doodads of a later version. They keep every row.
- One run of Melee of The Frozen Throne and one of Melee of Reign of Chaos, of the Probe before its last checkpoint was added, stalled with the game's clock at 00:00:00 and the 2-second timer never run (`167ca11c-6420-4d8a-b98f-743127a14217`, `1d952a54-c708-4ad6-ad62-73c758d3287a`); the same runs again finished, as the table gives.

## What the index holds now

`reforged-builtins` lists six Game data sets, `custom-fk`, `melee-fk`, `custom-tft`, `melee-tft`, `custom-roc`, `melee-roc`, each reading the layer above, and leaving out the units, items and abilities of a later version. Destructables and buffs keep every row, as measured; so do upgrades, of which no layer holds one of a later version. Doodads are not measured and keep every row their set's layer lists (see [Buffs and upgrades](#buffs-and-upgrades)). The units each set holds: 928, 928, 864, 865, 470 and 469. The item `spur` is in no set, so its constant `Items.Unnamed_spur` is removed.
