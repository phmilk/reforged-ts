import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generate } from "../src/index.js";
import {
  entry,
  globalEntry,
  provenance,
  typeEntry,
  writeOverlay,
  writePatch,
  type AnyEntryFixture,
  type PatchFiles,
} from "./support/fixture.js";

/** The provenance of a fixture Patch of Build `patch`. */
const provenanceOf = (patch: string) => ({
  ...provenance,
  patch,
  tag: `Reforged-v${patch}-w3-fixture`,
});

/** Vendors each Patch in its Build folder and runs Seam 1 over all of them. */
async function generateVendored(
  patches: Record<string, PatchFiles>,
  overlay: AnyEntryFixture[]
) {
  const root = await mkdtemp(join(tmpdir(), "reforged-types-patches-"));
  const vendorDir = join(root, "vendor");
  const overlayDir = join(root, "overlay");
  const patchDirs: string[] = [];
  for (const [patch, files] of Object.entries(patches)) {
    patchDirs.push(await writePatch(vendorDir, files, provenanceOf(patch)));
  }
  await writeOverlay(overlayDir, overlay);
  return generate({ patchDirs, overlayDir });
}

const OLDER = {
  "common.j": [
    "type unit extends handle",
    "globals",
    "    constant integer UNIT_A = 1",
    "endglobals",
    "native KillUnit takes unit whichUnit returns nothing",
    "native RequestExtraBooleanData takes integer dataType returns boolean",
  ].join("\n"),
};

const NEWER = {
  "common.j": [
    "type unit extends handle",
    "type equipmentType extends handle",
    "globals",
    "    constant integer UNIT_A = 1",
    "    constant integer EQUIPMENT_A = 2",
    "endglobals",
    "native KillUnit takes unit whichUnit returns nothing",
    "native GetEquippedItem takes unit whichUnit returns equipmentType",
  ].join("\n"),
  "blizzard.j":
    "function EquipBJ takes unit whichUnit returns nothing\nendfunction\n",
};

/** Entries for every function and global of both Patches. */
const OVERLAY = [
  globalEntry("common.j", "UNIT_A"),
  globalEntry("common.j", "EQUIPMENT_A", false, { since: "3.1.0.25000" }),
  entry("common.j", "KillUnit", ["whichUnit"]),
  entry("common.j", "RequestExtraBooleanData", ["dataType"]),
  {
    ...entry("common.j", "GetEquippedItem", ["whichUnit"], true),
    since: "3.1.0.25000",
  },
  entry("blizzard.j", "EquipBJ", ["whichUnit"]),
];

