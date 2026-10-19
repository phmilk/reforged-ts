# reforged-builtins

## 1.0.0-alpha.3

### Patch Changes

- [#629](https://github.com/phmilk/reforged-ts/pull/629) [`653e843`](https://github.com/phmilk/reforged-ts/commit/653e8433f82035047d7d0b6bb0378f369e9d127c) Thanks [@wyller](https://github.com/wyller)! - The README says how the Game data sets treat buffs, upgrades and doodads, now measured in game ([#622](https://github.com/phmilk/reforged-ts/issues/622)). A map still gives a unit a buff of a later Game Data Version, so every set keeps its buffs. Upgrades follow their layer, which holds none of a later version. Doodads, which no Native creates, stay unmeasured. The objects and their sets do not change.

## 1.0.0-alpha.2

### Patch Changes

- [#626](https://github.com/phmilk/reforged-ts/pull/626) [`31d9d4f`](https://github.com/phmilk/reforged-ts/commit/31d9d4ff13d4671837e80277d8ba95badd71e3d1) Thanks [@wyller](https://github.com/wyller)! - An object's TSDoc says by Game Data Version which Game data sets hold it, in one short line ("Forsaken Kingdom only.", "Not in Reign of Chaos.", "Melee only in The Frozen Throne."), instead of listing up to six sets.

- [#623](https://github.com/phmilk/reforged-ts/pull/623) [`4ec629b`](https://github.com/phmilk/reforged-ts/commit/4ec629bb074818017e5cee75e83969c9c55b675b) Thanks [@wyller](https://github.com/wyller)! - The README's record of a Patch: a Game data set the index no longer lists, by its id, is a major; a set it adds, or a new label on a set it keeps, is a minor.

## 1.0.0-alpha.1

### Major Changes

- [#596](https://github.com/phmilk/reforged-ts/pull/596) [`4738a37`](https://github.com/phmilk/reforged-ts/commit/4738a376fd129dd5fec94d8b4182c63a4b5d5b77) Thanks [@wyller](https://github.com/wyller)! - The Game data sets follow the layers the game reads, measured in game on 3.0.0.24268 ([#575](https://github.com/phmilk/reforged-ts/issues/575)). A map's objects depend on its Game Data Version as well as its Game Data Set, so the index now has one Game data set per pair: `custom-fk`, `melee-fk`, `custom-tft`, `melee-tft`, `custom-roc` and `melee-roc`, in place of `default`, `custom` and `melee`. Each set reads `_Balance/<Set>_V<version>` where the install has that layer, else the base layer, and leaves out the units, items and abilities of a later Game Data Version. Default has no set of its own, since it reads Custom, or Melee on a melee map.

  A map of Forsaken Kingdom, which the World Editor gives a new map, holds every object whatever its set, so the hover of an object such as `Units.GuardLieutenant_Hct1` no longer says it is missing from Custom and Melee. A tool that reads `index.json` finds the new ids in `gameDataSets` and in each object's `sets`.

  `Items.Unnamed_spur` is removed: the item is in no set the game reads. Only Reign of Chaos layers list it, and a Reign of Chaos map leaves it out, since it belongs to The Frozen Throne.

- [#578](https://github.com/phmilk/reforged-ts/pull/578) [`2e1e016`](https://github.com/phmilk/reforged-ts/commit/2e1e01611286032e9ad9119a0ca58f2452a85c24) Thanks [@phmilk](https://github.com/phmilk)! - The Built-in objects take the names the game gives, measured in game on 3.0.0.24268 ([#564](https://github.com/phmilk/reforged-ts/issues/564)): an object named twice in the names files takes its first name, not its last, and a profile section names its Rawcode whatever its case (`[ANsp]` names `Ansp`). 19 constants change name, which breaks code that names them:

  - named twice: `Units.DeathKnight_Ubtr` is `Units.Noble_Ubtr`; `Abilities.ItemLesserMarkOfTheForsaken_Almf` is `Abilities.DeathCoil_Almf`; `Abilities.ItemBlueDrakeSummon_AIfd` is `Abilities.ItemRedDrakeSummon_AIfd`; `Abilities.ItemBlueDragonspawnOverseerSummon_AIff` is `Abilities.ItemFurbolgSummon_AIff`; `Abilities.ItemBlueDragonFigurine_Abdf` is `Abilities.BreathOfFrost_Abdf`; `Abilities.ItemEdricsEye_AIee` is `Abilities.ForsakenGaze_AIee`; `Abilities.ItemEssenceOfTheSpiderQueen_Aesq` is `Abilities.EssenceOfTheSpiderQueen_Aesq`; `Abilities.ItemKnightsJavelin_Atkj` is `Abilities.KnightsJavelin_Atkj`; `Abilities.ItemForsakenFangs_Atff` is `Abilities.Cannibalize_Atff`; `Abilities.ItemDrunkenHazePintOfAle_Apoa` is `Abilities.DrunkenHaze_Apoa`; `Abilities.ItemInfectiousClaws_Auic` is `Abilities.InfectiousClaws_Auic`; `Abilities.ItemSummonInfectiousGhoul_Asic` is `Abilities.SummonInfectiousGhoul_Asic`; `Abilities.SummonBanshee_AFRw` is `Abilities.ItemSummonBanshee_AFRw`; `Buffs.DustOfAppearance_Bdet` is `Buffs.Detected_Bdet`.
  - a section cased unlike its Rawcode, unnamed until now: `Abilities.Unnamed_Ansp` is `Abilities.Spy_Ansp`; `Abilities.Unnamed_Aisy` is `Abilities.ItemAttackSpeedBonus_Aisy`; `Abilities.Unnamed_AEqu` is `Abilities.EquipmentSlots_AEqu`; `Buffs.Unnamed_BOac` is `Buffs.CommandAura_BOac`; `Buffs.Unnamed_Xesn` is `Buffs.SentinelEffect_Xesn`.

  No Native gives a buff's name, so `Bdet`, `BOac` and `Xesn` follow the abilities' rules by inference, whose names files they share. Their check on screen is [#581](https://github.com/phmilk/reforged-ts/issues/581); should it disagree, a later release renames them again.

## 1.0.0-alpha.0

### Major Changes

- [#570](https://github.com/phmilk/reforged-ts/pull/570) [`224b83b`](https://github.com/phmilk/reforged-ts/commit/224b83bcf6092bc0e63538694c1977e1a7d731b6) Thanks [@wyller](https://github.com/wyller)! - First release of `reforged-builtins`, the Built-in objects of Patch 3.0.0.24268 reduced to derived identifiers: Rawcode, Object kind, race, enUS name and the Game data sets that hold each object. Adding `reforged-builtins/3.0.0` to `types` next to the Typings' entry gives each `FourCC` literal of a Built-in object its kind, with no edit and no change to the emitted Lua: `FourCC("hfoo")` is a `Rawcode<"unit">`. Each Object kind has an entry point of constants named after the objects, such as `Units.Footman_hfoo` from `reforged-builtins/units`, each the same integer `FourCC` gives. `3.0.0/index.json` holds the index for tools. It needs `reforged-types` 1.0.0-alpha.5 or later as a peer, the first that declares the Rawcode types. Install it with `pnpm add -D reforged-builtins@next`.
