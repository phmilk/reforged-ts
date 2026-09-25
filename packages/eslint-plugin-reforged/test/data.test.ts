// The data files: their shape is checked at plugin load, and every Native
// they name resolves in the installed Typings.
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as ts from "typescript";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

import creationNatives from "../data/creation-natives.json" with { type: "json" };
import localSafe from "../data/local-safe.json" with { type: "json" };
import banList from "../data/unsafe-natives.json" with { type: "json" };
import {
  isRegistrationType,
  returnedHandleType,
} from "../src/classify/handle.js";
import { packageNameOf } from "../src/classify/package.js";
import { parseAsyncNatives } from "../src/data/async-natives.js";
import { findPackageDirectory } from "../src/data/optional.js";
import { createPlugin, DataFileError } from "../src/index.js";
import { fixtureProjectRoot } from "./support/fixture-project.js";
import { lintWithRecommended } from "./support/lint.js";
import { libraryMembers } from "./support/library.js";
import { fixtureProgram, installedNatives } from "./support/typings.js";

const scratch = mkdtempSync(path.join(tmpdir(), "eslint-plugin-reforged-"));
afterAll(() => {
  rmSync(scratch, { recursive: true, force: true });
});

function dataFile(name: string, content: string): string {
  const file = path.join(scratch, name);
  writeFileSync(file, content);
  return file;
}

describe("the ban list (data/unsafe-natives.json)", () => {
  const entry = { name: "PolledWait", reason: "r.", replacement: "p." };

  it.each([
    ["not an array", "{}", "the root must be an array"],
    ["an entry not an object", "[1]", "[0] must be an object"],
    [
      "a missing replacement",
      JSON.stringify([entry, { name: "TriggerSleepAction", reason: "r." }]),
      "[1].replacement must be a non-empty string",
    ],
    [
      "an empty reason",
      JSON.stringify([{ ...entry, reason: " " }]),
      "[0].reason must be a non-empty string",
    ],
    [
      "a name that is not a string",
      JSON.stringify([{ ...entry, name: 3 }]),
      "[0].name must be a non-empty string",
    ],
    [
      "a name listed twice",
      JSON.stringify([entry, entry]),
      '[1].name must be unique ("PolledWait" is listed twice)',
    ],
    ["invalid JSON", "[", "the content must be valid JSON"],
  ])("throws at load for %s, naming the field", (_, content, message) => {
    const file = dataFile("unsafe-natives.json", content);
    expect(() =>
      createPlugin({
        files: { unsafeNatives: file },
        projectRoot: fixtureProjectRoot,
      }),
    ).toThrow(DataFileError);
    expect(() =>
      createPlugin({
        files: { unsafeNatives: file },
        projectRoot: fixtureProjectRoot,
      }),
    ).toThrow(`${file}: ${message}`);
  });

  it("loads a well-formed file", () => {
    const file = dataFile("unsafe-natives.json", JSON.stringify([entry]));
    expect(
      createPlugin({
        files: { unsafeNatives: file },
        projectRoot: fixtureProjectRoot,
      }).rules,
    ).toHaveProperty("no-unsafe-natives");
  });

  it("names only Natives of the installed Typings", () => {
    const natives = installedNatives();
    expect(natives.size).toBeGreaterThan(1000);
    const missing = banList
      .map((each) => each.name)
      .filter((name) => !natives.has(name));
    expect(missing).toEqual([]);
  });
});

