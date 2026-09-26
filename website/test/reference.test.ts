// The API reference as the site generates it: the docusaurus-plugin-typedoc
// instance the site configures, run on a fixture library through the
// plugin's entry point, with the site's options and TypeDoc plugin. Only
// Docusaurus is left out (the site's scripts tested in Node, #40).
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { LoadContext } from "@docusaurus/types";
import docusaurusPluginTypedoc from "docusaurus-plugin-typedoc";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type Reference, referencePluginOptions } from "../reference";

const FIXTURE = fileURLToPath(new URL("fixtures/library/", import.meta.url));

const FIXTURE_REFERENCE: Reference = {
  id: "fixture-library",
  label: "fixture-library",
  dir: "api/fixture-library",
  entryPoints: [join(FIXTURE, "src/index.ts")],
  tsconfig: join(FIXTURE, "tsconfig.json"),
};

let docsPath: string;
let warnings: string[];

beforeEach(async () => {
  docsPath = await mkdtemp(join(tmpdir(), "reforged-ts-website-reference-"));
  warnings = [];
  vi.spyOn(console, "warn").mockImplementation((message: unknown) => {
    warnings.push(String(message));
  });
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(docsPath, { recursive: true, force: true });
});

/** Generates the fixture's reference the way the site's plugin instance does. */
async function generate(
  strict: boolean,
  reference = FIXTURE_REFERENCE,
): Promise<void> {
  const context = {
    siteDir: docsPath,
    siteConfig: { presets: [] },
  } as unknown as LoadContext;
  await docusaurusPluginTypedoc(
    context,
    referencePluginOptions(reference, { strict, docsPath }),
  );
}

async function page(path: string): Promise<string> {
  return readFile(join(docsPath, FIXTURE_REFERENCE.dir, path), "utf8");
}

describe("the reference", () => {
  it("renders an included example region as a fenced TypeScript block", async () => {
    await generate(false);

    const greet = await page("functions/greet.md");
    expect(greet).toContain(
      '## Example\n\n```ts\nconst greeting = greet("Arthas");\n```',
    );
    expect(greet).not.toContain("includeCode");
  });

  it("renders an included example file whole as a fenced TypeScript block", async () => {
    await generate(false);

    const example = await readFile(
      join(FIXTURE, "examples/welcome.ts"),
      "utf8",
    );
    const code = example.replaceAll("\r\n", "\n").trimEnd();
    expect(await page("functions/welcome.md")).toContain(
      `## Example\n\n\`\`\`ts\n${code}\n\`\`\``,
    );
  });

  it("writes the sidebar docusaurus-plugin-typedoc configures", async () => {
    await generate(false);

    expect(await page("typedoc-sidebar.cjs")).toContain(
      'id:"api/fixture-library/functions/greet"',
    );
  });

  it("knows the custom tags of the TSDoc standard without a tsdoc.json", async () => {
    await generate(false);

    expect(warnings.join("\n")).not.toContain("unknown block tag");
  });

  it("leaves the tags to the project's own tsdoc.json when it has one", async () => {
    const library = join(docsPath, "library");
    await cp(FIXTURE, library, { recursive: true });
    await writeFile(
      join(library, "tsdoc.json"),
      JSON.stringify({ tagDefinitions: [] }),
    );

    await generate(false, {
      ...FIXTURE_REFERENCE,
      entryPoints: [join(library, "src/index.ts")],
      tsconfig: join(library, "tsconfig.json"),
    });

    expect(warnings.join("\n")).toContain("unknown block tag @native");
  });

  it("fails on an error TypeDoc reports", async () => {
    const library = join(docsPath, "library");
    await cp(FIXTURE, library, { recursive: true });
    const index = join(library, "src/index.ts");
    const source = await readFile(index, "utf8");
    await writeFile(index, source.replace("greeting.ts", "missing.ts"));

    await expect(
      generate(false, {
        ...FIXTURE_REFERENCE,
        entryPoints: [index],
        tsconfig: join(library, "tsconfig.json"),
      }),
    ).rejects.toThrow("TypeDoc reported 1 error(s) in the reference");
  });

  it("reports an undocumented member as a warning when not strict", async () => {
    await generate(false);

    expect(warnings.join("\n")).toMatch(
      /undocumentedFarewell \(\w+\).*does not have any documentation/,
    );
    await expect(page("functions/undocumentedFarewell.md")).resolves.toContain(
      "undocumentedFarewell",
    );
  });

  it("fails on an undocumented member when strict, naming it", async () => {
    await expect(generate(true)).rejects.toThrow(
      "TypeDoc's validation failed the reference of fixture-library (strict)",
    );
    expect(warnings.join("\n")).toMatch(
      /undocumentedFarewell \(\w+\).*does not have any documentation/,
    );
  });
});
