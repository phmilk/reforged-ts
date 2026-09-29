// The rename map these cases read is the fixture's stub reforged-ts,
// test/fixture-project/node_modules/reforged-ts/migration/renames.json: one
// entry of each kind the rule handles, and a note entry that keeps its name.
import { describe, expect, it } from "vitest";

import { lintWithRecommended } from "../support/lint.js";
import { ruleOf } from "../support/plugin.js";
import { createRuleTester } from "../support/rule-tester.js";

const ruleTester = createRuleTester();

const versions = { from: "w3ts@3", to: "reforged-ts@1" };

function renamed(old: string, replacement: string, note: string) {
  return {
    messageId: "renamed" as const,
    data: { old, replacement, note, ...versions },
  };
}

function removed(old: string, note: string) {
  return {
    messageId: "removed" as const,
    data: { old, note, replacement: "", ...versions },
  };
}

const packageNote = "The library is published under a new name.";
const unitNote = "`Unit.create` takes the same arguments.";
const effectNote = "The overloads split by argument shape.";
const playerNote = "A player is looked up, not created, and may be missing.";
const createNote = "The same lookup under the name of the other lookups.";
const enumNote = "The enumerated unit is read from the Unit class.";
const getObjectNote = "`fromHandle` returns undefined for a missing handle.";
const initNote = "Wrappers are made by the Handle base only.";
const ownerNote = "The accessor pair is two methods.";
const itemOwnerNote = "A getter-only accessor becomes its getter.";
const orientNote = "The static drops its prefix and takes the Unit Wrapper.";

const header = 'import { Group, MapPlayer, Unit } from "reforged-ts";\n';

const restoreNote =
  "Fixture entry: it returns the Unit and throws where it returned undefined.";
const storeNote = "Fixture entry: a unit is passed as the Unit.";
const targetNote = "Fixture entry: it takes the Unit instead of the raw unit.";
const taxNote =
  "Fixture entry: it takes the MapPlayer instead of the raw player.";
const mouseNote =
  "Fixture entry: the kind is a MouseEventKind instead of a number.";

/** A report on a member that kept its name. */
function kept(
  messageId: "oldArgument" | "oldResult" | "checkedResult",
  old: string,
  note: string,
) {
  return { messageId, data: { old, note, ...versions } };
}

const cacheHeader = `import { Camera, GameCache, Group, MapPlayer, Unit } from "reforged-ts";\ndeclare const cache: GameCache;\ndeclare const owner: MapPlayer;\n`;