describe("generate: two vendored Patches", () => {
  it("reports the declarations only the newer Patch has, with source, line and Jass text", async () => {
    // Given in newest-first order: Seam 1 orders Patches by Build.
    const result = await generateVendored(
      { "3.1.0.25000": NEWER, "3.0.0.24268": OLDER },
      OVERLAY
    );

    expect(result.additions).toEqual([
      {
        patch: "3.1.0.25000",
        previous: "3.0.0.24268",
        declarations: [
          {
            source: "common.j",
            line: 2,
            name: "equipmentType",
            jass: "type equipmentType extends handle",
          },
          {
            source: "common.j",
            line: 5,
            name: "EQUIPMENT_A",
            jass: "global constant integer EQUIPMENT_A = 2",
          },
          {
            source: "common.j",
            line: 8,
            name: "GetEquippedItem",
            jass: "native GetEquippedItem takes unit whichUnit returns equipmentType",
          },
          {
            source: "blizzard.j",
            line: 1,
            name: "EquipBJ",
            jass: "function EquipBJ takes unit whichUnit returns nothing",
          },
        ],
      },
    ]);
  });

  it("orders Builds numerically, not as text", async () => {
    const result = await generateVendored(
      { "3.0.0.9999": OLDER, "3.0.0.24268": NEWER },
      OVERLAY
    );

    expect(result.additions.map((a) => [a.previous, a.patch])).toEqual([
      ["3.0.0.9999", "3.0.0.24268"],
    ]);
  });

  it("reports no additions with a single Patch", async () => {
    const result = await generateVendored({ "3.0.0.24268": OLDER }, OVERLAY);

    expect(result.additions).toEqual([]);
  });

  it("reports additions even when generation fails on missing entries", async () => {
    const result = await generateVendored(
      { "3.0.0.24268": OLDER, "3.1.0.25000": NEWER },
      OVERLAY.filter((e) => e.name !== "GetEquippedItem")
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((d) => d.kind)).toEqual(["missing-entry"]);
    expect(result.additions[0]?.declarations.map((d) => d.name)).toContain(
      "GetEquippedItem"
    );
  });

  it("does not report an entry as an orphan when an older vendored Patch declares it", async () => {
    const result = await generateVendored(
      { "3.0.0.24268": OLDER, "3.1.0.25000": NEWER },
      OVERLAY
    );

    expect(result).toMatchObject({ ok: true, diagnostics: [] });
  });

  it("reports an entry that no vendored Patch declares as an orphan naming every Patch", async () => {
    const result = await generateVendored(
      { "3.0.0.24268": OLDER, "3.1.0.25000": NEWER },
      [...OVERLAY, entry("common.j", "Gone"), typeEntry("common.j", "gone")]
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics.map((d) => d.message)).toEqual([
      "common.j/functions/Gone.json: orphan Overlay entry, common.j of Patches 3.0.0.24268 and 3.1.0.25000 declares no Gone",
      "common.j/types/gone.json: orphan Overlay entry, common.j of Patches 3.0.0.24268 and 3.1.0.25000 declares no gone",
    ]);
  });

  it("generates one folder and one entry per Game version, and one async-natives.json for all", async () => {
    const result = await generateVendored(
      { "3.0.0.24268": OLDER, "3.1.0.25000": NEWER },
      OVERLAY.map((e) =>
        e.name === "KillUnit" || e.name === "RequestExtraBooleanData"
          ? { ...e, async: true }
          : e
      )
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.patches).toEqual(["3.0.0.24268", "3.1.0.25000"]);
    expect(result.patch).toBe("3.1.0.25000");
    expect([...result.files.keys()]).toEqual([
      "3.0.0/common.j.d.ts",
      "3.0.0/blizzard.j.d.ts",
      "3.0.0/common.ai.d.ts",
      "3.0.0/manifest.json",
      "3.0.0.d.ts",
      "3.1.0/common.j.d.ts",
      "3.1.0/blizzard.j.d.ts",
      "3.1.0/common.ai.d.ts",
      "3.1.0/manifest.json",
      "3.1.0.d.ts",
      "async-natives.json",
    ]);
    expect(result.files.get("3.0.0/common.j.d.ts")).toContain(
      "declare function RequestExtraBooleanData("
    );
    expect(result.files.get("3.1.0/common.j.d.ts")).not.toContain(
      "RequestExtraBooleanData"
    );
    expect(result.files.get("3.1.0.d.ts")).toContain(
      '/// <reference path="./3.1.0/common.j.d.ts" />'
    );
    expect(result.files.get("async-natives.json")).toBe(
      '[\n  "KillUnit",\n  "RequestExtraBooleanData"\n]\n'
    );
  });

  it("generates a Game version from its newest vendored Build and only compares against the older one", async () => {
    const result = await generateVendored(
      { "3.0.0.24268": OLDER, "3.0.0.24277": NEWER },
      // The older Build's own declarations need no entry.
      OVERLAY.filter((e) => e.name !== "RequestExtraBooleanData")
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.patches).toEqual(["3.0.0.24277"]);
    expect([...result.files.keys()]).toEqual([
      "3.0.0/common.j.d.ts",
      "3.0.0/blizzard.j.d.ts",
      "3.0.0/common.ai.d.ts",
      "3.0.0/manifest.json",
      "3.0.0.d.ts",
      "async-natives.json",
    ]);
    expect(result.files.get("3.0.0.d.ts")).toContain("Patch 3.0.0.24277");
    expect(result.additions[0]?.patch).toBe("3.0.0.24277");
  });

  it("reports a missing entry once when two generated Patches lack it", async () => {
    const result = await generateVendored(
      { "3.0.0.24268": OLDER, "3.1.0.25000": NEWER },
      OVERLAY.filter((e) => e.name !== "KillUnit")
    );

    expect(result.diagnostics.map((d) => d.message)).toEqual([
      "common.j: no Overlay entry for native KillUnit takes unit whichUnit returns nothing; expected common.j/functions/KillUnit.json",
    ]);
  });

  it("names the Patch folder in a Patch file's problem", async () => {
    const result = await generateVendored(
      {
        "3.0.0.24268": OLDER,
        "3.1.0.25000": { ...NEWER, "common.ai": "bogus\n" },
      },
      OVERLAY
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        kind: "parse",
        message: "3.1.0.25000/common.ai:1: unknown line: bogus",
      })
    );
  });

  it("fails when no Patch is vendored", async () => {
    const overlayDir = await mkdtemp(join(tmpdir(), "reforged-types-empty-"));

    const result = await generate({ patchDirs: [], overlayDir });

    expect(result).toEqual({
      ok: false,
      additions: [],
      diagnostics: [
        {
          severity: "error",
          kind: "patch-invalid",
          message: "no vendored Patch: vendor a jass-history tag first",
        },
      ],
    });
  });
});
