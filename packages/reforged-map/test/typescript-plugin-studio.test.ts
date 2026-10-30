// reforged-map/typescript-plugin (#833): the hover's "Open in the Studio"
// link, from the Studio's runtime file `.reforged-studio.json` at the Map
// project's root, asked of one real tsserver over a Map project per state
// of that file: a live Studio on the project's map folder, a Studio whose
// process has ended, a Studio on another map folder, and no file. Each
// hovers a literal, a generated constant and the shared `B000`.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fixtureMap, removeTemporary } from "./support/map-folder.js";
import {
  TsServer,
  createPluginProject,
  locate,
  packPlugin,
} from "./support/tsserver.js";

const SOURCE = [
  'import { CustomUnits } from "./generated/custom-units";',
  'import { CustomBuffs } from "./generated/custom-buffs";',
  'import { Units } from "reforged-builtins/units";',
  'export const captain = FourCC("h000");',
  'export const shared = FourCC("B000");',
  'export const typo = FourCC("h00A");',
  "export const captainConstant = CustomUnits.Captain_h000;",
  "export const holyFire = CustomBuffs.HolyFire_B000;",
  "export const footman = Units.Footman_hfoo;",
  "",
].join("\n");

const CAPTAIN = [
  "**Captain** (`h000`), a Custom unit of this map, derived from Footman (`hfoo`).",
  "Race: human.",
  "Its constant is `CustomUnits.Captain_h000`, from the generated `custom-units.ts`.",
].join("\n\n");

const SHARED = [
  "`B000` names a Custom buff and a Custom destructable, so `FourCC` gives no single kind.",
  "**Holy Fire** (`B000`), a Custom buff of this map, derived from Inner Fire (`Binf`).",
  "Race: human.",
  "Its constant is `CustomBuffs.HolyFire_B000`, from the generated `custom-buffs.ts`.",
  "**Gate** (`B000`), a Custom destructable of this map, derived from Summer Tree Wall (`LTlt`).",
  "Its constant is `CustomDestructables.Gate_B000`, from the generated `custom-destructables.ts`.",
].join("\n\n");

const URL = "http://localhost:5999";
const NOT_RUNNING = "`pnpm studio` opens this object.";
const link = (target: string): string =>
  `[Open in the Studio](${URL}/objects/${target})`;

/** The time after which the plugin reads the file again: one second, and a margin. */
const AFTER_INTERVAL = 1200;

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** The pid of a process that has ended. */
function deadPid(): number {
  return spawnSync(process.execPath, ["-e", ""]).pid;
}

/** A Map project whose map folder is `maps/editor-objects.w3m`. */
function project(): { root: string; mapFolder: string; source: string } {
  const root = createPluginProject({
    maps: { "editor-objects.w3m": fixtureMap("editor-objects.w3m") },
    files: { "src/rawcodes.ts": SOURCE },
  });
  return {
    root,
    mapFolder: path.join(root, "maps", "editor-objects.w3m"),
    source: path.join(root, "src", "rawcodes.ts"),
  };
}

/** Writes a Map project's runtime file, as a Studio at {@link URL} writes it. */
function writeRuntimeFile(
  root: string,
  record: { pid: number; mapFolder: string },
): void {
  fs.writeFileSync(
    path.join(root, ".reforged-studio.json"),
    JSON.stringify({
      format: 1,
      url: URL,
      startedAt: new Date().toISOString(),
      ...record,
    }),
  );
}

let server: TsServer;
let live: ReturnType<typeof project>;
let dead: ReturnType<typeof project>;
let elsewhere: ReturnType<typeof project>;
let none: ReturnType<typeof project>;

// Measured 3.1 s, the whole file, four projects opened, with
// `pnpm exec vitest run` on this file on Linux (WSL 2, 8 threads), 2026-10.
beforeAll(async () => {
  live = project();
  writeRuntimeFile(live.root, { pid: process.pid, mapFolder: live.mapFolder });
  dead = project();
  writeRuntimeFile(dead.root, { pid: deadPid(), mapFolder: dead.mapFolder });
  elsewhere = project();
  writeRuntimeFile(elsewhere.root, {
    pid: process.pid,
    mapFolder: path.join(elsewhere.root, "maps", "other.w3m"),
  });
  none = project();
  server = new TsServer(packPlugin());
  for (const { source } of [live, dead, elsewhere, none]) {
    await server.open(source);
  }
}, 30_000);

afterAll(() => {
  server.close();
  removeTemporary();
});

/** The hover text on `needle` of a project's source, hovered on its second character. */
async function hover(
  { source }: { source: string },
  needle: string,
): Promise<string> {
  return (
    (await server.quickinfo(source, locate(source, needle, 1)))
      ?.documentation ?? ""
  );
}

describe("the hover's Studio link with a live Studio on the map folder", () => {
  it("links a literal to its object, with its kind", async () => {
    expect(await hover(live, '"h000"')).toBe(
      `${CAPTAIN}\n\n${link("h000?kind=unit")}`,
    );
  });

  it("links a Rawcode two kinds share without a kind", async () => {
    expect(await hover(live, '"B000"')).toBe(`${SHARED}\n\n${link("B000")}`);
  });

  it("links a generated constant to its object, with its kind, after its own TSDoc", async () => {
    const text = await hover(live, "Captain_h000;");
    expect(text).toMatch(/^Captain \(`h000`\), a Custom unit of this map/);
    expect(text.endsWith(`\n\n${link("h000?kind=unit")}`)).toBe(true);
  });

  it("links the constant of a Rawcode two kinds share with its kind", async () => {
    expect(await hover(live, "HolyFire_B000;")).toMatch(
      new RegExp(`\\n\\n${escape(link("B000?kind=buff"))}$`),
    );
  });

  it("links a constant of reforged-builtins to its object", async () => {
    expect(await hover(live, "Footman_hfoo;")).toMatch(
      new RegExp(`\\n\\n${escape(link("hfoo?kind=unit"))}$`),
    );
  });

  it("adds nothing to an unknown Rawcode", async () => {
    expect(await hover(live, '"h00A"')).not.toMatch(/Studio|pnpm studio/);
  });
});

describe.each([
  ["whose process has ended", () => dead],
  ["on another map folder", () => elsewhere],
  ["with no runtime file", () => none],
])("the hover with a Studio %s", (_, which) => {
  it("says that pnpm studio opens a literal's object", async () => {
    expect(await hover(which(), '"h000"')).toBe(`${CAPTAIN}\n\n${NOT_RUNNING}`);
  });

  it("says that pnpm studio opens a Rawcode two kinds share", async () => {
    expect(await hover(which(), '"B000"')).toBe(`${SHARED}\n\n${NOT_RUNNING}`);
  });

  it("says that pnpm studio opens a generated constant's object", async () => {
    const text = await hover(which(), "Captain_h000;");
    expect(text).toMatch(/^Captain \(`h000`\), a Custom unit of this map/);
    expect(text.endsWith(`\n\n${NOT_RUNNING}`)).toBe(true);
    expect(text).not.toMatch(/Open in the Studio/);
  });
});

describe("reading the runtime file again", () => {
  it("follows a Studio that starts, after the plugin's interval", async () => {
    expect(await hover(none, '"h000"')).toMatch(/pnpm studio/);
    writeRuntimeFile(none.root, {
      pid: process.pid,
      mapFolder: none.mapFolder,
    });
    await wait(AFTER_INTERVAL);
    expect(await hover(none, '"h000"')).toBe(
      `${CAPTAIN}\n\n${link("h000?kind=unit")}`,
    );
  });
});

/** A text as a regular expression that matches it literally. */
function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
