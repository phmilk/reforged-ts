// `probe:nullability-curate` (src/nullability/curate.ts): a Slice's verdicts
// applied to a copy of the report's fixture Overlay.

import { cp, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main, type Context } from "../src/cli/nullability-curate.js";
import {
  caseRun,
  handleCase,
  OVERLAY_FOLDER,
  PROBE,
  RUN_ID,
  sliceSetup,
  writeResultFile,
} from "./support/nullability.js";

/** An Overlay entry, as a test writes it. */
type Entry = Record<string, unknown>;

/** A seeded entry of a Native of `family` that takes one integer. */
function entry(
  name: string,
  nullable: boolean,
  family: string,
  more: Entry = {},
): Entry {
  const { notes, ...rest } = more;
  return {
    name,
    source: "common.j",
    returns: { nullable, family },
    params: [{ name: "i", nullable: false }],
    ...(notes === undefined ? {} : { notes }),
    origin: "war3-types-strict",
    ...rest,
  };
}

/** The entry of a `GroupEnum*` Native, whose `filter` is nullable. */
function filterEntry(name: string): Entry {
  return {
    name,
    source: "common.j",
    returns: { nullable: false },
    params: [
      { name: "whichGroup", nullable: false },
      { name: "filter", nullable: true },
    ],
    origin: "war3-types-strict",
  };
}

/** The records of one case of `native` that gave `outcome`. */
function otherCase(
  native: string,
  label: string,
  outcome: "nil" | "error",
): { plan: string; records: string[] } {
  const encoded = label.replaceAll(" ", "%20");
  const fields = `case=${encoded} group=a`;
  return {
    plan: `CASE ${fields} native=${native}`,
    records: [
      `PENDING label=${native}%20${encoded}`,
      outcome === "nil"
        ? `CALL ${fields} native=${native} outcome=nil`
        : `CALL ${fields} message=bad%20arg native=${native} outcome=error`,
    ],
  };
}

/** The records of one completed call case of `native`'s `filter`. */
function filterCase(
  native: string,
  label: string,
  argument: "nil" | "always-true",
  outcome: "completed" | "error" = "completed",
): { plan: string; records: string[] } {
  const encoded = label.replaceAll(" ", "%20");
  const fields = `argument=${argument} case=${encoded} counted=unit group=a native=${native}`;
  return {
    plan: `CASE ${fields} param=filter`,
    records: [
      `PENDING label=${native}%20${encoded}`,
      outcome === "completed"
        ? `CALL argument=${argument} case=${encoded} count=3 counted=unit group=a native=${native} outcome=completed param=filter`
        : `CALL argument=${argument} case=${encoded} counted=unit group=a message=bad%20filter native=${native} outcome=error param=filter`,
    ],
  };
}

/**
 * The Slice's build with a copy of the fixture Overlay holding `entries`
 * besides its own, and the Result file of a finished run of `cases`.
 */
async function curationSetup(
  entries: readonly Entry[],
  cases: readonly { plan: string; records: readonly string[] }[],
): Promise<{ context: Context; functions: string }> {
  const { dir, context, resultFile } = await sliceSetup();
  const overlayFolder = join(dir, "overlay");
  await cp(OVERLAY_FOLDER, overlayFolder, { recursive: true });
  const functions = join(overlayFolder, "common.j", "functions");
  for (const written of entries) {
    await writeFile(
      join(functions, `${String(written.name)}.json`),
      `${JSON.stringify(written, null, 2)}\n`,
    );
  }
  await writeResultFile(resultFile, caseRun(cases));
  return { context: { ...context, overlayFolder }, functions };
}

/** The entry of `native` under `functions`, as the command left it. */
async function read(functions: string, native: string): Promise<string> {
  return readFile(join(functions, `${native}.json`), "utf8");
}

/** Every file under `folder` with its text. */
async function snapshot(folder: string): Promise<Record<string, string>> {
  const files = await readdir(folder, { recursive: true });
  const texts = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(
        async (file) => [file, await read(folder, file.slice(0, -5))] as const,
      ),
  );
  return Object.fromEntries(texts);
}

/** Runs the command on `context`, and what it printed. */
function runMain(context: Context, args: readonly string[] = [PROBE]) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = main(
    args,
    {
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    },
    context,
  );
  return { code, stdout: stdout.join(""), stderr: stderr.join("") };
}

