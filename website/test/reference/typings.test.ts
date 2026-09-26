// The Typings' reference as the site generates it: a docusaurus-plugin-typedoc
// instance per Game version, run on a fixture Game version through the
// plugin's entry point, with the site's options and TypeDoc plugin. Only
// Docusaurus is left out (the site's scripts tested in Node, #40).
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PluginOptions as DocsPluginOptions } from "@docusaurus/plugin-content-docs";
import type { LoadContext } from "@docusaurus/types";
import docusaurusPluginTypedoc from "docusaurus-plugin-typedoc";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type Reference,
  referencePluginOptions,
  referenceSidebars,
  typingsReferences,
} from "../../reference";
import { entryPage, readTypingsManifest } from "../../typedoc/typings.mts";

const FIXTURE = fileURLToPath(new URL("fixtures/typings/", import.meta.url));

let temp: string;
let warnings: string[];

beforeEach(async () => {
  temp = await mkdtemp(join(tmpdir(), "reforged-ts-website-typings-"));
  warnings = [];
  vi.spyOn(console, "warn").mockImplementation((message: unknown) => {
    warnings.push(String(message));
  });
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(temp, { recursive: true, force: true });
});

function only<T>(items: readonly T[]): T {
  expect(items).toHaveLength(1);
  return items[0];
}

/**
 * Generates the reference of the one Game version `typings` holds the way
 * the site's plugin instance does, into a docs tree in `temp`.
 */
async function generate(typings = FIXTURE): Promise<Reference> {
  const reference = only(typingsReferences(typings, join(temp, "tsconfigs")));
  const docsPath = join(temp, "docs");
  const context = {
    siteDir: docsPath,
    siteConfig: { presets: [] },
  } as unknown as LoadContext;
  await docusaurusPluginTypedoc(
    context,
    referencePluginOptions(reference, { strict: true, docsPath }),
  );
  return reference;
}

async function page(reference: Reference, path: string): Promise<string> {
  return readFile(join(temp, "docs", reference.dir, path), "utf8");
}

describe("the Typings references", () => {
  it("are one per Game version with a manifest, oldest first", async () => {
    for (const gameVersion of ["3.0.10", "3.0.2", "2.1.0"]) {
      await mkdir(join(temp, gameVersion));
      await writeFile(join(temp, gameVersion, "manifest.json"), "{}");
      await writeFile(join(temp, gameVersion, "common.j.d.ts"), "");
    }
    await mkdir(join(temp, "3.0.3"));
    await mkdir(join(temp, "vendor", "3.0.0.24268"), { recursive: true });

    const references = typingsReferences(temp, join(temp, "tsconfigs"));

    expect(references.map((reference) => reference.label)).toEqual([
      "2.1.0",
      "3.0.2",
      "3.0.10",
    ]);
    expect(references[1]).toMatchObject({
      id: "typings-3.0.2",
      dir: "api/typings/3.0.2",
      entryPoints: [join(temp, "3.0.2", "common.j.d.ts")],
      typingsManifest: join(temp, "3.0.2", "manifest.json"),
    });
  });

  it("compile each Game version's Jass files alone", async () => {
    const reference = only(typingsReferences(FIXTURE, temp));

    const tsconfig = JSON.parse(await readFile(reference.tsconfig, "utf8")) as {
      files: string[];
    };
    expect(tsconfig.files).toEqual([
      join(FIXTURE, "9.9.9", "blizzard.j.d.ts"),
      join(FIXTURE, "9.9.9", "common.ai.d.ts"),
      join(FIXTURE, "9.9.9", "common.j.d.ts"),
    ]);
  });
});

