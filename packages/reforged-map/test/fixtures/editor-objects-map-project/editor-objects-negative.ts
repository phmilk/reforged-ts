// Negative: a Custom doodad's constant where a unit's Rawcode is expected,
// and the Custom buff's constant of the shared B000 where a destructable's
// is expected.
import { CustomBuffs } from "./custom-buffs";
import { CustomDoodads } from "./custom-doodads";
declare const owner: player;
CreateUnit(owner, CustomDoodads.StatueOfTheCaptain_D000, 0, 0, 0);
CreateDestructable(CustomBuffs.HolyFire_B000, 0, 0, 0, 1, 0);
