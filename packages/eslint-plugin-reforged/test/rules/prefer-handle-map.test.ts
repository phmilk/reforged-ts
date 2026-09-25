import { describe, expect, it } from "vitest";

import { lintWithRecommended } from "../support/lint.js";
import { ruleOf } from "../support/plugin.js";
import { createRuleTester } from "../support/rule-tester.js";

const ruleTester = createRuleTester();

const prelude = 'import { Effect, Unit } from "reforged-ts";\n';

function error(
  collection: "Map" | "Set",
  wrapper: string,
  output: string,
): {
  messageId: "preferHandleMap";
  data: Record<string, string>;
  suggestions: {
    messageId: "useHandleMap";
    data: Record<string, string>;
    output: string;
  }[];
} {
  const replacement = collection === "Map" ? "HandleMap" : "HandleSet";
  const data = { collection, wrapper, replacement };
  return {
    messageId: "preferHandleMap",
    data,
    suggestions: [{ messageId: "useHandleMap", data, output }],
  };
}

ruleTester.run("prefer-handle-map", ruleOf("prefer-handle-map"), {
  valid: [
    {
      name: "a WeakMap keyed by a Wrapper",
      code: `${prelude}const owners = new WeakMap<Unit, number>();`,
    },
    {
      name: "a WeakSet of a Wrapper",
      code: `${prelude}const seen = new WeakSet<Unit>();`,
    },
    {
      name: "a Map keyed by number",
      code: `${prelude}const byId = new Map<number, Unit>();`,
    },
    {
      name: "a Map keyed by string",
      code: `${prelude}const byName = new Map<string, Unit>();`,
    },
    {
      name: "a Set of strings, inferred",
      code: 'const names = new Set(["a", "b"]);',
    },
    {
      name: "a Map keyed by a project class",
      code: "class Hero {}\nconst levels = new Map<Hero, number>();",
    },
    {
      name: "a Map keyed by a raw handle (not a Wrapper)",
      code: "const lives = new Map<unit, number>();",
    },
    {
      name: "a project class named Map",
      code: `${prelude}class Map<K, V> {\n  constructor(readonly key?: K, readonly value?: V) {}\n}\nconst owners = new Map<Unit, number>();`,
    },
  ],
  invalid: [
    {
      name: "a Map keyed by Unit",
      code: `${prelude}const owners = new Map<Unit, number>();`,
      errors: [
        error(
          "Map",
          "Unit",
          `${prelude}const owners = new HandleMap<Unit, number>();`,
        ),
      ],
    },
    {
      name: "a Set of Unit",
      code: `${prelude}const selected = new Set<Unit>();`,
      errors: [
        error(
          "Set",
          "Unit",
          `${prelude}const selected = new HandleSet<Unit>();`,
        ),
      ],
    },
    {
      name: "a Map whose key type is inferred from the annotation",
      code: `${prelude}const owners: Map<Unit, number> = new Map();`,
      errors: [
        error(
          "Map",
          "Unit",
          `${prelude}const owners: Map<Unit, number> = new HandleMap();`,
        ),
      ],
    },
    {
      name: "a Set inferred from an optional annotation",
      code: `${prelude}let selected: Set<Unit> | undefined;\nselected = new Set();`,
      errors: [
        error(
          "Set",
          "Unit",
          `${prelude}let selected: Set<Unit> | undefined;\nselected = new HandleSet();`,
        ),
      ],
    },
    {
      name: "a Set whose key type is inferred from its entries",
      code: `${prelude}declare const unit: Unit;\nconst selected = new Set([unit]);`,
      errors: [
        error(
          "Set",
          "Unit",
          `${prelude}declare const unit: Unit;\nconst selected = new HandleSet([unit]);`,
        ),
      ],
    },
    {
      name: "a Map keyed by another Wrapper, as a class field",
      code: `${prelude}export class Tracker {\n  readonly effects = new Map<Effect, number>();\n}`,
      errors: [
        error(
          "Map",
          "Effect",
          `${prelude}export class Tracker {\n  readonly effects = new HandleMap<Effect, number>();\n}`,
        ),
      ],
    },
    {
      name: "a Map keyed by a Wrapper subclass or undefined",
      code: `${prelude}class Hero extends Unit {}\nconst levels = new Map<Hero | undefined, number>();`,
      errors: [
        error(
          "Map",
          "Hero",
          `${prelude}class Hero extends Unit {}\nconst levels = new HandleMap<Hero | undefined, number>();`,
        ),
      ],
    },
  ],
});

describe("prefer-handle-map through the recommended config", () => {
  it("reports a Map keyed by a Wrapper as a warning", () => {
    expect(
      lintWithRecommended(
        `${prelude}export const owners = new Map<Unit, number>();`,
      ),
    ).toMatchObject([
      {
        ruleId: "reforged/prefer-handle-map",
        severity: 1,
        messageId: "preferHandleMap",
      },
    ]);
  });

  it("honours an eslint-disable-next-line escape with a reason", () => {
    expect(
      lintWithRecommended(
        `${prelude}// eslint-disable-next-line reforged/prefer-handle-map -- cleared when the round ends\nexport const owners = new Map<Unit, number>();`,
      ),
    ).toEqual([]);
  });
});
