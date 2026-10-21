// no-unknown-rawcodes on the fixture project, whose map folder is a copy of
// reforged-map's World Editor-saved one (fixture-project/maps/), through the
// workspace's real reforged-map and reforged-builtins; and through a stub
// lookup (support/stub-rawcode-lookup.cjs) for the unavailable and throwing
// cases.
import { cpSync, mkdirSync, mkdtempSync, rmSync, utimesSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from "vitest";

import { createPlugin } from "../../src/index.js";
import { fixtureFile, fixtureProjectRoot } from "../support/fixture-project.js";
import { lintWithRecommended } from "../support/lint.js";
import { ruleOf } from "../support/plugin.js";
import { createRuleTester } from "../support/rule-tester.js";

const ruleTester = createRuleTester();

const mapFolder = fixtureFile("maps/editor-objects.w3m");

/** The workspace's reforged-map, loaded in place of a project's installation. */
const realLookup = createRequire(import.meta.url).resolve("reforged-map");

const stubLookup = fileURLToPath(
  new URL("../support/stub-rawcode-lookup.cjs", import.meta.url),
);

const temporary: string[] = [];
afterAll(() => {
  for (const each of temporary) {
    rmSync(each, { recursive: true, force: true });
  }
});

function makeTemporary(): string {
  const directory = mkdtempSync(path.join(tmpdir(), "no-unknown-rawcodes-"));
  temporary.push(directory);
  return directory;
}

/** The unknown Rawcode `h00A` and its suggestions, in each literal form. */
const h00ASuggestions = (output: (rawcode: string) => string) => [
  {
    messageId: "replaceRawcode" as const,
    data: { rawcode: "h000", object: "Captain, unit" },
    output: output("h000"),
  },
  {
    messageId: "replaceRawcode" as const,
    data: { rawcode: "h001", object: "Chevalier Élu, unit" },
    output: output("h001"),
  },
];

ruleTester.run("no-unknown-rawcodes", ruleOf("no-unknown-rawcodes"), {
  valid: [
    { name: "a Built-in object", code: 'const u = FourCC("Hpal");' },
    { name: "a Custom object of the map", code: 'const u = FourCC("h000");' },
    {
      name: "a Built-in object the map modifies",
      code: 'const u = FourCC("hfoo");',
    },
    {
      name: "a Rawcode a Custom buff and a Custom destructable share",
      code: 'const b = FourCC("B000");',
    },
    {
      name: "a template literal without substitutions",
      code: "const u = FourCC(`h001`);",
    },
    {
      name: "a cast number of a known Rawcode, decimal and hex",
      code: 'const u = 1751543663 as Rawcode<"unit">;\nconst v = <Rawcode>0x68303030;',
    },
    {
      name: "the usual no-object value",
      code: 'const u = 0 as Rawcode<"unit">;',
    },
    { name: "a number cast to number", code: "const n = 1 as number;" },
    {
      name: "a computed argument",
      code: "declare const name: string;\nconst u = FourCC(name);\nconst i = 1;\nconst v = FourCC(`h00${i}`);",
    },
    {
      name: "a computed value cast to a Rawcode",
      code: 'declare const id: number;\nconst u = id as Rawcode<"unit">;',
    },
    {
      name: "an order name passed as a string",
      code: 'declare const unit: unit;\nIssueImmediateOrder(unit, "stop");\nconst order = "hfo";',
    },
    {
      name: "a local function named FourCC",
      code: 'function FourCC(code: string): number {\n  return code.length;\n}\nconst u = FourCC("hfo");',
    },
    {
      name: "the map folder named by a relative setting",
      code: 'const u = FourCC("h000");',
      settings: { reforged: { mapFolder: "maps/editor-objects.w3m" } },
    },
    {
      name: "the map folder named by an absolute setting",
      code: 'const u = FourCC("h000");',
      settings: { reforged: { mapFolder } },
    },
  ],
  invalid: [
    {
      name: "an unknown Rawcode, with its suggestions",
      code: 'const u = FourCC("h00A");',
      errors: [
        {
          messageId: "unknownRawcode",
          data: { rawcode: "`h00A`", gameVersion: "3.0.1" },
          line: 1,
          column: 18,
          suggestions: h00ASuggestions(
            (rawcode) => `const u = FourCC("${rawcode}");`,
          ),
        },
      ],
    },
    {
      name: "a change of case first among the suggestions",
      code: "const u = FourCC('hpal');",
      errors: [
        {
          messageId: "unknownRawcode",
          suggestions: [
            {
              messageId: "replaceRawcode",
              data: { rawcode: "Hpal", object: "Paladin, unit" },
              output: "const u = FourCC('Hpal');",
            },
            {
              messageId: "replaceRawcode",
              data: { rawcode: "Npal", object: "Forsaken Paladin, unit" },
              output: "const u = FourCC('Npal');",
            },
            {
              messageId: "replaceRawcode",
              data: { rawcode: "hval", object: "Helm of Valor, item" },
              output: "const u = FourCC('hval');",
            },
          ],
        },
      ],
    },
    {
      name: "a suggestion keeps a template literal's backticks",
      code: "const u = FourCC(`h00A`);",
      errors: [
        {
          messageId: "unknownRawcode",
          suggestions: h00ASuggestions(
            (rawcode) => `const u = FourCC(\`${rawcode}\`);`,
          ),
        },
      ],
    },
    {
      name: "a cast number shows its Rawcode, and a suggestion keeps the cast",
      code: 'const u = 1747988545 as Rawcode<"unit">;',
      errors: [
        {
          messageId: "unknownRawcode",
          data: { rawcode: "`1747988545` (`h00A`)", gameVersion: "3.0.1" },
          suggestions: h00ASuggestions(
            (rawcode) =>
              `const u = ${String(rawcode === "h000" ? 1747988528 : 1747988529)} as Rawcode<"unit">;`,
          ),
        },
      ],
    },
    {
      name: "an angle-bracket assertion of a hex number",
      code: "const u = <UnknownRawcode>0x68303041;",
      errors: [
        {
          messageId: "unknownRawcode",
          data: { rawcode: "`0x68303041` (`h00A`)", gameVersion: "3.0.1" },
          suggestions: h00ASuggestions(
            (rawcode) =>
              `const u = <UnknownRawcode>${String(rawcode === "h000" ? 1747988528 : 1747988529)};`,
          ),
        },
      ],
    },
    {
      name: "an unknown Rawcode with no Rawcode one edit away",
      code: 'const u = FourCC("zzzz");',
      errors: [
        {
          messageId: "unknownRawcode",
          data: { rawcode: "`zzzz`", gameVersion: "3.0.1" },
          suggestions: [],
        },
      ],
    },
    {
      name: "a Built-in object outside the map's Game data set",
      code: 'const a = FourCC("Asa2");',
      errors: [
        {
          messageId: "notInGameDataSet",
          data: {
            rawcode: "`Asa2`",
            name: " (Pillage)",
            kind: "ability",
            gameVersion: "3.0.1",
            set: "Melee (Forsaken Kingdom)",
          },
          suggestions: [],
        },
      ],
    },
    {
      name: "malformed literals: three and five characters, a non-ASCII one",
      code: 'const a = FourCC("hfo");\nconst b = FourCC("hfooo");\nconst c = FourCC("hfoé");',
      errors: [
        { messageId: "malformedRawcode", data: { rawcode: "`hfo`" }, line: 1 },
        {
          messageId: "malformedRawcode",
          data: { rawcode: "`hfooo`" },
          line: 2,
        },
        { messageId: "malformedRawcode", data: { rawcode: "`hfoé`" }, line: 3 },
      ],
    },
    {
      name: "a cast number whose bytes are not four ASCII characters",
      code: 'const a = 1 as Rawcode<"unit">;\nconst b = 4294967296 as Rawcode;',
      errors: [
        {
          messageId: "malformedRawcode",
          data: { rawcode: "`1` (bytes 00 00 00 01)" },
        },
        { messageId: "malformedRawcode", data: { rawcode: "`4294967296`" } },
      ],
    },
  ],
});

/** console.warn, spied on for each test of the block. */
function spyOnWarnings() {
  let warn: MockInstance<typeof console.warn> | undefined;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    warn?.mockRestore();
  });
  /** The rule's own warnings so far, without the plugin's load-time ones. */
  return () =>
    (warn?.mock.calls ?? [])
      .map((call) => String(call[0]))
      .filter((line) => line.includes("reforged/no-unknown-rawcodes"));
}

