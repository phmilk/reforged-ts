// One death handler for a unit and a tree: both are widgets, so the Trigger
// takes either, and Widget.fromEvent reads the one that died.
import {
  Destructable,
  Init,
  Trigger,
  tsGlobals,
  Unit,
  Widget,
} from "reforged-ts";

Init.onTriggers(() => {
  const footman = Unit.create(tsGlobals.Players[0], FourCC("hfoo"), 0, 0);
  const tree = Destructable.create({ typeId: FourCC("LTlt"), x: 256, y: 0 });

  const trigger = Trigger.create()
    .registerDeathEvent(footman)
    .registerDeathEvent(tree);
  trigger.addAction(() => {
    const widget = Widget.fromEvent();
    if (widget !== undefined) {
      print(`Died at ${String(widget.x)}, ${String(widget.y)}`);
    }
  });
});
