// Negative: a unit's constant where UnitAddAbility expects an ability's.
import { Units } from "reforged-builtins/units";
declare const footman: unit;
UnitAddAbility(footman, Units.Footman_hfoo);
