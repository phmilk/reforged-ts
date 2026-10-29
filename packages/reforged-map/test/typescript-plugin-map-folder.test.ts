// reforged-map/typescript-plugin (#595): how it finds the map folder, how it
// follows a World Editor save, what it says when the lookup cannot load and
// how it resumes, asked of one real tsserver over several Map projects. The
// discovery's table of cases is shared with the lint rule's tests (#582):
// test/fixtures/map-folder-discovery.json.

import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { discoverMapFolder } from "../src/tsserver/plugin.js";
import {
  fixtureMap,
  makeTempDir,
  mapFolder,
  removeTemporary,
} from "./support/map-folder.js";
import { buildObjectData } from "./support/object-data.js";
import {
  TsServer,
  createPluginProject,
  locate,
  packPlugin,
} from "./support/tsserver.js";

const EDITOR_MAP = fixtureMap("editor-objects.w3m");
const CAPTAIN = 'export const captain = FourCC("h000");\n';
const CAPTAIN_HOVER =
  "**Captain** (`h000`), a Custom unit of this map, derived from Footman (`hfoo`).";

/** A case of the shared discovery table. */
interface DiscoveryCase {
  name: string;
  root: string[];
  maps: string[] | null;
  found: string | null;
  reason?: "none" | "several";
}

const DISCOVERY = (
  JSON.parse(
    fs.readFileSync(fixtureMap("map-folder-discovery.json"), "utf8"),
  ) as { cases: DiscoveryCase[] }
).cases;

/** The time after which the plugin looks again: the lookup's one second, and a margin. */
const AFTER_INTERVAL = 1200;

/** Each test opens a project, whose load tsserver takes seconds for under a full test run. */
// Measured 2.6 s at most with pnpm test on the windows CI leg of #815, 4.7 s on
// Linux (WSL 2, 8 threads), 2026-10.
const OPENS_A_PROJECT = { timeout: 30_000 };

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

let server: TsServer;

// Measured 0.4 s with pnpm test on Linux (WSL 2, 8 threads), 2026-10: the
// windows leg's report carries no hook duration.
beforeAll(() => {
  server = new TsServer(packPlugin());
}, 30_000);

afterAll(() => {
  server.close();
  removeTemporary();
});

/** The plugin's hover text on the `"h000"` of a project's src/rawcodes.ts. */
async function hoverCaptain(
  project: string,
  file = "src/rawcodes.ts",
): Promise<string | undefined> {
  const source = path.join(project, file);
  return (await server.quickinfo(source, locate(source, '"h000"', 1)))
    ?.documentation;
}

/** Opens a project's file, and returns the project. */
async function opened(
  project: string,
  file = "src/rawcodes.ts",
): Promise<string> {
  await server.open(path.join(project, file));
  return project;
}

describe("the discovery of the map folder", () => {
  it.each(DISCOVERY)("$name", ({ root: entries, maps, found, reason }) => {
    const root = makeTempDir();
    const place = (folder: string, entry: string): void => {
      const target = path.join(folder, entry);
      if (entry.endsWith("/")) fs.mkdirSync(target, { recursive: true });
      else fs.writeFileSync(target, "");
    };
    for (const entry of entries) place(root, entry);
    if (maps !== null) {
      fs.mkdirSync(path.join(root, "maps"));
      for (const entry of maps) place(path.join(root, "maps"), entry);
    }
    const result = discoverMapFolder(root);
    if (found !== null) {
      expect(result).toEqual({ mapFolder: path.join(root, found) });
    } else {
      expect(result).toEqual({
        reason: expect.stringMatching(
          reason === "several"
            ? /^2 map folders (at|under) .*: set the mapFolder option/
            : /^no map folder .* at .* or under .*maps: set the mapFolder option/,
        ) as unknown,
      });
    }
  });
});

