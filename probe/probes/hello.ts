// The smallest Probe: one record, no Native. Its Result file is the bridge
// fixture of the runner's tests (test/fixtures/bridge/hello.txt).

import type { ProbeContext } from "../game/probe";

export function run(p: ProbeContext): void {
  p.record("greeting", { word: "hello", count: 1 });
}
