// A Probe that ends on a timer: `run` holds the run, records one line and
// starts a 1-second timer, whose expiry records a second line and finishes
// the run, then asks for a checkpoint, which raises: past the end it would
// rewrite the Result file without its END line. The runner's tests fire the
// timer by hand.

import type { ProbeContext } from "../game/probe";

export function run(p: ProbeContext): void {
  p.hold();
  p.record("step", { name: "run" });
  const timer = CreateTimer();
  TimerStart(timer, 1, false, () => {
    DestroyTimer(timer);
    p.record("step", { name: "timer" });
    p.finish();
    pcall(() => {
      p.checkpoint();
    });
  });
}
