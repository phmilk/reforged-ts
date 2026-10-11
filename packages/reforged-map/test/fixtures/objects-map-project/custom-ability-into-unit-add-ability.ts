// Positive: a Custom ability's constant and its FourCC literal where
// UnitAddAbility takes an ability's Rawcode, with no cast.
import { CustomAbilities } from "./custom-abilities";

declare const hero: unit;
UnitAddAbility(hero, CustomAbilities.FrostStorm_A000);
UnitAddAbility(hero, FourCC("A000"));