describe("the Typings reference", () => {
  it("gives every entry of the manifest its page at the route of its name and kind", async () => {
    const reference = await generate();

    const manifest = readTypingsManifest(join(FIXTURE, "9.9.9/manifest.json"));
    for (const { name, kind } of manifest.entries) {
      const shown = name.replaceAll("_", "\\_");
      const heading =
        kind === "global" ? `# Variable: ${shown}` : `# Function: ${shown}()`;
      const text = await page(reference, `${entryPage({ name, kind })}.md`);
      expect(text.split("\n")).toContain(heading);
    }
  });

  it("routes a Native and a global whose names differ in case alone apart", () => {
    expect(entryPage({ name: "Sleep", kind: "native" })).toBe(
      "functions/Sleep",
    );
    expect(entryPage({ name: "SLEEP", kind: "global" })).toBe(
      "variables/SLEEP",
    );
    expect(entryPage({ name: "PolledWait", kind: "function" })).toBe(
      "functions/PolledWait",
    );
  });

  it("shows a Native's signature, its Jass types and its async marker", async () => {
    const reference = await generate();

    const native = await page(reference, "functions/GetUnitName.md");
    expect(native).toContain(
      "> **GetUnitName**(`whichUnit`): `string` \\| `undefined`",
    );
    expect(native).toContain("[`unit`](../interfaces/unit.md)\n\nunit");
    expect(native).toContain("**`Async`**");
    expect(await page(reference, "functions/KillUnit.md")).not.toContain(
      "Async",
    );
    expect(await page(reference, "variables/bj_MAX_PLAYERS.md")).toContain(
      "Jass: constant integer",
    );
  });

  it("leaves typescript-to-lua's annotations off the pages", async () => {
    const reference = await generate();

    expect(await page(reference, "interfaces/handle.md")).not.toContain("Self");
    expect(warnings.join("\n")).not.toContain("unknown");
  });

  it("fails naming an entry of the manifest that has no page", async () => {
    const typings = join(temp, "typings");
    await cp(FIXTURE, typings, { recursive: true });
    const manifestFile = join(typings, "9.9.9/manifest.json");
    const manifest = JSON.parse(await readFile(manifestFile, "utf8")) as {
      entries: unknown[];
    };
    manifest.entries.push({ name: "RemovedNative", kind: "native" });
    await writeFile(manifestFile, JSON.stringify(manifest));

    await expect(generate(typings)).rejects.toThrow(
      "no page for 1 of its entries, where the route of an entry says:\n- native RemovedNative: functions/RemovedNative.md",
    );
  });

  it("rejects a manifest entry of an unknown kind", async () => {
    const file = join(temp, "manifest.json");
    await writeFile(
      file,
      JSON.stringify({
        patch: "9.9.9.99999",
        entries: [{ name: "handle", kind: "type" }],
      }),
    );

    expect(() => readTypingsManifest(file)).toThrow(
      'entry 0 ("handle") needs a name and a kind among native, function, global, got "type".',
    );
  });
});

type SidebarItemsGenerator = NonNullable<
  DocsPluginOptions["sidebarItemsGenerator"]
>;
type SidebarArgs = Parameters<SidebarItemsGenerator>[0];

describe("the sidebar", () => {
  it("lists a Typings reference as its index page, after the library", async () => {
    const library: Reference = {
      id: "library",
      label: "library",
      dir: "api/library",
      entryPoints: [],
      tsconfig: "",
    };
    const typings = only(typingsReferences(FIXTURE, temp));
    await mkdir(join(temp, typings.dir), { recursive: true });
    await writeFile(join(temp, typings.dir, "index.md"), "# 9.9.9");
    await mkdir(join(temp, library.dir), { recursive: true });
    await writeFile(
      join(temp, library.dir, "typedoc-sidebar.cjs"),
      'module.exports = [{ type: "doc", id: "api/library/functions/greet" }];',
    );
    const typingsSection = {
      type: "category" as const,
      label: "Typings",
      link: { type: "doc" as const, id: "api/typings/index" },
      items: [],
    };
    const generator = referenceSidebars([library, typings]);

    const items = await generator({
      version: { contentPath: temp },
      docs: [],
      defaultSidebarItemsGenerator: () =>
        Promise.resolve([
          {
            type: "category",
            label: "API",
            link: { type: "doc", id: "api/index" },
            items: [typingsSection],
          },
        ]),
    } as unknown as SidebarArgs);

    expect(items).toEqual([
      {
        type: "category",
        label: "API",
        link: { type: "doc", id: "api/index" },
        items: [
          {
            type: "category",
            label: "library",
            link: { type: "doc", id: "api/library/index" },
            items: [{ type: "doc", id: "api/library/functions/greet" }],
          },
          {
            ...typingsSection,
            items: [
              { type: "doc", id: "api/typings/9.9.9/index", label: "9.9.9" },
            ],
          },
        ],
      },
    ]);
  });
});