describe("finding the map folder", OPENS_A_PROJECT, () => {
  it("finds the one map folder at the project root with no option", async () => {
    const project = await opened(
      createPluginProject({
        atRoot: { "my-map.w3m": EDITOR_MAP },
        files: { "src/rawcodes.ts": CAPTAIN },
      }),
    );
    expect(await hoverCaptain(project)).toMatch(CAPTAIN_HOVER);
  });

  it("finds the one map folder under maps/ with no option", async () => {
    const project = await opened(
      createPluginProject({
        maps: { "editor-objects.w3m": EDITOR_MAP },
        files: { "src/rawcodes.ts": CAPTAIN },
      }),
    );
    expect(await hoverCaptain(project)).toMatch(CAPTAIN_HOVER);
  });

  it("reads a map folder named by a relative option against the project root", async () => {
    const project = createPluginProject({
      generateFrom: EDITOR_MAP,
      plugin: { mapFolder: "data/map.w3m" },
      files: { "src/rawcodes.ts": CAPTAIN },
    });
    fs.cpSync(EDITOR_MAP, path.join(project, "data", "map.w3m"), {
      recursive: true,
    });
    await opened(project);
    expect(await hoverCaptain(project)).toMatch(CAPTAIN_HOVER);
  });

  it("reads a map folder named by an absolute option", async () => {
    const elsewhere = path.join(makeTempDir(), "elsewhere.w3m");
    fs.cpSync(EDITOR_MAP, elsewhere, { recursive: true });
    const project = await opened(
      createPluginProject({
        generateFrom: EDITOR_MAP,
        plugin: { mapFolder: elsewhere },
        files: { "src/rawcodes.ts": CAPTAIN },
      }),
    );
    expect(await hoverCaptain(project)).toMatch(CAPTAIN_HOVER);
  });

  it("reads a relative option the same from a tsconfig in a subfolder that extends the entry", async () => {
    const project = createPluginProject({
      generateFrom: EDITOR_MAP,
      plugin: { mapFolder: "data/map.w3m" },
      files: {
        "tests/lua/rawcodes.ts": CAPTAIN,
        "tests/lua/tsconfig.json":
          JSON.stringify({
            extends: "../../tsconfig.base.json",
            include: [".", "../../src/generated"],
          }) + "\n",
      },
    });
    fs.cpSync(EDITOR_MAP, path.join(project, "data", "map.w3m"), {
      recursive: true,
    });
    await opened(project, "tests/lua/rawcodes.ts");
    expect(await hoverCaptain(project, "tests/lua/rawcodes.ts")).toMatch(
      CAPTAIN_HOVER,
    );
  });

  it.each([
    [
      "no map folder",
      {},
      /^Rawcode details are unavailable: no map folder \(a folder whose name ends in \.w3x or \.w3m\) at .* or under .*maps: set the mapFolder option of reforged-map\/typescript-plugin in tsconfig\.json/,
    ],
    [
      "two map folders",
      { "a.w3m": EDITOR_MAP, "b.w3x": EDITOR_MAP },
      /^Rawcode details are unavailable: 2 map folders under .*maps \(a\.w3m, b\.w3x\): set the mapFolder option .* to the one to read\.$/,
    ],
  ])(
    "says in one line that %s under maps/ turns Rawcode details off, and logs it once",
    async (_, maps, expected) => {
      const project = await opened(
        createPluginProject({
          maps,
          generateFrom: EDITOR_MAP,
          files: {
            "src/rawcodes.ts":
              CAPTAIN + 'export const short = FourCC("hfo");\n',
          },
        }),
      );
      const text = await hoverCaptain(project);
      expect(text).toMatch(expected);
      expect(text?.split("\n")).toHaveLength(1);
      await hoverCaptain(project);
      const reason =
        text?.replace("Rawcode details are unavailable: ", "") ?? "";
      expect(server.pluginLog().filter((line) => line === reason)).toHaveLength(
        1,
      );
      const source = path.join(project, "src", "rawcodes.ts");
      const short = await server.quickinfo(source, locate(source, '"hfo"', 1));
      expect(short?.documentation).toBe(
        "`hfo` is not a Rawcode: a Rawcode is exactly four ASCII characters.",
      );
    },
  );
});

describe("following the map folder", OPENS_A_PROJECT, () => {
  it("shows a Custom object saved after the first hover, once the interval has passed", async () => {
    const units = (custom: { custom: string; name: string }[]): Uint8Array =>
      buildObjectData({
        custom: custom.map((object) => ({
          original: "hfoo",
          custom: object.custom,
          modifications: [{ field: "unam", value: object.name }],
        })),
      });
    const map = mapFolder({
      "war3map.w3u": units([{ custom: "h000", name: "Captain" }]),
    });
    const project = await opened(
      createPluginProject({
        maps: { "test.w3m": map },
        files: {
          "src/rawcodes.ts":
            CAPTAIN + 'export const sergeant = FourCC("h002");\n',
        },
      }),
    );
    const source = path.join(project, "src", "rawcodes.ts");
    const sergeant = async (): Promise<string | undefined> =>
      (await server.quickinfo(source, locate(source, '"h002"', 1)))
        ?.documentation;
    expect(await sergeant()).toMatch(/^`h002` is neither/);
    fs.writeFileSync(
      path.join(project, "maps", "test.w3m", "war3map.w3u"),
      units([
        { custom: "h000", name: "Captain" },
        { custom: "h002", name: "Sergeant" },
      ]),
    );
    await wait(AFTER_INTERVAL);
    expect(await sergeant()).toMatch(
      /^\*\*Sergeant\*\* \(`h002`\), a Custom unit of this map/,
    );
  });

  it("says the map folder is gone in one line, logged once, and resumes once it is back", async () => {
    const project = await opened(
      createPluginProject({
        maps: { "editor-objects.w3m": EDITOR_MAP },
        plugin: { mapFolder: "maps/editor-objects.w3m" },
        files: { "src/rawcodes.ts": CAPTAIN },
      }),
    );
    expect(await hoverCaptain(project)).toMatch(CAPTAIN_HOVER);
    const folder = path.join(project, "maps", "editor-objects.w3m");
    fs.renameSync(folder, `${folder}.moved`);
    await wait(AFTER_INTERVAL);
    const gone = await hoverCaptain(project);
    expect(gone).toBe(
      `Rawcode details are unavailable: Map folder not found: ${folder}. Save the map as a folder from the World Editor (File > Save Map As, "Folder").`,
    );
    await hoverCaptain(project);
    await hoverCaptain(project);
    expect(
      server
        .pluginLog()
        .filter((line) => line.startsWith(`Map folder not found: ${folder}.`)),
    ).toHaveLength(1);
    fs.renameSync(`${folder}.moved`, folder);
    await wait(AFTER_INTERVAL);
    expect(await hoverCaptain(project)).toMatch(CAPTAIN_HOVER);
  });
});

describe("without reforged-builtins", OPENS_A_PROJECT, () => {
  it("logs once and leaves every hover to TypeScript", async () => {
    const project = await opened(
      createPluginProject({
        maps: { "editor-objects.w3m": EDITOR_MAP },
        builtins: false,
        files: { "src/rawcodes.ts": CAPTAIN },
      }),
    );
    expect(await hoverCaptain(project)).toBeUndefined();
    expect(
      server
        .pluginLog()
        .filter((line) =>
          line.startsWith(
            `Rawcode details are off: reforged-builtins is not installed in the project root ${project}.`,
          ),
        ),
    ).toHaveLength(1);
  });
});