describe("finding the map folder", () => {
  const warnings = spyOnWarnings();

  /** The plugin with `root` as its project root, over the workspace's reforged-map. */
  function pluginAt(root: string) {
    return createPlugin({
      projectRoot: root,
      files: { rawcodeLookup: realLookup },
    });
  }

  const code =
    'const a = FourCC("zzzz");\nconst b = FourCC("zzzz");\nconst c = FourCC("hfo");';

  it("turns the existence check off with one warning when maps/ holds none", () => {
    const root = makeTemporary();
    const messages = lintWithRecommended(code, pluginAt(root));
    expect(messages.map((each) => each.messageId)).toEqual([
      "malformedRawcode",
    ]);
    expect(warnings()).toEqual([
      `eslint-plugin-reforged: reforged/no-unknown-rawcodes checks only that a Rawcode is four characters: no map folder (a folder whose name ends in .w3x or .w3m) under ${path.join(root, "maps")}: set settings.reforged.mapFolder in the ESLint config to the map folder, absolute or relative to ${root}.`,
    ]);
  });

  it("names the map folders when maps/ holds two, and asks for the setting", () => {
    const root = makeTemporary();
    mkdirSync(path.join(root, "maps", "one.w3x"), { recursive: true });
    mkdirSync(path.join(root, "maps", "two.W3M"));
    const messages = lintWithRecommended(code, pluginAt(root));
    expect(messages.map((each) => each.messageId)).toEqual([
      "malformedRawcode",
    ]);
    expect(warnings()).toEqual([
      `eslint-plugin-reforged: reforged/no-unknown-rawcodes checks only that a Rawcode is four characters: 2 map folders under ${path.join(root, "maps")} (one.w3x, two.W3M): set settings.reforged.mapFolder in the ESLint config to the map folder, absolute or relative to ${root}.`,
    ]);
  });

  it("keeps the existence check off without reforged-builtins, with its reason", () => {
    // The setting names a map folder, but the project root has no
    // reforged-builtins for the lookup to read.
    const root = makeTemporary();
    const messages = lintWithRecommended(code, pluginAt(root), {
      reforged: { mapFolder },
    });
    expect(messages.map((each) => each.messageId)).toEqual([
      "malformedRawcode",
    ]);
    expect(warnings()).toHaveLength(1);
    expect(warnings()[0]).toMatch(
      /checks only that a Rawcode is four characters: reforged-builtins .*install it in the Map project/,
    );
  });

  it("warns that a setting that is not a string is ignored, and looks under maps/", () => {
    const messages = lintWithRecommended(code, pluginAt(fixtureProjectRoot), {
      reforged: { mapFolder: 1 },
    });
    expect(messages.map((each) => each.messageId)).toEqual([
      "unknownRawcode",
      "unknownRawcode",
      "malformedRawcode",
    ]);
    expect(warnings()).toEqual([
      "eslint-plugin-reforged: reforged/no-unknown-rawcodes: settings.reforged.mapFolder is not a string, so the map folder is looked for under maps/.",
    ]);
  });

  it("passes on the lookup's warnings once, with the existence check on", () => {
    // Without war3map.w3i, the lookup skips the Game data set check.
    const folder = path.join(makeTemporary(), "map.w3m");
    cpSync(mapFolder, folder, {
      recursive: true,
      filter: (source) => !source.endsWith("war3map.w3i"),
    });
    const settings = { reforged: { mapFolder: folder } };
    const plugin = pluginAt(fixtureProjectRoot);
    const lint = () =>
      lintWithRecommended(
        'const a = FourCC("Asa2");\nconst b = FourCC("zzzz");',
        plugin,
        settings,
      ).map((each) => each.messageId);
    expect(lint()).toEqual(["unknownRawcode"]);
    expect(lint()).toEqual(["unknownRawcode"]);
    expect(warnings()).toHaveLength(1);
    expect(warnings()[0]).toMatch(
      /^eslint-plugin-reforged: reforged\/no-unknown-rawcodes: .*war3map\.w3i/,
    );
  });

  it("warns once when the setting names a missing folder", () => {
    const plugin = pluginAt(fixtureProjectRoot);
    const settings = { reforged: { mapFolder: "maps/missing.w3x" } };
    lintWithRecommended(code, plugin, settings);
    lintWithRecommended(code, plugin, settings);
    expect(warnings()).toHaveLength(1);
    expect(warnings()[0]).toContain(
      `Map folder not found: ${fixtureFile("maps/missing.w3x")}`,
    );
  });
});

