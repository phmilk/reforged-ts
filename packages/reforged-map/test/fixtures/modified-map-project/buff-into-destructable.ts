// Negative: the Custom buff's constant of the shared B000 where
// CreateDestructable expects a destructable's Rawcode.
import { CustomBuffs } from "./custom-buffs";

CreateDestructable(CustomBuffs.HolyFire_B000, 0, 0, 0, 1, 0);
