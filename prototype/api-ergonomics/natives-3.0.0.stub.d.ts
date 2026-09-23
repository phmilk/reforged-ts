/** @noSelfInFile */
// PROTOTYPE STUB. The current Typings stop at Patch 1.33.0; these are the 3.0.0
// natives the usage examples need. Names come from the 3.0.0 common.j diff
// (https://github.com/lep/jassdoc/pull/236); the accessor signature of
// GetEquippedItem is ASSUMED (event response returning the item), to be confirmed
// by the generated Typings from `reforged-types`.

declare const EVENT_PLAYER_UNIT_EQUIP_ITEM: playerunitevent;
declare const EVENT_PLAYER_UNIT_UNEQUIP_ITEM: playerunitevent;
declare function GetEquippedItem(): item | undefined;
declare function UnitEquipItem(whichUnit: unit, whichItem: item): boolean;
