// Dev mode on, then the report after a while: a Timer that fails every tick
// is reported on screen once and counted, and each Wrapper class the library
// created shows its live count.
import { Init, Reforged, Timer } from "reforged-ts";

Reforged.configure({ devMode: true });

Init.onGameStart(() => {
  Timer.every(1, () => {
    error("tick failed");
  });

  Timer.after(10, () => {
    const { failures, wrappers } = Reforged.debug.report();
    // failures: one row, "Timer#<id> Timer.every", its count one per tick
    // so far. wrappers: among others a "Timer" row, created 2, destroyed 0,
    // live 2 while this handler runs (its one-shot Timer is destroyed after).
    print(`${String(failures.length)} failing callback(s)`);
    print(`${String(wrappers.length)} class(es) counted`);
  });
});
