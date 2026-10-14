// B000, a Custom buff and a Custom destructable: each constant goes where
// its own kind is expected, and the literal, with no overload, stays an
// UnknownRawcode that every Rawcode parameter accepts (ADR 0014).
import { CustomBuffs } from "./custom-buffs";
import { CustomDestructables } from "./custom-destructables";

declare const target: unit;
UnitApplyTimedLife(target, CustomBuffs.HolyFire_B000, 1);
CreateDestructable(CustomDestructables.Gate_B000, 0, 0, 0, 1, 0);
UnitApplyTimedLife(target, FourCC("B000"), 1);
