// A Probe of the Lua tests only, never of probe/probes: it renames its
// Result file mid-run (../renamed.test.ts). `run` holds the run, records a
// line and checkpoints into `renamed.txt`, tries a suffix outside the
// alphabet, renames the file to `renamed-label-1.txt` and records a second
// line. Its timer, fired by the test, finishes the run, then tries a rename
// past the end. The global setup builds it with the bridge fixtures' runId
// as the module `renamed_bundle`.

import type { ProbeContext } from "../../../game/probe";

export function run(p: ProbeContext): void {
  p.hold();
  p.record("step", { name: "before" });
  p.checkpoint();
  const [badOk, badMessage] = pcall(() => {
    p.rename("Bad Name");
  });
  p.record("bad", { ok: badOk, message: tostring(badMessage) });
  p.rename("label-1");
  p.record("step", { name: "after" });
  const timer = CreateTimer();
  TimerStart(timer, 1, false, () => {
    DestroyTimer(timer);
    p.finish();
    const [lateOk, lateMessage] = pcall(() => {
      p.rename("late");
    });
    p.show(`late ${tostring(lateOk)} ${tostring(lateMessage)}`, 1);
  });
}
