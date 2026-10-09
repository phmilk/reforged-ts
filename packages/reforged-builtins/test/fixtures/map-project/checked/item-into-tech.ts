// Negative: an item's constant where SetPlayerTechResearched expects a unit's or an upgrade's.
import { Items } from "reforged-builtins/items";
declare const owner: player;
SetPlayerTechResearched(owner, Items.ClawsOfAttack15_ratf, 1);
