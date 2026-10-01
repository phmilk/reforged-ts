// A Probe that throws: one record, then an Error from TypeScript. Its Result
// file is a bridge fixture of the runner's tests
// (test/fixtures/bridge/failing.txt): the record, then the runner's ERROR
// line with the Error's message, percent-encoded, and END status=failed.

import type { ProbeContext } from "../game/probe";

export function run(p: ProbeContext): void {
  p.record("step", { name: "before" });
  throw new Error('The step "after" broke.');
}
