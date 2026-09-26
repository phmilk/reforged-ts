import { describe, expect, it } from "vitest";
import {
  runOn,
  standardExclusions,
  standardSources,
  type Fixture,
} from "./support/fixture.js";

/** The standard fixture with its one missing Native excluded too. */
const complete = (): Fixture => ({
  exclusions: [
    ...standardExclusions(),
    {
      native: "SetUnitFacingTimed",
      reason: "Turns the unit instantly in 3.0.0.",
      source: "jassdoc bug note on SetUnitFacingTimed",
      date: "2026-09-25",
    },
  ],
});

describe("coverage:report", () => {
  it("exits 0 and writes both files when no owned Native is missing", async () => {
    const run = await runOn(complete());

    expect(run.status).toBe(0);
    expect(run.stderr).toBe("");
    expect(run.stdout).toMatch(
      /^Wrapper coverage of Patch 3\.0\.0\.24268: 8 owned Natives, 6 covered, 2 excluded, 0 missing; 0 problems\. Wrote .*report\.json, .*report\.md\.\n$/,
    );
    expect(run.json).toMatchObject({ totals: { missing: 0 }, problems: [] });
    expect(run.markdown).toMatch(/^# Wrapper coverage report\n/);
  });

  it("exits 1 on a missing Native, listing it with its owner, and still writes the files", async () => {
    const run = await runOn();

    expect(run.status).toBe(1);
    expect(run.stderr).toBe(
      "missing: Unit (unit): SetUnitFacingTimed takes unit whichUnit, real facingAngle, real duration returns nothing\n",
    );
    expect(run.json).toMatchObject({ totals: { missing: 1 } });
    expect(run.markdown).not.toBeNull();
  });

  it("exits 1 on a stale exclusion", async () => {
    const fixture = complete();
    fixture.exclusions = [
      ...(fixture.exclusions as unknown[]),
      {
        native: "GetUnitX",
        reason: "A reason.",
        source: "A source.",
        date: "2026-09-25",
      },
    ];

    const run = await runOn(fixture);

    expect(run.status).toBe(1);
    expect(run.stderr).toBe(
      "stale-exclusion: GetUnitX is excluded, but Unit now calls it: remove the exclusion.\n",
    );
  });

  it("exits 1 on an unknown exclusion", async () => {
    const fixture = complete();
    fixture.exclusions = [
      ...(fixture.exclusions as unknown[]),
      {
        native: "GetUnitColour",
        reason: "A reason.",
        source: "A source.",
        date: "2026-09-25",
      },
    ];

    const run = await runOn(fixture);

    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/^unknown-exclusion: GetUnitColour/);
  });

  it("exits 1 on a Handle subclass the configuration does not list", async () => {
    const sources = standardSources();
    sources["handles/item.ts"] = "export class Item extends Handle<item> {}\n";

    const run = await runOn({ ...complete(), sources });

    expect(run.status).toBe(1);
    expect(run.stderr).toBe(
      "unlisted-wrapper: Item extends Handle but the Wrapper configuration does not list it.\n",
    );
  });

  it("exits 1 and writes nothing when an input is invalid", async () => {
    const run = await runOn({ exclusions: {} });

    expect(run.status).toBe(1);
    expect(run.stderr).toBe(
      "The exclusions file is invalid: expected an array of exclusions.\n",
    );
    expect(run.json).toBeNull();
    expect(run.markdown).toBeNull();
  });

  it("exits 2 on an argument", async () => {
    const run = await runOn({}, ["--check"]);

    expect(run.status).toBe(2);
    expect(run.stderr).toBe("Usage: coverage:report\n");
    expect(run.json).toBeNull();
  });
});
