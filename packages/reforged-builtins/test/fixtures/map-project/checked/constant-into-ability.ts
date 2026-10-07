// Negative: a unit's constant where UnitAddAbility expects an ability's Rawcode.
import { Units } from "reforged-builtins/units";
declare const hero: unit;
UnitAddAbility(hero, Units.Footman_hfoo);
