// The renamed Probe's bundle, as probe:build compiles it with the bridge
// fixtures' runId, run on the harness with the shipped stubs: `p.rename`
// moves the Result file at the next write, which puts every line so far in
// the new file, and leaves the old one as its last write left it. The tests
// share one Lua state and run in order.

import { describe, expect, it } from "reforged-test/lua";
import { encodeValue, recordLine, splitLine } from "../../game/encoding";
import { loadBundle, startedTimer } from "./bundle";

/** The Result file before the rename, under CustomMapData. */
const FIRST_FILE = "reforged-ts\\probes\\renamed.txt";

/** The Result file after `p.rename("label-1")`. */
const RENAMED_FILE = "reforged-ts\\probes\\renamed-label-1.txt";

/** The error a suffix outside the alphabet raises. */
const BAD_SUFFIX_MESSAGE = `Probe renamed: the suffix "${encodeValue("Bad Name")}", percent-encoded here, is not one a Result file name takes: lower-case a to z, 0 to 9 and -, and not empty.`;

describe("the renamed Probe's bundle", () => {
  it("writes nothing to the new name before the next write: the old file holds the checkpoint before the rename", () => {
    loadBundle("renamed");
    __stub_fire_timer(startedTimer(0));
    expect(__stub_preload_file(FIRST_FILE)).toEqual([
      "1 BEGIN patch=3.0.1.12345 probe=renamed run=bridge",
      "2 step name=before",
      "3 CHECKPOINT",
    ]);
    expect(__stub_preload_file(RENAMED_FILE)).toEqual(undefined);
  });

  it("writes every line of the run to the new file at the end, the records before the rename and the refused suffix's error included", () => {
    __stub_fire_timer(startedTimer(1));
    expect(__stub_preload_file(RENAMED_FILE)).toEqual([
      "1 BEGIN patch=3.0.1.12345 probe=renamed run=bridge",
      "2 step name=before",
      ...splitLine(
        recordLine(3, "bad", { message: BAD_SUFFIX_MESSAGE, ok: false }),
      ),
      "4 step name=after",
      "5 END status=ok",
    ]);
  });

  it("leaves the old file as its last write left it", () => {
    expect(__stub_preload_file(FIRST_FILE)).toEqual([
      "1 BEGIN patch=3.0.1.12345 probe=renamed run=bridge",
      "2 step name=before",
      "3 CHECKPOINT",
    ]);
  });

  it("refuses a rename once the run has ended, and writes no file under that name", () => {
    expect(
      __stub_preload_file("reforged-ts\\probes\\renamed-late.txt"),
    ).toEqual(undefined);
    expect(__stub_displayed().map(({ text }) => text)).toEqual([
      "Probe renamed: checkpoint 1, 1 record so far.",
      "Probe renamed finished: 3 records. Close the game.",
      "late false Probe renamed has ended: it takes no more renames.",
    ]);
  });
});
