// The names and texts of units, items and destructables come in each
// client's own language, so they differ between players: show them, and
// decide by the type's rawcode, which every client shares.
import {
  Destructable,
  Init,
  Item,
  on,
  tsGlobals,
  Unit,
  UnitEvents,
} from "reforged-ts";

Init.onTriggers(() => {
  // A rawcode decides which item counts; the text only describes it.
  on(
    UnitEvents.pickupItem,
    ({ unit, item }) => {
      print(`${unit.name} picked up ${item.name}: ${item.tooltip}`);
      print(
        item.extendedTooltip !== "" ? item.extendedTooltip : item.description,
      );
    },
    ({ item }) => item.typeId === FourCC("ratf"),
  );

  const tree = Destructable.create({ typeId: FourCC("LTlt"), x: 256, y: 0 });
  const footman = Unit.create(tsGlobals.Players[0], FourCC("hfoo"), 0, 0);
  print(`${footman.name} stands next to a ${tree.name ?? "tree"}`);
  Item.create(FourCC("ratf"), 128, 0);
});
