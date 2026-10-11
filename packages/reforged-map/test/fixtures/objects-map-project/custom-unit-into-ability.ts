// Negative: a Custom unit's constant where UnitAddAbility expects an
// ability's Rawcode.
import { CustomUnits } from "./custom-units";

declare const hero: unit;
UnitAddAbility(hero, CustomUnits.Captain_h000);
