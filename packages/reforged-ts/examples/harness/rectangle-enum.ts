// An area in the middle of the map, checked every 30 seconds: the units
// inside are counted through a Group, the items inside are removed through
// the Rectangle itself.
import { Group, Init, Item, Rectangle, Trigger } from "reforged-ts";

Init.onTriggers(() => {
  const arena = Rectangle.create(-512, -512, 512, 512);
  const units = Group.create();

  Trigger.create()
    .registerTimerEvent(30, true)
    .addAction(() => {
      units.enumUnitsInRect(arena, () => true);
      print(`${String(units.size)} units in the arena`);

      arena.enumItems(
        () => true,
        () => {
          Item.fromEnum()?.destroy();
        },
      );
    });
});