describe("a World Editor save between two lint runs", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("knows a Custom object once the lookup's interval has passed", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // The map folder without its units, then with them, as a save writes them.
    const folder = path.join(makeTemporary(), "map.w3m");
    cpSync(mapFolder, folder, {
      recursive: true,
      filter: (source) => !source.endsWith("w3u"),
    });
    const plugin = createPlugin({ projectRoot: fixtureProjectRoot });
    const settings = { reforged: { mapFolder: folder } };
    const lint = () =>
      lintWithRecommended('const u = FourCC("h000");', plugin, settings).map(
        (each) => each.messageId,
      );
    expect(lint()).toEqual(["unknownRawcode"]);
    for (const name of ["war3map.w3u", "war3mapSkin.w3u"]) {
      cpSync(path.join(mapFolder, name), path.join(folder, name));
      utimesSync(path.join(folder, name), new Date(), new Date());
    }
    // Within the interval, the lookup keeps what it read.
    expect(lint()).toEqual(["unknownRawcode"]);
    vi.setSystemTime(Date.now() + 1500);
    expect(lint()).toEqual([]);
  });
});

describe("through a stub lookup", () => {
  const warnings = spyOnWarnings();
  afterEach(() => {
    delete (globalThis as { reforgedStubLookup?: unknown }).reforgedStubLookup;
  });

  const stubbed = (answer: (rawcode: string) => unknown) => {
    (globalThis as { reforgedStubLookup?: unknown }).reforgedStubLookup =
      answer;
    return createPlugin({
      projectRoot: fixtureProjectRoot,
      files: { rawcodeLookup: stubLookup },
    });
  };

  const code = 'const a = FourCC("h00A");\nconst b = FourCC("hfo");';
  const ids = (plugin: ReturnType<typeof createPlugin>) =>
    lintWithRecommended(code, plugin).map((each) => each.messageId);

  it("an unavailable lookup reports no unknown Rawcode, warned once across files, and malformed literals still", () => {
    const reason =
      "The Object definition objects/captain.ts threw while loading: boom.";
    const plugin = stubbed(() => ({ status: "unavailable", reason }));
    expect(ids(plugin)).toEqual(["malformedRawcode"]);
    expect(ids(plugin)).toEqual(["malformedRawcode"]);
    expect(warnings()).toEqual([
      `eslint-plugin-reforged: reforged/no-unknown-rawcodes checks only that a Rawcode is four characters: ${reason}`,
    ]);
  });

  it("a lookup that throws counts as unavailable, and the other rules still run", () => {
    const plugin = stubbed(() => {
      throw new Error("boom");
    });
    const messages = lintWithRecommended(
      `${code}\nTriggerSleepAction(1);`,
      plugin,
    );
    expect(messages.map((each) => each.ruleId)).toEqual([
      "reforged/no-unknown-rawcodes",
      "reforged/no-unsafe-natives",
    ]);
    expect(warnings()).toEqual([
      "eslint-plugin-reforged: reforged/no-unknown-rawcodes checks only that a Rawcode is four characters: the Rawcode lookup failed: boom",
    ]);
  });

  it("resumes in the same process once the lookup answers again", () => {
    let result: unknown = { status: "unavailable", reason: "not yet." };
    const plugin = stubbed((rawcode) =>
      result === undefined
        ? { status: "unknown", rawcode, suggestions: [] }
        : result,
    );
    expect(ids(plugin)).toEqual(["malformedRawcode"]);
    result = undefined;
    expect(ids(plugin)).toEqual(["unknownRawcode", "malformedRawcode"]);
  });
});

describe("with the recommended config", () => {
  it("reports at warn", () => {
    expect(lintWithRecommended('const u = FourCC("h00A");')).toMatchObject([
      {
        ruleId: "reforged/no-unknown-rawcodes",
        severity: 1,
        messageId: "unknownRawcode",
      },
    ]);
  });

  it("honours an eslint-disable-next-line escape with a reason", () => {
    expect(
      lintWithRecommended(
        '// eslint-disable-next-line reforged/no-unknown-rawcodes -- a unit of the campaign\'s war3campaign.w3u\nconst u = FourCC("h00A");',
      ),
    ).toEqual([]);
  });
});
