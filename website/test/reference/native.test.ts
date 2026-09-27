// The `@native` tags of the library's reference as the site generates it: a
// fixture Wrapper's reference, run through docusaurus-plugin-typedoc's entry
// point with the site's options and TypeDoc plugin, its tags linked to the
// Typings reference of a fixture Game version. Only Docusaurus is left out
// (the site's scripts tested in Node, #40).
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { LoadContext } from "@docusaurus/types";
import docusaurusPluginTypedoc from "docusaurus-plugin-typedoc";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type Reference,
  referencePluginOptions,
  typingsReferences,
} from "../../reference";

const FIXTURES = fileURLToPath(new URL("fixtures/", import.meta.url));

let temp: string;

beforeEach(async () => {
  temp = await mkdtemp(join(tmpdir(), "reforged-ts-website-native-"));
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(temp, { recursive: true, force: true });
});

/** The fixture Wrapper's reference, its tags linked to the fixture Typings. */
function wrapperReference(wrapper = join(FIXTURES, "wrapper")): Reference {
  const [typings] = typingsReferences(
    join(FIXTURES, "typings"),
    join(temp, "tsconfigs"),
  );
  return {
    id: "fixture-wrapper",
    label: "fixture-wrapper",
    dir: "api/fixture-wrapper",
    entryPoints: [join(wrapper, "src/index.ts")],
    tsconfig: join(wrapper, "tsconfig.json"),
    nativeTypings: typings,
  };
}

/** Generates a reference the way the site's plugin instance does. */
async function generate(reference: Reference): Promise<void> {
  const docsPath = join(temp, "docs");
  const context = {
    siteDir: docsPath,
    siteConfig: { presets: [] },
  } as unknown as LoadContext;
  await docusaurusPluginTypedoc(
    context,
    referencePluginOptions(reference, { strict: false, docsPath }),
  );
}

async function page(path: string): Promise<string> {
  return readFile(join(temp, "docs/api/fixture-wrapper", path), "utf8");
}

describe("an @native tag", () => {
  it("links the Native's page in the Typings reference, then jassbot", async () => {
    await generate(wrapperReference());

    const unit = await page("classes/Unit.md");
    for (const native of ["GetUnitName", "KillUnit"]) {
      expect(unit).toContain(
        `[${native}](/typings/9.9.9/functions/${native}) ([jassbot](https://lep.duckdns.org/jassbot/doc/${native}))`,
      );
    }
  });

  it("links a Blizzard.j function and a global where the Typings route them", async () => {
    await generate(wrapperReference());

    expect(await page("classes/Unit.md")).toContain(
      "[PolledWait](/typings/9.9.9/functions/PolledWait) ([jassbot](https://lep.duckdns.org/jassbot/doc/PolledWait))",
    );
    expect(await page("variables/maxPlayers.md")).toContain(
      "[bj_MAX_PLAYERS](/typings/9.9.9/variables/bj_MAX_PLAYERS) ([jassbot](https://lep.duckdns.org/jassbot/doc/bj_MAX_PLAYERS))",
    );
  });

  it("fails naming the symbol and the tag when the Typings do not declare the Native", async () => {
    const wrapper = join(temp, "wrapper");
    await cp(join(FIXTURES, "wrapper"), wrapper, { recursive: true });
    const index = join(wrapper, "src/index.ts");
    const source = await readFile(index, "utf8");
    await writeFile(
      index,
      source
        .replace("@native KillUnit", "@native KillUnitNow")
        .replace("@native bj_MAX_PLAYERS", "@native bj_MAX_PLAYER"),
    );

    await expect(generate(wrapperReference(wrapper))).rejects.toThrow(
      /has 2 @native tags naming what the Typings of Patch 9\.9\.9\.99999 do not declare[^]*:\n- Unit\.kill: @native KillUnitNow\n- maxPlayers: @native bj_MAX_PLAYER$/,
    );
  });

  it("is left as written in a reference that links no Typings", async () => {
    await generate({ ...wrapperReference(), nativeTypings: undefined });

    const unit = await page("classes/Unit.md");
    expect(unit).toContain("GetUnitName");
    expect(unit).not.toContain("jassbot");
  });
});