describe("the allowlist (data/local-safe.json)", () => {
  const entry = { name: "BlzFrameSetText", kind: "text", reason: "r." };

  it.each([
    ["not an array", "{}", "the root must be an array"],
    ["an entry not an object", "[null]", "[0] must be an object"],
    [
      "a missing kind",
      JSON.stringify([entry, { name: "SetCameraField", reason: "r." }]),
      '[1].kind must be one of "visual", "text", "pure"',
    ],
    [
      "an unknown kind",
      JSON.stringify([{ ...entry, kind: "sound" }]),
      '[0].kind must be one of "visual", "text", "pure"',
    ],
    [
      "an empty reason",
      JSON.stringify([{ ...entry, reason: "" }]),
      "[0].reason must be a non-empty string",
    ],
    [
      "a name of another form",
      JSON.stringify([{ ...entry, name: "Frame::setText" }]),
      "[0].name must be a Native name, Class#member or Class.member",
    ],
    [
      "a pure entry naming a library member",
      JSON.stringify([{ ...entry, name: "Frame#text", kind: "pure" }]),
      "[0].name must be a Native name (a pure entry)",
    ],
    [
      "a name listed twice",
      JSON.stringify([entry, entry]),
      '[1].name must be unique ("BlzFrameSetText" is listed twice)',
    ],
    ["invalid JSON", "[{", "the content must be valid JSON"],
  ])("throws at load for %s, naming the field", (_, content, message) => {
    const file = dataFile("local-safe.json", content);
    expect(() =>
      createPlugin({
        files: { localSafe: file },
        projectRoot: fixtureProjectRoot,
      }),
    ).toThrow(DataFileError);
    expect(() =>
      createPlugin({
        files: { localSafe: file },
        projectRoot: fixtureProjectRoot,
      }),
    ).toThrow(`${file}: ${message}`);
  });

  it("loads a well-formed file", () => {
    const file = dataFile("local-safe.json", JSON.stringify([entry]));
    expect(
      createPlugin({
        files: { localSafe: file },
        projectRoot: fixtureProjectRoot,
      }).rules,
    ).toHaveProperty("no-percent-in-display-strings");
  });

  it("gives every entry a non-empty reason and a known kind", () => {
    for (const each of localSafe) {
      expect(each.reason.trim(), each.name).not.toBe("");
      expect(["visual", "text", "pure"], each.name).toContain(each.kind);
    }
  });

  it("names only Natives of the installed Typings, and print", () => {
    const natives = installedNatives();
    const missing = localSafe
      .map((each) => each.name)
      .filter((name) => !/[#.]/.test(name) && !natives.has(name));
    // print is Lua's (lua-types), not a Native (decision 6 of the #50 run).
    expect(missing).toEqual(["print"]);
  });

  it("lists pure entries that are all Natives of the installed Typings", () => {
    const natives = installedNatives();
    const pure = localSafe
      .filter((each) => each.kind === "pure")
      .map((each) => each.name);
    expect(pure).toEqual(
      expect.arrayContaining(["I2S", "R2S", "R2SW", "SquareRoot", "SubString"]),
    );
    expect(pure).toEqual(
      expect.arrayContaining(["BlzGetFrameByName", "BlzGetOriginFrame"]),
    );
    expect(pure.filter((name) => !natives.has(name))).toEqual([]);
  });

  it("names only members of the reforged-ts library, with their static-ness", () => {
    const members = libraryMembers();
    expect(members).toContain("Frame#setText");
    const missing = localSafe
      .map((each) => each.name)
      .filter((name) => /[#.]/.test(name) && !members.has(name));
    expect(missing).toEqual([]);
  });
});

describe("the creation Natives (data/creation-natives.json)", () => {
  const entry = { name: "CreateTimer", family: "Create*" };

  it.each([
    ["not an array", "{}", "the root must be an array"],
    ["an entry not an object", '["CreateTimer"]', "[0] must be an object"],
    [
      "a missing family",
      JSON.stringify([entry, { name: "CreateGroup" }]),
      "[1].family must be a non-empty string",
    ],
    [
      "a name listed twice",
      JSON.stringify([entry, entry]),
      '[1].name must be unique ("CreateTimer" is listed twice)',
    ],
  ])("throws at load for %s, naming the field", (_, content, message) => {
    const file = dataFile("creation-natives.json", content);
    expect(() =>
      createPlugin({
        files: { creationNatives: file },
        projectRoot: fixtureProjectRoot,
      }),
    ).toThrow(`${file}: ${message}`);
  });

  it("names only Handle-returning Natives of the installed Typings, none a registration", () => {
    const natives = installedNatives();
    const checker = fixtureProgram().getTypeChecker();
    const wrong = creationNatives
      .map((each) => {
        const declaration = natives.get(each.name);
        const type = declaration && returnedHandleType(checker, declaration);
        return { name: each.name, type };
      })
      .filter(({ type }) => type === undefined || isRegistrationType(type));
    expect(wrong).toEqual([]);
  });

  it("lists no lookup or conversion", () => {
    const lookups = creationNatives
      .map((each) => each.name)
      .filter((name) =>
        /^(Get|BlzGet|Convert|Load|Player$|GetLocalPlayer$)/.test(name),
      );
    expect(lookups).toEqual([]);
  });
});

/** A project root with the given files, relative to it; a fresh directory each call. */
function project(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(scratch, "project-"));
  for (const [relative, content] of Object.entries(files)) {
    const file = path.join(root, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  return root;
}

const stubManifest = JSON.stringify({ name: "reforged-ts", version: "1.2.3" });

/** A reforged-types installation that publishes an (empty) async-natives.json. */
const typesStub: Record<string, string> = {
  "node_modules/reforged-types/package.json": JSON.stringify({
    name: "reforged-types",
    version: "3.0.0",
  }),
  "node_modules/reforged-types/async-natives.json": "[]",
};

describe("the rename map (reforged-ts's migration/renames.json)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const entry = {
    old: "new Unit(...)",
    new: "Unit.create(...)",
    kind: "constructor",
    versions: { from: "w3ts@3", to: "reforged-ts@1" },
    oneToOne: true,
    note: "n.",
  };

  it.each([
    ["not an array", "{}", "the root must be an array"],
    ["an entry not an object", "[null]", "[0] must be an object"],
    [
      "an unknown kind",
      JSON.stringify([entry, { ...entry, kind: "method" }]),
      "[1].kind must be one of constructor, member, accessor, function, class, type, entryPoint, package",
    ],
    [
      "an old symbol that is not a symbol",
      JSON.stringify([{ ...entry, old: "new Unit" + "!" }]),
      "[0].old must be a symbol",
    ],
    [
      "a replacement that is not a symbol",
      JSON.stringify([{ ...entry, new: "Unit create" }]),
      "[0].new must be a symbol",
    ],
    [
      "a list of one replacement",
      JSON.stringify([{ ...entry, oneToOne: false, new: ["Unit.create"] }]),
      "[0].new must be a symbol (`Unit.create(...)`), a list of at least two symbols, or null",
    ],
    [
      "a list with a bad element",
      JSON.stringify([{ ...entry, oneToOne: false, new: ["Unit.create", 3] }]),
      "[0].new[1] must be a symbol",
    ],
    [
      "a one-to-one entry without a single replacement",
      JSON.stringify([{ ...entry, new: null }]),
      "[0].new must be a single symbol when oneToOne is true",
    ],
    [
      "a package entry whose replacement is not a package name",
      JSON.stringify([
        { ...entry, old: "w3ts", new: "Reforged TS", kind: "package" },
      ]),
      "[0].new must be a package name",
    ],
    [
      "a missing versions object",
      JSON.stringify([{ ...entry, versions: undefined }]),
      "[0].versions must be an object",
    ],
    [
      "a version without a major",
      JSON.stringify([
        { ...entry, versions: { from: "w3ts", to: "reforged-ts@1" } },
      ]),
      "[0].versions.from must be a package and its major",
    ],
    [
      "a oneToOne that is not a boolean",
      JSON.stringify([{ ...entry, oneToOne: "yes" }]),
      "[0].oneToOne must be a boolean",
    ],
    [
      "an empty note",
      JSON.stringify([{ ...entry, note: "" }]),
      "[0].note must be a non-empty string",
    ],
  ])("throws at load for %s, naming the field", (_, content, message) => {
    const file = dataFile("renames.json", content);
    expect(() => createPlugin({ files: { renames: file } })).toThrow(
      DataFileError,
    );
    expect(() => createPlugin({ files: { renames: file } })).toThrow(
      `${file}: ${message}`,
    );
  });

  it("throws for a malformed map in the project's installation, naming the file and the field", () => {
    const root = project({
      "node_modules/reforged-ts/package.json": stubManifest,
      "node_modules/reforged-ts/migration/renames.json": JSON.stringify([
        { ...entry, kind: "method" },
      ]),
    });
    const file = path.join(
      root,
      "node_modules/reforged-ts/migration/renames.json",
    );
    expect(() => createPlugin({ projectRoot: root })).toThrow(
      `${file}: [0].kind must be one of`,
    );
  });

  it("reads the map from the project's installation, found from the project root", () => {
    const root = project({
      "node_modules/reforged-ts/package.json": stubManifest,
      "node_modules/reforged-ts/migration/renames.json": JSON.stringify([
        { ...entry, old: "new Timer(...)", new: "Timer.create(...)" },
      ]),
      "maps/one/.keep": "",
      ...typesStub,
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    // A project root below the installation: Node's lookup walks up.
    const plugin = createPlugin({ projectRoot: path.join(root, "maps/one") });
    expect(warn).not.toHaveBeenCalled();
    expect(
      lintWithRecommended(
        'import { Timer, Unit } from "reforged-ts";\nnew Timer();\nnew Unit(0 as never, 0, 0, 0);',
        plugin,
      ).filter((each) => each.ruleId === "reforged/no-legacy-w3ts-names"),
    ).toMatchObject([{ line: 2 }]);
  });

  it("warns once and disables the rule when the project has no reforged-ts", () => {
    const root = project({ "package.json": "{}", ...typesStub });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const plugin = createPlugin({ projectRoot: root });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      `eslint-plugin-reforged: reforged-ts is not installed in ${root} (resolved from the project root); disabled: reforged/no-legacy-w3ts-names.`,
    );
    // Disabled, still registered: a config that names it loads.
    expect(plugin.rules).toHaveProperty("no-legacy-w3ts-names");
    expect(
      lintWithRecommended(
        'import { MapPlayer } from "w3ts";\nMapPlayer.create(0);\nTriggerSleepAction(1);',
        plugin,
      ).map((each) => each.ruleId),
    ).toEqual(["reforged/no-unsafe-natives"]);
  });

  it("never reads the plugin's own reforged-ts", () => {
    // The plugin's package has reforged-ts as a devDependency; a project
    // root outside it must not see that installation.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    createPlugin({ projectRoot: project(typesStub) });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("reforged-ts is not installed"),
    );
  });

  it("warns once and disables the rule when reforged-ts does not publish the map", () => {
    const root = project({
      "node_modules/reforged-ts/package.json": stubManifest,
      ...typesStub,
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    createPlugin({ projectRoot: root });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      `eslint-plugin-reforged: reforged-ts@1.2.3 in ${path.join(root, "node_modules/reforged-ts")} does not publish migration/renames.json; disabled: reforged/no-legacy-w3ts-names.`,
    );
  });

  it("loads the library's own map, the contract", () => {
    // This package's devDependency: the workspace's reforged-ts, linked
    // into its node_modules as a Map project's installation is.
    const packageRoot = fileURLToPath(new URL("..", import.meta.url));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const plugin = createPlugin({ projectRoot: packageRoot });
    expect(warn).not.toHaveBeenCalled();
    expect(
      lintWithRecommended('import { Unit } from "w3ts";\nprint(Unit);', plugin)
        .filter((each) => each.ruleId === "reforged/no-legacy-w3ts-names")
        .map((each) => each.message),
    ).toEqual([expect.stringContaining("use `reforged-ts`")]);
  });
});

describe("the async Natives (reforged-types's async-natives.json)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** reforged-ts too, so only reforged-types can be missing. */
  const libraryStub: Record<string, string> = {
    "node_modules/reforged-ts/package.json": stubManifest,
    "node_modules/reforged-ts/migration/renames.json": "[]",
  };
  const asyncCode = "export const x = GetCameraTargetPositionX();";

  function asyncMessages(plugin: ReturnType<typeof createPlugin>) {
    return lintWithRecommended(asyncCode, plugin).filter(
      (each) => each.ruleId === "reforged/no-async-value-as-state",
    );
  }

  it.each([
    ["not an array", "{}", "the root must be an array"],
    [
      "a name that is not a string",
      '["GetLocalPlayer", 3]',
      "[1] must be a non-empty string",
    ],
    ["an empty name", '[""]', "[0] must be a non-empty string"],
    [
      "a name listed twice",
      '["GetLocalPlayer", "GetLocalPlayer"]',
      '[1].name must be unique ("GetLocalPlayer" is listed twice)',
    ],
  ])("throws at load for %s, naming the field", (_, content, message) => {
    const file = dataFile("async-natives.json", content);
    expect(() =>
      createPlugin({
        files: { asyncNatives: file },
        projectRoot: fixtureProjectRoot,
      }),
    ).toThrow(`${file}: ${message}`);
  });

  it("throws for a malformed file in the project's installation, naming the file and the field", () => {
    const root = project({
      ...libraryStub,
      ...typesStub,
      "node_modules/reforged-types/async-natives.json":
        '{"GetLocalPlayer": true}',
    });
    const file = path.join(
      root,
      "node_modules/reforged-types/async-natives.json",
    );
    expect(() => createPlugin({ projectRoot: root })).toThrow(DataFileError);
    expect(() => createPlugin({ projectRoot: root })).toThrow(
      `${file}: the root must be an array`,
    );
  });

  it("reads the file from the project's installation, found from the project root", () => {
    // The fixture Typings tag GetCameraTargetPositionX; the rule pre-matches
    // a plain call by the file's names, so a list without it reports nothing.
    const listed = project({
      ...libraryStub,
      ...typesStub,
      "node_modules/reforged-types/async-natives.json":
        '["GetCameraTargetPositionX"]',
    });
    const unlisted = project({ ...libraryStub, ...typesStub });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(asyncMessages(createPlugin({ projectRoot: listed }))).toHaveLength(
      1,
    );
    expect(asyncMessages(createPlugin({ projectRoot: unlisted }))).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns once and disables the rule when the project has no reforged-types", () => {
    const root = project(libraryStub);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const plugin = createPlugin({ projectRoot: root });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      `eslint-plugin-reforged: reforged-types is not installed in ${root} (resolved from the project root); disabled: reforged/no-async-value-as-state.`,
    );
    // Disabled, still registered: a config that names it loads.
    expect(plugin.rules).toHaveProperty("no-async-value-as-state");
    expect(asyncMessages(plugin)).toEqual([]);
  });

  it("warns once and disables the rule when reforged-types does not publish the file", () => {
    const root = project({
      ...libraryStub,
      "node_modules/reforged-types/package.json": JSON.stringify({
        name: "reforged-types",
        version: "2.0.0",
      }),
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const plugin = createPlugin({ projectRoot: root });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      `eslint-plugin-reforged: reforged-types@2.0.0 in ${path.join(root, "node_modules/reforged-types")} does not publish async-natives.json; disabled: reforged/no-async-value-as-state.`,
    );
    expect(asyncMessages(plugin)).toEqual([]);
  });

  describe("the oracle: the installed file and the Typings' @async tags agree", () => {
    // The installation the plugin reads for the fixture project (this
    // package's devDependency, the workspace's reforged-types).
    const installed = path.join(
      findPackageDirectory(fixtureProjectRoot, "reforged-types") ?? "",
      "async-natives.json",
    );
    const listed = JSON.parse(readFileSync(installed, "utf8")) as string[];

    /** Every declaration of the installed Typings carrying the tag, by name. */
    function taggedDeclarations(): string[] {
      const names: string[] = [];
      for (const sourceFile of fixtureProgram().getSourceFiles()) {
        if (packageNameOf(sourceFile.fileName) !== "reforged-types") {
          continue;
        }
        const visit = (node: ts.Node): void => {
          if (
            ts.getJSDocTags(node).some((tag) => tag.tagName.text === "async")
          ) {
            const name = ts.getNameOfDeclaration(node as ts.Declaration);
            names.push(name === undefined ? node.getText() : name.getText());
          }
          ts.forEachChild(node, visit);
        };
        visit(sourceFile);
      }
      return names.sort();
    }

    it("parses as the plugin reads it", () => {
      expect(() => parseAsyncNatives(listed, installed)).not.toThrow();
      expect(listed.length).toBeGreaterThan(0);
    });

    it("names only Natives that carry @async", () => {
      const natives = installedNatives();
      const untagged = listed.filter((name) => {
        const declaration = natives.get(name);
        return (
          declaration === undefined ||
          !ts
            .getJSDocTags(declaration)
            .some((tag) => tag.tagName.text === "async")
        );
      });
      expect(untagged).toEqual([]);
    });

    it("lists every @async declaration", () => {
      const listedSet = new Set(listed);
      expect(taggedDeclarations()).not.toEqual([]);
      expect(
        taggedDeclarations().filter((name) => !listedSet.has(name)),
      ).toEqual([]);
    });
  });
});
