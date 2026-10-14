// Positive: each Object kind's constants and FourCC literals where the
// Natives take that kind's Rawcode, with no cast; a modified Built-in
// object's literal included, and B000's, which two kinds share and so has
// no overload: its literal goes anywhere.
import { CustomAbilities } from "./custom-abilities";
import { CustomBuffs } from "./custom-buffs";
import { CustomDestructables } from "./custom-destructables";
import { CustomDoodads } from "./custom-doodads";
import { CustomItems } from "./custom-items";
import { CustomUnits } from "./custom-units";
import { CustomUpgrades } from "./custom-upgrades";

declare const owner: player;
declare const hero: unit;

CreateUnit(owner, CustomUnits.Captain_h000, 0, 0, 0);
CreateUnit(owner, CustomUnits.ChevalierElu_h001, 0, 0, 0);
CreateUnit(owner, FourCC("h001"), 0, 0, 0);
CreateUnit(owner, FourCC("hfoo"), 0, 0, 0);
CreateItem(CustomItems.CaptainsClaws_I000, 0, 0);
CreateItem(FourCC("ratc"), 0, 0);
UnitAddAbility(hero, CustomAbilities.ArcticBlizzard_A000);
UnitAddAbility(hero, FourCC("AHhb"));
UnitApplyTimedLife(hero, CustomBuffs.HolyFire_B000, 1);
UnitApplyTimedLife(hero, FourCC("Binf"), 1);
UnitApplyTimedLife(hero, FourCC("B000"), 1);
CreateDestructable(FourCC("B000"), 0, 0, 0, 1, 0);
CreateDestructable(CustomDestructables.Gate_B000, 0, 0, 0, 1, 0);
CreateDestructable(FourCC("LTlt"), 0, 0, 0, 1, 0);
SetDoodadAnimation(
  0,
  0,
  100,
  CustomDoodads.StatueOfTheCaptain_D000,
  false,
  "stand",
  false,
);
SetDoodadAnimation(0, 0, 100, FourCC("AObr"), false, "stand", false);
SetPlayerTechResearched(owner, CustomUpgrades.SharperSwords_R000, 1);
SetPlayerTechResearched(owner, FourCC("Rhar"), 1);