ruleTester.run("no-legacy-w3ts-names", ruleOf("no-legacy-w3ts-names"), {
  valid: [
    {
      name: "the new names",
      code: `${header}const unit = Unit.create(MapPlayer.fromIndex(0)!, 0, 0, 0);\nconst enumerated = Unit.fromEnum();\nconst owner = unit.getOwner();\nunit.setOwner(owner);`,
    },
    {
      name: "a member of the map's name on an unrelated project class",
      code: "export class Pool {\n  getEnumUnit(): number { return 0; }\n  owner = 1;\n  static create(): Pool { return new Pool(); }\n}\nconst pool = new Pool();\npool.getEnumUnit();\npool.owner = pool.owner + 1;\nPool.create();",
    },
    {
      name: "a project class named like a library class",
      code: "export class Group {\n  getEnumUnit(): number { return 0; }\n}\nnew Group().getEnumUnit();",
    },
    {
      name: "a project subclass of a library class, constructed",
      code: `${header}export class Hero extends Unit {\n  constructor() { super(Unit.create(MapPlayer.fromIndex(0)!, 0, 0, 0).handle); }\n}\nnew Hero();`,
    },
    {
      name: "a map-named export imported from another module",
      code: 'import { PolledWait as hookedMain } from "./wait";\nhookedMain(1);',
    },
    {
      name: "an entry whose new name is its old one is a note, not a rename",
      code: `${header}Unit.create(MapPlayer.fromIndex(0)!, 0, 0, 0).kill();`,
    },
    {
      name: "a member that kept its name, used with its new signature",
      code: `${cacheHeader}declare const hero: Unit;\nCamera.setTargetController(hero, 0, 0, false);\ncache.store("m", "k", hero);\ncache.store("m", "n", 1);\nif (cache.hasUnit("m", "k")) {\n  const restored = cache.restoreUnit("m", "k", owner, 0, 0, 0);\n  restored.kill();\n  Group.create().addUnit(cache.restoreUnit("m", "k", owner, 0, 0, 0));\n}`,
    },
    {
      name: "a check of a kept member's result that can be missing",
      code: `import { Frame } from "reforged-ts";\nconst frame = Frame.fromName("f", 0);\nif (frame !== undefined) {\n  frame.setVisible(true);\n}\nif (!Frame.fromName("g", 0)) {\n  print("none");\n}\nFrame.fromName("h", 0)?.setVisible(true);\nconst shown = Frame.fromName("i", 0) ?? frame;\nif (typeof Frame.fromName("j", 0) === "undefined") {\n  print("none");\n}`,
    },
    {
      name: "a check of another value, or a comparison of a kept member's result",
      code: `${cacheHeader}declare const other: Unit | undefined;\nif (other !== undefined && other) {\n  print("found");\n}\nconst restored = cache.restoreUnit("m", "k", owner, 0, 0, 0);\nif (restored.name === "") {\n  print("unnamed");\n}`,
    },
    {
      name: "a truthiness test of a kept member's primitive result",
      code: `${cacheHeader}const other = MapPlayer.fromIndex(1)!;\nif (owner.getTaxRate(other, PLAYER_STATE_RESOURCE_GOLD)) {\n  print("taxed");\n}\nconst none = !owner.getTaxRate(other, PLAYER_STATE_RESOURCE_GOLD);\nconst rate = owner.getTaxRate(other, PLAYER_STATE_RESOURCE_GOLD) || 0;\nconst shown = owner.getTaxRate(other, PLAYER_STATE_RESOURCE_GOLD) ? "taxed" : "free";\nwhile (owner.getTaxRate(other, PLAYER_STATE_RESOURCE_GOLD) && rate > 0) {\n  break;\n}`,
    },
    {
      name: "a kept member's result cast to a type that can be missing, then checked",
      code: `${cacheHeader}declare const spare: Unit;\nconst hero = (cache.restoreUnit("m", "k", owner, 0, 0, 0) as Unit | undefined) ?? spare;\nif ((cache.restoreUnit("m", "n", owner, 0, 0, 0) as Unit | undefined) === undefined) {\n  print("none");\n}`,
    },
    {
      name: "a kept member's result in an annotated variable of its new type",
      code: `${cacheHeader}const hero: Unit = cache.restoreUnit("m", "k", owner, 0, 0, 0);\nlet other: Unit | undefined = cache.restoreUnit("m", "n", owner, 0, 0, 0);\nother = hero;`,
    },
    {
      name: "the mouse event kind passed as the enum",
      code: 'import { MapPlayer, MouseEventKind, Trigger } from "reforged-ts";\nTrigger.create().registerPlayerMouseEvent(MapPlayer.fromIndex(0)!, MouseEventKind.Down);',
    },
    {
      name: "a project member named like a kept member",
      code: "export class Cache {\n  restoreUnit(): number | undefined { return undefined; }\n}\nconst value = new Cache().restoreUnit();\nif (value !== undefined) {\n  print(value);\n}",
    },
    {
      name: "an entry point is not code",
      code: 'const stage = "main::before";\nprint(stage);',
    },
  ],
  invalid: [
    {
      name: "an import from the old package is fixed",
      code: 'import { Unit } from "w3ts";\nexport { MapPlayer } from \'w3ts\';\nexport * from "w3ts";',
      output:
        'import { Unit } from "reforged-ts";\nexport { MapPlayer } from \'reforged-ts\';\nexport * from "reforged-ts";',
      errors: [
        { ...renamed("w3ts", "`reforged-ts`", packageNote), line: 1 },
        { ...renamed("w3ts", "`reforged-ts`", packageNote), line: 2 },
        { ...renamed("w3ts", "`reforged-ts`", packageNote), line: 3 },
      ],
    },
    {
      name: "new X(...) is fixed to X.create(...)",
      code: `${header}const unit = new Unit(MapPlayer.fromIndex(0)!, 0, 0, 0);`,
      output: `${header}const unit = Unit.create(MapPlayer.fromIndex(0)!, 0, 0, 0);`,
      errors: [renamed("new Unit(...)", "`Unit.create(...)`", unitNote)],
    },
    {
      name: "new X(...) through an alias keeps the alias",
      code: 'import { Unit as U } from "reforged-ts";\nnew U(0 as never, 0, 0, 0);',
      output:
        'import { Unit as U } from "reforged-ts";\nU.create(0 as never, 0, 0, 0);',
      errors: [renamed("new Unit(...)", "`Unit.create(...)`", unitNote)],
    },
    {
      name: "a same-signature static member rename is fixed",
      code: `${header}const player = MapPlayer.create(0);`,
      output: `${header}const player = MapPlayer.fromIndex(0);`,
      errors: [
        {
          ...renamed("MapPlayer.create", "`MapPlayer.fromIndex`", createNote),
          column: 26,
        },
      ],
    },
    {
      name: "a member rename that changes the receiver replaces the callee",
      code: `${header}const group = Group.create();\nconst unit = group.getEnumUnit();`,
      output: `${header}const group = Group.create();\nconst unit = Unit.fromEnum();`,
      errors: [renamed("Group.getEnumUnit", "`Unit.fromEnum`", enumNote)],
    },
    {
      name: "a receiver change imports the class it names",
      code: 'import { Group } from "reforged-ts";\nconst unit = Group.create().getEnumUnit();',
      output:
        'import { Group, Unit } from "reforged-ts";\nconst unit = Unit.fromEnum();',
      errors: [renamed("Group.getEnumUnit", "`Unit.fromEnum`", enumNote)],
    },
    {
      name: "the old package and a receiver change, over two passes",
      code: 'import { Group } from "w3ts";\ndeclare const group: import("reforged-ts").Group;\ngroup.getEnumUnit();',
      output: [
        'import { Group, Unit } from "w3ts";\ndeclare const group: import("reforged-ts").Group;\nUnit.fromEnum();',
        'import { Group, Unit } from "reforged-ts";\ndeclare const group: import("reforged-ts").Group;\nUnit.fromEnum();',
      ],
      errors: [
        renamed("w3ts", "`reforged-ts`", packageNote),
        renamed("Group.getEnumUnit", "`Unit.fromEnum`", enumNote),
      ],
    },
    {
      name: "a renamed export's specifier is fixed and keeps the local name",
      code: 'import { getElapsedTime, getElapsedTime as elapsed } from "reforged-ts";\nprint(getElapsedTime(), elapsed());',
      output:
        'import { elapsedTime as getElapsedTime, elapsedTime as elapsed } from "reforged-ts";\nprint(getElapsedTime(), elapsed());',
      errors: [
        renamed(
          "getElapsedTime",
          "`elapsedTime`",
          "Fixture entry: a one-to-one rename of an export.",
        ),
        renamed(
          "getElapsedTime",
          "`elapsedTime`",
          "Fixture entry: a one-to-one rename of an export.",
        ),
      ],
    },
    {
      name: "an entry without oneToOne is a suggestion",
      code: `${header}const player = new MapPlayer(0);`,
      output: null,
      errors: [
        {
          ...renamed(
            "new MapPlayer(...)",
            "`MapPlayer.fromIndex(...)`",
            playerNote,
          ),
          suggestions: [
            {
              messageId: "useReplacement",
              data: { replacement: "MapPlayer.fromIndex(...)" },
              output: `${header}const player = MapPlayer.fromIndex(0);`,
            },
          ],
        },
      ],
    },
    {
      name: "a list in new is one suggestion per replacement",
      code: 'import { Effect, Unit } from "reforged-ts";\ndeclare const unit: Unit;\nnew Effect("a.mdx", unit, "origin");',
      output: null,
      errors: [
        {
          ...renamed(
            "new Effect(...)",
            "`Effect.create(...)` or `Effect.createAttachment(...)`",
            effectNote,
          ),
          suggestions: [
            {
              messageId: "useReplacement",
              data: { replacement: "Effect.create(...)" },
              output:
                'import { Effect, Unit } from "reforged-ts";\ndeclare const unit: Unit;\nEffect.create("a.mdx", unit, "origin");',
            },
            {
              messageId: "useReplacement",
              data: { replacement: "Effect.createAttachment(...)" },
              output:
                'import { Effect, Unit } from "reforged-ts";\ndeclare const unit: Unit;\nEffect.createAttachment("a.mdx", unit, "origin");',
            },
          ],
        },
      ],
    },
    {
      name: "a member entry matches a subclass, statically and on this",
      code: 'import { Unit } from "reforged-ts";\nexport class Hero extends Unit {\n  static of(handle: unit) {\n    return this.getObject(handle);\n  }\n}\nUnit.getObject(0 as never);',
      output: null,
      errors: [
        {
          ...renamed("Handle.getObject", "`Handle.fromHandle`", getObjectNote),
          line: 4,
          suggestions: [
            {
              messageId: "useReplacement",
              data: { replacement: "Handle.fromHandle" },
              output:
                'import { Unit } from "reforged-ts";\nexport class Hero extends Unit {\n  static of(handle: unit) {\n    return this.fromHandle(handle);\n  }\n}\nUnit.getObject(0 as never);',
            },
          ],
        },
        {
          ...renamed("Handle.getObject", "`Handle.fromHandle`", getObjectNote),
          line: 7,
          suggestions: [
            {
              messageId: "useReplacement",
              data: { replacement: "Handle.fromHandle" },
              output:
                'import { Unit } from "reforged-ts";\nexport class Hero extends Unit {\n  static of(handle: unit) {\n    return this.getObject(handle);\n  }\n}\nUnit.fromHandle(0 as never);',
            },
          ],
        },
      ],
    },
    {
      name: "an accessor suggests its getter on a read and its setter on an assignment",
      code: `${header}declare const unit: Unit;\nconst owner = unit.owner;\nunit.owner = owner;\nunit.owner += 1;`,
      output: null,
      errors: [
        {
          ...renamed(
            "Unit.owner",
            "`Unit.getOwner` or `Unit.setOwner`",
            ownerNote,
          ),
          line: 3,
          suggestions: [
            {
              messageId: "useReplacement",
              data: { replacement: "Unit.getOwner" },
              output: `${header}declare const unit: Unit;\nconst owner = unit.getOwner();\nunit.owner = owner;\nunit.owner += 1;`,
            },
          ],
        },
        {
          ...renamed(
            "Unit.owner",
            "`Unit.getOwner` or `Unit.setOwner`",
            ownerNote,
          ),
          line: 4,
          suggestions: [
            {
              messageId: "useReplacement",
              data: { replacement: "Unit.setOwner" },
              output: `${header}declare const unit: Unit;\nconst owner = unit.owner;\nunit.setOwner(owner);\nunit.owner += 1;`,
            },
          ],
        },
        {
          ...renamed(
            "Unit.owner",
            "`Unit.getOwner` or `Unit.setOwner`",
            ownerNote,
          ),
          line: 5,
          suggestions: [],
        },
      ],
    },
    {
      name: "a getter-only accessor suggests the call of its getter on a read, nothing on an assignment",
      code: 'import { Item, MapPlayer } from "reforged-ts";\ndeclare const item: Item;\nconst owner = item.player;\nitem.player = MapPlayer.fromIndex(0);',
      output: null,
      errors: [
        {
          ...renamed("Item.player", "`Item.getOwner`", itemOwnerNote),
          line: 3,
          suggestions: [
            {
              messageId: "useReplacement",
              data: { replacement: "Item.getOwner" },
              output:
                'import { Item, MapPlayer } from "reforged-ts";\ndeclare const item: Item;\nconst owner = item.getOwner();\nitem.player = MapPlayer.fromIndex(0);',
            },
          ],
        },
        {
          ...renamed("Item.player", "`Item.getOwner`", itemOwnerNote),
          line: 4,
          suggestions: [],
        },
      ],
    },
    {
      name: "a renamed static member suggests the new name",
      code: 'import { Camera, Unit } from "reforged-ts";\ndeclare const unit: Unit;\nCamera.setCameraOrientController(unit, 0, 0);',
      output: null,
      errors: [
        {
          ...renamed(
            "Camera.setCameraOrientController",
            "`Camera.setOrientController`",
            orientNote,
          ),
          suggestions: [
            {
              messageId: "useReplacement",
              data: { replacement: "Camera.setOrientController" },
              output:
                'import { Camera, Unit } from "reforged-ts";\ndeclare const unit: Unit;\nCamera.setOrientController(unit, 0, 0);',
            },
          ],
        },
      ],
    },
    {
      name: "a removed member has no fix and no suggestion",
      code: `${header}declare const unit: Unit;\nunit.initFromHandle();`,
      output: null,
      errors: [
        {
          ...removed("Handle.initFromHandle", initNote),
          suggestions: [],
        },
      ],
    },
    {
      name: "a raw handle passed to a kept member that takes the Wrapper",
      code: `${cacheHeader}declare const hero: Unit;\nCamera.setTargetController(hero.handle, 0, 0, false);\ncache.store("m", "k", hero.handle);`,
      output: null,
      errors: [
        {
          ...kept("oldArgument", "Camera.setTargetController", targetNote),
          line: 5,
          column: 28,
        },
        {
          ...kept("oldArgument", "GameCache.store", storeNote),
          line: 6,
          column: 23,
        },
      ],
    },
    {
      name: "a raw player passed to a kept member that takes the MapPlayer",
      code: `${cacheHeader}const other = MapPlayer.fromIndex(1)!;\nconst rate = owner.getTaxRate(other.handle, PLAYER_STATE_RESOURCE_GOLD);`,
      output: null,
      errors: [
        {
          ...kept("oldArgument", "MapPlayer.getTaxRate", taxNote),
          line: 5,
          column: 31,
        },
      ],
    },
    {
      name: "Blizzard.j's number passed where the mouse event kind is taken",
      code: 'import { MapPlayer, Trigger } from "reforged-ts";\nTrigger.create().registerPlayerMouseEvent(MapPlayer.fromIndex(0)!, bj_MOUSEEVENTTYPE_DOWN);',
      output: null,
      errors: [
        {
          ...kept("oldArgument", "Trigger.registerPlayerMouseEvent", mouseNote),
          line: 2,
          column: 68,
        },
      ],
    },
    {
      name: "a kept member's result checked for a missing value, directly and through a const",
      code: `${cacheHeader}const hero = cache.restoreUnit("m", "k", owner, 0, 0, 0);\nif (hero !== undefined) {\n  hero.kill();\n}\nif (!cache.restoreUnit("m", "n", owner, 0, 0, 0)) {\n  print("none");\n}\ncache.restoreUnit("m", "o", owner, 0, 0, 0)?.kill();\nconst other = cache.restoreUnit("m", "p", owner, 0, 0, 0) ?? hero;`,
      output: null,
      errors: [
        {
          ...kept("checkedResult", "GameCache.restoreUnit", restoreNote),
          line: 5,
          column: 5,
          endColumn: 9,
        },
        {
          ...kept("checkedResult", "GameCache.restoreUnit", restoreNote),
          line: 8,
          column: 6,
        },
        {
          ...kept("checkedResult", "GameCache.restoreUnit", restoreNote),
          line: 11,
          column: 1,
        },
        {
          ...kept("checkedResult", "GameCache.restoreUnit", restoreNote),
          line: 12,
          column: 15,
        },
      ],
    },
    {
      name: "a kept member's result checked in a condition, a ternary, && and ||, == null and typeof",
      code: `${cacheHeader}declare const spare: Unit;\nif (cache.restoreUnit("m", "a", owner, 0, 0, 0)) {\n  print("a");\n}\nconst b = cache.restoreUnit("m", "b", owner, 0, 0, 0) ? 1 : 0;\ncache.restoreUnit("m", "c", owner, 0, 0, 0) && print("c");\nconst d = cache.restoreUnit("m", "d", owner, 0, 0, 0) || spare;\nif (cache.restoreUnit("m", "e", owner, 0, 0, 0) == null) {\n  print("e");\n}\nif (typeof cache.restoreUnit("m", "f", owner, 0, 0, 0) === "undefined") {\n  print("f");\n}`,
      output: null,
      errors: [
        { line: 5, column: 5 },
        { line: 8, column: 11 },
        { line: 9, column: 1 },
        { line: 10, column: 11 },
        { line: 11, column: 5 },
        { line: 14, column: 12 },
      ].map((position) => ({
        ...kept("checkedResult", "GameCache.restoreUnit", restoreNote),
        ...position,
      })),
    },
    {
      name: "a kept member's result in a variable annotated with the old type",
      code: `${cacheHeader}const hero: unit = cache.restoreUnit("m", "k", owner, 0, 0, 0);\nlet other: unit = cache.restoreUnit("m", "n", owner, 0, 0, 0);\nother = hero;`,
      output: null,
      errors: [
        {
          ...kept("oldResult", "GameCache.restoreUnit", restoreNote),
          line: 4,
          column: 20,
        },
        {
          ...kept("oldResult", "GameCache.restoreUnit", restoreNote),
          line: 5,
          column: 19,
        },
      ],
    },
    {
      name: "a kept member's result passed where the old type was taken",
      code: `${cacheHeader}const hero = Unit.fromHandle(cache.restoreUnit("m", "k", owner, 0, 0, 0));`,
      output: null,
      errors: [
        {
          ...kept("oldResult", "GameCache.restoreUnit", restoreNote),
          line: 4,
          column: 30,
        },
      ],
    },
    {
      name: "removed exports have no fix and no suggestion",
      code: 'import { hookedMain, W3TS_HOOK } from "reforged-ts";\nprint(hookedMain, W3TS_HOOK);',
      output: null,
      errors: [
        {
          ...removed(
            "hookedMain",
            "The old Hook code is gone; use the Init stages.",
          ),
          suggestions: [],
        },
        {
          ...removed("W3TS_HOOK", "The enum of the deprecated alias is gone."),
          suggestions: [],
        },
      ],
    },
  ],
});

describe("no-legacy-w3ts-names in the recommended config", () => {
  it("is an error", () => {
    const [message] = lintWithRecommended(
      `${header}MapPlayer.create(0);`,
    ).filter((each) => each.ruleId === "reforged/no-legacy-w3ts-names");
    expect(message.severity).toBe(2);
  });

  it("can be silenced on one line with a reason", () => {
    expect(
      lintWithRecommended(
        `${header}// eslint-disable-next-line reforged/no-legacy-w3ts-names -- migrated in the next change\nMapPlayer.create(0);`,
      ).filter((each) => each.ruleId?.startsWith("reforged/")),
    ).toEqual([]);
  });
});