/** The condensed notes of a converter of the fixture common.j's ConvertRace. */
const RACE_NOTES =
  "Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.12345); the handle's id is the integer passed in. Evidence, not proof.";

/** The cases of ConvertRace, each giving the integer passed in as its id. */
const RACE_CASES = (
  [
    ["RACE_NONE", 0],
    ["RACE_HUMAN", 1],
    ["RACE_ORC or RACE_GREEN", 2],
    ["-1", -1],
    ["past the last constant", 3],
    ["2147483647", 2147483647],
    ["-2147483648", -2147483648],
  ] as const
).map(([label, id]) => handleCase("ConvertRace", label, id));

describe("probe:nullability-curate", () => {
  it("narrows a converter backed non-null and writes its notes after its params, keeping every other field", async () => {
    const { context, functions } = await curationSetup(
      [entry("ConvertRace", true, "converter")],
      RACE_CASES,
    );
    expect(runMain(context)).toEqual({
      code: 0,
      stdout: [
        `Applied Probe ${PROBE}, run ${RUN_ID} on 3.0.0.12345, to the Overlay: 1 of 1 entries written.`,
        "ConvertRace (non-null (evidence, handle id 0)): returns.nullable narrowed to false; notes written",
        "",
      ].join("\n"),
      stderr: "",
    });
    expect(await read(functions, "ConvertRace")).toBe(
      `${JSON.stringify(
        {
          name: "ConvertRace",
          source: "common.j",
          returns: { nullable: false, family: "converter" },
          params: [{ name: "i", nullable: false }],
          notes: RACE_NOTES,
          origin: "war3-types-strict",
        },
        null,
        2,
      )}\n`,
    );
  });

  it("writes notes and leaves returns.nullable as it is for a Native already non-null, a nullable verdict and a nullable family", async () => {
    const { context, functions } = await curationSetup(
      [entry("GetTriggerUnit", true, "event-response")],
      [
        handleCase("CreateTimer", "one call", 1048577),
        otherCase("Location", "outside the world", "nil"),
        handleCase("GetTriggerUnit", "outside its event", 1048578),
      ],
    );
    expect(runMain(context).stdout).toBe(
      [
        `Applied Probe ${PROBE}, run ${RUN_ID} on 3.0.0.12345, to the Overlay: 3 of 3 entries written.`,
        "CreateTimer (non-null (evidence)): notes written",
        "Location (nullable (proved)): notes written",
        "GetTriggerUnit (nullable (rule)): notes written",
        "",
      ].join("\n"),
    );
    const returns = async (native: string) =>
      (JSON.parse(await read(functions, native)) as { returns: Entry }).returns;
    expect(await returns("CreateTimer")).toEqual({
      nullable: false,
      family: "constructor",
    });
    expect(await returns("Location")).toEqual({
      nullable: true,
      family: "constructor",
    });
    expect(await returns("GetTriggerUnit")).toEqual({
      nullable: true,
      family: "event-response",
    });
    expect(JSON.parse(await read(functions, "Location"))).toMatchObject({
      notes:
        "Returned nothing in a case of the nullability sweep (outside the world) on 3.0.0.12345.",
    });
  });

  it("keeps the notes an entry holds and prints the proposal, and leaves a review's entry as it is", async () => {
    const triggerAddAction = entry("TriggerAddAction", true, "registration", {
      notes: "Hand-written.",
    });
    const createUnit = entry("CreateUnit", true, "constructor");
    const { context, functions } = await curationSetup(
      [triggerAddAction, createUnit],
      [
        handleCase("TriggerAddAction", "destroyed trigger", 0),
        otherCase("CreateUnit", "one call", "error"),
      ],
    );
    expect(runMain(context).stdout).toBe(
      [
        `Applied Probe ${PROBE}, run ${RUN_ID} on 3.0.0.12345, to the Overlay: 1 of 2 entries written.`,
        "TriggerAddAction (non-null (evidence, handle id 0)): returns.nullable narrowed to false; notes kept; proposed for the review: Returned a handle in every case of the nullability sweep (destroyed trigger) on 3.0.0.12345; evidence, not proof. The handle had id 0 in a case (destroyed trigger).",
        "CreateUnit (review): notes left for review",
        "",
      ].join("\n"),
    );
    expect(JSON.parse(await read(functions, "TriggerAddAction"))).toEqual({
      ...triggerAddAction,
      returns: { nullable: false, family: "registration" },
    });
    expect(await read(functions, "CreateUnit")).toBe(
      `${JSON.stringify(createUnit, null, 2)}\n`,
    );
  });

  it("writes nothing when it runs again", async () => {
    const { context, functions } = await curationSetup(
      [entry("ConvertRace", true, "converter")],
      RACE_CASES,
    );
    runMain(context);
    const before = await snapshot(functions);
    expect(runMain(context).stdout).toBe(
      [
        `Applied Probe ${PROBE}, run ${RUN_ID} on 3.0.0.12345, to the Overlay: 0 of 1 entries written.`,
        "ConvertRace (non-null (evidence, handle id 0)): unchanged",
        "",
      ].join("\n"),
    );
    expect(await snapshot(functions)).toEqual(before);
  });

  it("writes a filter's sentence as its Native's notes and never changes the parameter, and leaves a filter under review without notes", async () => {
    const { context, functions } = await curationSetup(
      [
        filterEntry("GroupEnumUnitsInRect"),
        filterEntry("GroupEnumUnitsInRange"),
      ],
      [
        filterCase("GroupEnumUnitsInRect", "nil filter", "nil"),
        filterCase("GroupEnumUnitsInRect", "always-true filter", "always-true"),
        filterCase("GroupEnumUnitsInRange", "nil filter", "nil", "error"),
      ],
    );
    expect(runMain(context).stdout).toBe(
      [
        `Applied Probe ${PROBE}, run ${RUN_ID} on 3.0.0.12345, to the Overlay: 1 of 2 entries written.`,
        "GroupEnumUnitsInRect (parameter filter nullable (completed)): notes written",
        "GroupEnumUnitsInRange (parameter filter review): notes left for review",
        "",
      ].join("\n"),
    );
    expect(JSON.parse(await read(functions, "GroupEnumUnitsInRect"))).toEqual({
      ...filterEntry("GroupEnumUnitsInRect"),
      notes: "A nil filter keeps every unit (nullability sweep, 3.0.0.12345).",
    });
    expect(JSON.parse(await read(functions, "GroupEnumUnitsInRange"))).toEqual(
      filterEntry("GroupEnumUnitsInRange"),
    );
  });

  it("refuses a Slice with a mismatch, one line per Native and parameter, and writes nothing", async () => {
    const groupEnum = {
      ...filterEntry("GroupEnumUnitsInRect"),
      params: [
        { name: "whichGroup", nullable: false },
        { name: "filter", nullable: false },
      ],
    };
    const { context, functions } = await curationSetup(
      [entry("ConvertRace", true, "converter"), groupEnum],
      [
        ...RACE_CASES,
        otherCase("GetOwningPlayer", "removed unit", "nil"),
        filterCase("GroupEnumUnitsInRect", "nil filter", "nil"),
      ],
    );
    const before = await snapshot(functions);
    expect(runMain(context)).toEqual({
      code: 1,
      stdout: "",
      stderr: [
        `probe:nullability-curate failed: Probe ${PROBE}'s run ${RUN_ID} gives a mismatch, which a bug issue per Native tracks and its group's curation pull request fixes by hand (probe/README.md); nothing was written:`,
        "GetOwningPlayer: nullable (proved), Overlay returns.nullable false",
        "GroupEnumUnitsInRect parameter filter: nullable (completed), Overlay params[].nullable false",
        "",
      ].join("\n"),
    });
    expect(await snapshot(functions)).toEqual(before);
  });

  it("refuses what the report refuses, and a call without one Probe", async () => {
    const { context } = await curationSetup(
      [],
      [handleCase("CreateNothing", "one call", 1)],
    );
    expect(runMain(context)).toEqual({
      code: 1,
      stdout: "",
      stderr: `probe:nullability-curate failed: CreateNothing has no Overlay entry in ${context.overlayFolder}: the report compares each verdict with one.\n`,
    });
    expect(runMain(context, [])).toEqual({
      code: 1,
      stdout: "",
      stderr: "Usage: probe:nullability-curate <probe>\n",
    });
  });
});
