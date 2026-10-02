// A held Probe whose later step throws: `run` holds the run, records one
// line and asks the runner for a 1-second timer with `p.after`, whose
// callback records a second line, then throws an Error. The runner catches
// it as it catches one `run` throws: ERROR with the Error's message, then
// END status=failed. The runner's tests fire the timer by hand.

import type { ProbeContext } from "../game/probe";

export function run(p: ProbeContext): void {
  p.hold();
  p.record("step", { name: "run" });
  p.after(1, () => {
    p.record("step", { name: "timer" });
    throw new Error("The later step broke.");
  });
}
