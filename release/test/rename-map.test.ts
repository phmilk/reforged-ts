import { copyFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import {
  checkRenameMap,
  declarationResolver,
  loadRenameMap,
  migrationPagePath,
  missingSymbols,
  oldSymbol,
  parseRenameMap,
  parseSymbol,
  renameEntries,
  replacements,
  versionPairs,
  type DeclarationResolver,
  type NoRenamesMarker,
  type RenameEntry,
} from "../src/rename-map.js";
import { tempDir, writeText } from "./support/workspace.js";

/** The library's schema, the contract every rename map is checked against. */
const SCHEMA = fileURLToPath(
  new URL(
    "../../packages/reforged-ts/migration/renames.schema.json",
    import.meta.url,
  ),
);

const FIRST = { from: "w3ts@3", to: "reforged-ts@1" };
const SECOND = { from: "reforged-ts@1", to: "reforged-ts@2" };

const accessor: RenameEntry = {
  old: "Unit.owner",
  new: ["Unit.getOwner", "Unit.setOwner"],
  kind: "accessor",
  versions: FIRST,
  oneToOne: false,
  note: "A get/set pair.",
};

const constructor: RenameEntry = {
  old: "new Unit(...)",
  new: "Unit.create(...)",
  kind: "constructor",
  versions: FIRST,
  oneToOne: true,
  note: "Creation is a static factory.",
};

const removed: RenameEntry = {
  old: "Group.getEnumUnit",
  new: null,
  kind: "member",
  versions: FIRST,
  oneToOne: false,
  note: "Removed.",
};

const entryPoint: RenameEntry = {
  old: "main::after",
  new: "Init.onInitTriggers",
  kind: "entryPoint",
  versions: FIRST,
  oneToOne: false,
  note: "An Init stage.",
};

const packageEntry: RenameEntry = {
  old: "w3ts",
  new: "reforged-ts",
  kind: "package",
  versions: FIRST,
  oneToOne: true,
  note: "The fork's name.",
};

const marker: NoRenamesMarker = {
  kind: "noRenames",
  versions: SECOND,
  note: "Renames nothing.",
};

/** A built declaration entry: index.d.ts re-exporting two files. */
const DECLARATIONS: Record<string, string> = {
  "index.d.ts": [
    'export { Handle } from "./handle";',
    'export { Unit } from "./unit";',
    "export interface InitStages {",
    "  onInitTriggers(callback: () => void): void;",
    "}",
    "export declare const Init: InitStages;",
    "export declare function onHost(): void;",
    "",
  ].join("\n"),
  "handle.d.ts": [
    "export declare class Handle {",
    "  static fromHandle(handle: unknown): Handle | undefined;",
    "  protected getObject(): unknown;",
    "}",
    "",
  ].join("\n"),
  "unit.d.ts": [
    'import { Handle } from "./handle";',
    "export declare class Unit extends Handle {",
    "  private constructor();",
    "  private static cache: unknown;",
    "  static create(): Unit;",
    "  getOwner(): number;",
    "  setOwner(owner: number): void;",
    "  get life(): number;",
    "}",
    "",
  ].join("\n"),
};

/** Writes the fixture declarations; resolves with the entry's path. */
async function declarationEntry(): Promise<string> {
  const dir = await tempDir("declarations");
  for (const [name, text] of Object.entries(DECLARATIONS)) {
    await writeText(dir, name, text);
  }
  return join(dir, "index.d.ts");
}

/** Writes `items` as renames.json next to a copy of the schema; resolves with its path. */
async function mapFile(items: unknown): Promise<string> {
  const dir = await tempDir("renames");
  await writeText(dir, "renames.json", JSON.stringify(items));
  await copyFile(SCHEMA, join(dir, "renames.schema.json"));
  return join(dir, "renames.json");
}

describe("the rename map's loader", () => {
  it("reads a map file against the schema next to it, markers kept", async () => {
    const items = [accessor, packageEntry, marker];
    expect(await loadRenameMap(await mapFile(items))).toEqual(items);
  });

  it("rejects a map file that does not match the schema next to it", async () => {
    const file = await mapFile([{ ...accessor, kind: "method" }]);
    await expect(loadRenameMap(file)).rejects.toThrow(
      /^The rename map does not match its schema:\n\/0/,
    );
  });

  it("takes the schema from another path when given one", async () => {
    const dir = await tempDir("renames");
    await writeText(dir, "renames.json", JSON.stringify([accessor]));
    await expect(loadRenameMap(join(dir, "renames.json"))).rejects.toThrow();
    expect(await loadRenameMap(join(dir, "renames.json"), SCHEMA)).toEqual([
      accessor,
    ]);
  });

  it("parses a map's text against a schema file", () => {
    expect(parseRenameMap(JSON.stringify([removed]), SCHEMA)).toEqual([
      removed,
    ]);
    expect(() => parseRenameMap("{}", SCHEMA)).toThrow(
      /does not match its schema/,
    );
  });

  it("drops the markers from the entries", () => {
    expect(renameEntries([accessor, marker, removed])).toEqual([
      accessor,
      removed,
    ]);
  });
});

describe("a symbol of the rename map", () => {
  it.each([
    [
      "a constructor",
      "new Unit(...)",
      { className: "Unit", member: undefined },
    ],
    [
      "a static member",
      "Unit.create(...)",
      { className: "Unit", member: "create" },
    ],
    [
      "an instance member",
      "Frame.parent",
      { className: "Frame", member: "parent" },
    ],
    [
      "a function",
      "hookedMain",
      { className: "hookedMain", member: undefined },
    ],
    [
      "a called function",
      "onHostDetect(...)",
      { className: "onHostDetect", member: undefined },
    ],
    ["a class", "Unit", { className: "Unit", member: undefined }],
  ])("%s, %s, names %o", (_, symbol, parsed) => {
    expect(parseSymbol(symbol)).toEqual(parsed);
  });

  it.each(["main::before", "reforged-ts", "Unit.owner.name"])(
    "%s is not one",
    (text) => {
      expect(() => parseSymbol(text)).toThrow(
        `"${text}" is not a symbol of the rename map`,
      );
    },
  );

  it("is each replacement of an entry, none for a removal", () => {
    expect(replacements(constructor)).toEqual(["Unit.create(...)"]);
    expect(replacements(accessor)).toEqual(["Unit.getOwner", "Unit.setOwner"]);
    expect(replacements(removed)).toEqual([]);
    expect(replacements(entryPoint)).toEqual(["Init.onInitTriggers"]);
  });

  it("is never a package name or a marker", () => {
    expect(replacements(packageEntry)).toEqual([]);
    expect(replacements(marker)).toEqual([]);
    expect(oldSymbol(packageEntry)).toBeUndefined();
    expect(oldSymbol(marker)).toBeUndefined();
  });

  it("is the old name of an entry, unless it is an entry point", () => {
    expect(oldSymbol(constructor)).toBe("new Unit(...)");
    expect(oldSymbol(accessor)).toBe("Unit.owner");
    expect(oldSymbol(entryPoint)).toBeUndefined();
  });
});

describe("the version pairs of a map", () => {
  it("are each pair once, in the map's order, markers included", () => {
    expect(versionPairs([accessor, marker, removed, packageEntry])).toEqual([
      FIRST,
      SECOND,
    ]);
  });

  it("each have their page at the release gate's path", () => {
    expect(versionPairs([removed]).map(migrationPagePath)).toEqual([
      "website/docs/migration/w3ts-3-to-reforged-ts-1.md",
    ]);
  });
});

describe("the declaration resolver", () => {
  let resolver: DeclarationResolver;

  beforeAll(async () => {
    resolver = declarationResolver(await declarationEntry());
  });

  it.each([
    ["Unit", true],
    ["Unit.create(...)", true],
    ["Unit.getOwner", true],
    ["Unit.life", true],
    // Inherited from the base class: a static member, and a protected one
    // (not public).
    ["Unit.fromHandle(...)", true],
    ["Unit.getObject", false],
    ["Unit.cache", false],
    ["Unit.noSuchMember", false],
    ["NoSuchClass", false],
    // A value export whose type has the member.
    ["Init.onInitTriggers", true],
    ["Init.noSuchStage", false],
    // An exported type is not a value an author can write a member of.
    ["InitStages.onInitTriggers", false],
    ["onHost", true],
  ])("finds %s: %s", (symbol, found) => {
    expect(resolver.has(parseSymbol(symbol))).toBe(found);
  });

  it("throws when the entry is not a module", async () => {
    const dir = await tempDir("declarations");
    expect(() => declarationResolver(join(dir, "index.d.ts"))).toThrow(
      /is not a module/,
    );
  });
});

describe("the replacements missing from the declarations", () => {
  it("name each entry whose replacement does not resolve", async () => {
    const resolver = declarationResolver(await declarationEntry());
    const broken: RenameEntry = {
      ...removed,
      new: ["Unit.create(...)", "Unit.fromEnum"],
    };
    expect(
      missingSymbols(
        [accessor, constructor, broken, entryPoint, packageEntry, marker],
        resolver,
      ),
    ).toEqual([
      { old: "Group.getEnumUnit", versions: FIRST, symbol: "Unit.fromEnum" },
    ]);
  });

  it("are checked from the map file and the declaration entry in one call", async () => {
    const items = [
      constructor,
      { ...accessor, new: ["Unit.getOwner", "Unit.owner"] },
    ];
    expect(
      await checkRenameMap(await mapFile(items), await declarationEntry()),
    ).toEqual({
      items,
      missing: [{ old: "Unit.owner", versions: FIRST, symbol: "Unit.owner" }],
    });
  });

  it("are none for a map of markers only", async () => {
    expect(
      await checkRenameMap(await mapFile([marker]), await declarationEntry()),
    ).toEqual({ items: [marker], missing: [] });
  });
});
