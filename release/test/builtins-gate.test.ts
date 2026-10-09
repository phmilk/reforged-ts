/**
 * The major-changeset gate on `reforged-builtins` (#514): a major of the
 * package needs its migration page and its rename entries for the pair,
 * their replacements resolved against the constants it emits.
 */
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { builtinsGate } from "../src/builtins-gate.js";
import { main } from "../src/cli/major-changeset-gate.js";
import {
  changesetText,
  PACKAGES,
  writeText,
  writeWorkspace,
} from "./support/workspace.js";

const PAIR = { from: "reforged-builtins@1", to: "reforged-builtins@2" };
const PAGE =
  "website/docs/migration/reforged-builtins-1-to-reforged-builtins-2.md";
const RENAMES = "packages/reforged-builtins/migration/renames.json";
const SCHEMA = new URL(
  "../../packages/reforged-ts/migration/renames.schema.json",
  import.meta.url,
);

interface Fixture {
  /** Pending changesets, by file name. */
  pending?: Record<string, Record<string, string>>;
  pages?: string[];
  /** The package's rename map; no file when undefined. */
  renames?: unknown[];
}

/** The fixture's packages but `reforged-builtins`. */
const OTHERS = PACKAGES.filter(({ name }) => name !== "reforged-builtins");

async function workspace(fixture: Fixture, version = "1.2.0"): Promise<string> {
  const root = await writeWorkspace([
    ...OTHERS,
    {
      dir: "packages/reforged-builtins",
      name: "reforged-builtins",
      fields: { version },
    },
  ]);
  await writeText(
    root,
    "packages/reforged-ts/migration/renames.schema.json",
    await readFile(SCHEMA, "utf8"),
  );
  // An older Game version, whose constants the replacements never resolve against.
  await writeText(
    root,
    "packages/reforged-builtins/3.0.0/units.d.ts",
    'export declare const Units: {\n  readonly Footman_hfoo: Rawcode<"unit">;\n};\n',
  );
  await writeText(
    root,
    "packages/reforged-builtins/3.0.1/units.d.ts",
    'export declare const Units: {\n  readonly Militia_hfoo: Rawcode<"unit">;\n};\n',
  );
  await writeText(
    root,
    "packages/reforged-builtins/3.0.1/abilities.d.ts",
    'export declare const Abilities: {\n  readonly Blizzard_AHbz: Rawcode<"ability">;\n};\n',
  );
  for (const [name, releases] of Object.entries(fixture.pending ?? {})) {
    await writeText(root, `.changeset/${name}`, changesetText(releases));
  }
  for (const page of fixture.pages ?? []) {
    await writeText(root, page, "# Migrating\n");
  }
  if (fixture.renames !== undefined) {
    await writeText(root, RENAMES, JSON.stringify(fixture.renames));
  }
  return root;
}

const MAJOR = { "builtins-major.md": { "reforged-builtins": "major" } };

function entry(old: string, replacement: string | null) {
  return {
    old,
    new: replacement,
    kind: "member",
    versions: PAIR,
    oneToOne: replacement !== null,
    note: "Renamed in Game version 3.0.1.",
  };
}

describe("the major-changeset gate on reforged-builtins", () => {
  it("requires nothing for a minor", async () => {
    const root = await workspace({
      pending: { "minor.md": { "reforged-builtins": "minor" } },
    });

    const result = await builtinsGate(root);

    expect(result.requirement).toBeUndefined();
    expect(result.verdict).toBe("pass");
  });

  it("fails a major without its page or its entries, naming both", async () => {
    const root = await workspace({ pending: MAJOR });

    const result = await builtinsGate(root);

    expect(result.verdict).toBe("fail");
    expect(result.requirement?.pair).toEqual(PAIR);
    expect(result.missing).toEqual([
      { kind: "page", path: PAGE },
      { kind: "renames", file: RENAMES },
    ]);
  });

  it("fails a major with its page alone, naming the entries", async () => {
    const root = await workspace({ pending: MAJOR, pages: [PAGE] });

    expect((await builtinsGate(root)).missing).toEqual([
      { kind: "renames", file: RENAMES },
    ]);
  });

  it("fails a major with its entries alone, naming the page", async () => {
    const root = await workspace({
      pending: MAJOR,
      renames: [entry("Units.Footman_hfoo", "Units.Militia_hfoo")],
    });

    expect((await builtinsGate(root)).missing).toEqual([
      { kind: "page", path: PAGE },
    ]);
  });

  it("names the pair after the major a pending major gives a prerelease", async () => {
    const root = await workspace({ pending: MAJOR }, "2.0.0-alpha.0");

    expect((await builtinsGate(root)).requirement?.pair).toEqual(PAIR);
  });

  it("requires nothing of the major that releases the package first, below 1.0.0", async () => {
    const root = await workspace({ pending: MAJOR }, "0.0.0");

    const result = await builtinsGate(root);

    expect(result.requirement).toBeUndefined();
    expect(result.verdict).toBe("pass");
  });

  it("passes a major with its page and entries whose replacements its newest constants declare", async () => {
    const root = await workspace({
      pending: MAJOR,
      pages: [PAGE],
      renames: [
        entry("Units.Footman_hfoo", "Units.Militia_hfoo"),
        entry("Units.Knight_hkni", null),
      ],
    });

    const result = await builtinsGate(root);

    expect(result.missing).toEqual([]);
    expect(result.verdict).toBe("pass");
  });

  it("fails a major whose replacement its newest constants do not declare", async () => {
    const root = await workspace({
      pending: MAJOR,
      pages: [PAGE],
      renames: [
        entry("Units.Footman_hfoo", "Units.Militia_hfoo"),
        // Declared by an older Game version only.
        entry("Units.Peasant_hpea", "Units.Footman_hfoo"),
      ],
    });

    const result = await builtinsGate(root);

    expect(result.verdict).toBe("fail");
    expect(result.missing).toEqual([
      {
        kind: "replacements",
        file: RENAMES,
        symbols: ["Units.Footman_hfoo"],
      },
    ]);
  });

  it("passes a major whose pair has the no-renames marker", async () => {
    const root = await workspace({
      pending: MAJOR,
      pages: [PAGE],
      renames: [
        { kind: "noRenames", versions: PAIR, note: "Renames nothing." },
      ],
    });

    expect((await builtinsGate(root)).verdict).toBe("pass");
  });

  it("requires nothing of a workspace without the package", async () => {
    const root = await writeWorkspace(OTHERS);
    await writeText(
      root,
      ".changeset/x.md",
      changesetText(MAJOR["builtins-major.md"]),
    );

    expect((await builtinsGate(root)).requirement).toBeUndefined();
  });
});

describe("release:gate with reforged-builtins", () => {
  it("fails on a major of reforged-builtins missing its page, the library's gate passing", async () => {
    const root = await workspace({ pending: MAJOR });
    let stderr = "";

    const status = await main(
      [],
      { stdout: () => undefined, stderr: (text) => (stderr += text) },
      { root, env: {} },
    );

    expect(status).toBe(1);
    expect(stderr).toContain(
      "A major of reforged-builtins is pending (`.changeset/builtins-major.md`): version pair reforged-builtins@1 to reforged-builtins@2.\n",
    );
    expect(stderr).toContain(
      `- [ ] Missing migration page for reforged-builtins@1 to reforged-builtins@2: \`${PAGE}\`.\n`,
    );
  });
});
