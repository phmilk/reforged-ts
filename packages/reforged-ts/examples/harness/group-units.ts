// Three footmen gathered in a group, counted, and sent together to the east
// a second after the game starts.
import { Group, Init, Timer, tsGlobals, Unit } from "reforged-ts";

Init.onTriggers(() => {
  const squad = Group.create();
  for (const x of [0, 64, 128]) {
    squad.addUnit(Unit.create(tsGlobals.Players[0], FourCC("hfoo"), x, 0));
  }
  print(`${String(squad.size)} footmen`);

  for (const footman of squad.getUnits()) {
    print(`Footman ${String(footman.id)} joins the squad`);
  }

  Timer.after(1, () => {
    squad.orderCoords(tsGlobals.OrderId.Move, 1024, 0);
  });
});
