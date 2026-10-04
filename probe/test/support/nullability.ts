// What the tests of the Nullability sweep's commands share: a Slice's
// build and Result file on a fake machine, the fixture Overlay and the
// fixture vendor folder.

import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { systemMachine, type Machine } from "../../src/machine.js";
import type { SliceContext } from "../../src/nullability/report.js";
import { resultFile } from "../../src/read.js";
import { stateFile } from "../../src/state.js";
import { USER_FOLDER_VARIABLE } from "../../src/user-folder.js";
import { preloadFile } from "./bridge.js";

/** The Slice the hand-written Result files belong to. */
export const PROBE = "nullability-slice-1";

/** The runId of the Slice's last build, in the state file and the Result files. */
export const RUN_ID = "slice-run";

/**
 * The fixture Overlay: CreateTimer, a constructor, and GetOwningPlayer, an
 * intrinsic property, non-null; Location, a constructor, nullable.
 */
export const OVERLAY_FOLDER = fileURLToPath(
  new URL("../fixtures/nullability/overlay/", import.meta.url),
);

/**
 * The fixture vendor folder: the `common.j` of `PATCH`, with three
 * converters, ConvertRace, ConvertMouseButtonType and
 * ConvertAbilityIntegerLevelArrayField, whose type has no constant.
 */
export const VENDOR_FOLDER = fileURLToPath(
  new URL("../fixtures/nullability/vendor/", import.meta.url),
);

/**
 * The Patch the Slice's build baked, in the Result files' `BEGIN` line: not
 * the Typings' own.
 */
export const PATCH = "3.0.0.12345";

/** The Build of the game client `probe:run` ran the Slice's build on. */
export const CLIENT = "3.0.0.12345";

/** The lines of a Result file: `BEGIN`, then `records`, each numbered. */
export function numbered(records: readonly string[]): string[] {
  return [`BEGIN patch=${PATCH} probe=${PROBE} run=${RUN_ID}`, ...records].map(
    (line, index) => `${String(index + 1)} ${line}`,
  );
}

/** A Slice's build in a temporary folder. */
export interface SliceSetup {
  /** The temporary folder, for the files a test adds. */
  dir: string;
  context: SliceContext;
  /** Where the game writes the Slice's Result file. */
  resultFile: string;
}

/**
 * A temporary Warcraft III user folder, named by WC3_USER_FOLDER on the real
 * machine, and a state folder holding the Slice's build with `RUN_ID`, run
 * on `CLIENT`,
 * with the fixture Overlay and vendor folder.
 */
export async function sliceSetup(): Promise<SliceSetup> {
  const dir = await mkdtemp(join(tmpdir(), "probe-nullability-"));
  const userFolder = join(dir, "Warcraft III");
  const stateFolder = join(dir, "state");
  await mkdir(stateFolder);
  await writeFile(
    stateFile(stateFolder, PROBE),
    JSON.stringify({ probe: PROBE, runId: RUN_ID, client: CLIENT }),
  );
  // The fake machine is linux on every host, so its paths join with "/":
  // the reader's own resultFile gives the path it reads.
  const machine: Machine = {
    ...systemMachine,
    platform: "linux",
    env: { [USER_FOLDER_VARIABLE]: userFolder },
    // Under WSL the real process list would find a game the human left open.
    isRunning: () => false,
  };
  return {
    dir,
    context: {
      machine,
      stateFolder,
      overlayFolder: OVERLAY_FOLDER,
      vendorFolder: VENDOR_FOLDER,
    },
    resultFile: resultFile(machine, PROBE),
  };
}

/** Writes the Result file as the game does, its lines through `Preload`. */
export async function writeResultFile(file: string, lines: readonly string[]) {
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, preloadFile(lines));
}

/**
 * The records of one return case of `native` that gave a handle of `id`:
 * its CASE, then its PENDING and CALL. The CASE records come first in a
 * run: `handleCase` returns them apart.
 */
export function handleCase(
  native: string,
  label: string,
  id: number | string,
): { plan: string; records: string[] } {
  const encoded = label.replaceAll(" ", "%20");
  const fields = `case=${encoded} group=a`;
  return {
    plan: `CASE ${fields} native=${native}`,
    records: [
      `PENDING label=${native}%20${encoded}`,
      `CALL ${fields} id=${String(id)} native=${native} outcome=handle type=handle:%2000000001`,
    ],
  };
}

/** A finished run of `cases`: their CASE records, then their other records. */
export function caseRun(
  cases: readonly { plan: string; records: readonly string[] }[],
): string[] {
  return numbered([
    ...cases.map(({ plan }) => plan),
    ...cases.flatMap(({ records }) => records),
    "END status=ok",
  ]);
}
