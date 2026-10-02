// The smallest Probe: two records, no Native, each after its PENDING line
// and followed by a checkpoint. Its Result files are the bridge fixtures of
// the runner's tests (test/fixtures/bridge/): hello.txt when it finishes,
// hello-checkpoint.txt as its second checkpoint leaves it. A plain record,
// then one whose values the writer percent-encodes and whose line it splits
// into a continuation line.

import type { ProbeContext } from "../game/probe";

/**
 * Every byte of ASCII the writer escapes, in order: the control characters,
 * space, `"`, the percent sign, `=`, `\` and DEL.
 */
function escapedAscii(): string {
  let bytes = "";
  for (let byte = 0; byte < 32; byte++) {
    bytes += string.char(byte);
  }
  return `${bytes} "${string.char(37)}=\\${string.char(127)}`;
}

export function run(p: ProbeContext): void {
  p.pending("greet");
  p.record("greeting", { word: "hello", count: 1 });
  p.checkpoint();
  p.pending("encode");
  p.record("encoded", {
    ascii: escapedAscii(),
    utf8: "héllo, wörld: ✓ 日本語",
  });
  p.checkpoint();
}
