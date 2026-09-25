import { describe, expect, it } from "vitest";

import { lintWithRecommended } from "../support/lint.js";
import { ruleOf } from "../support/plugin.js";
import { createRuleTester } from "../support/rule-tester.js";

const ruleTester = createRuleTester();

const table = "const t: Record<string, number> = { a: 1, b: 2 };\n";

ruleTester.run("no-unordered-iteration", ruleOf("no-unordered-iteration"), {
  valid: [
    {
      name: "for...of over a Map, and its keys, values, entries and forEach",
      code: "const m = new Map<string, number>([['a', 1]]);\nfor (const [k, v] of m) print(k, v);\nfor (const k of m.keys()) print(k);\nfor (const v of m.values()) print(v);\nfor (const e of m.entries()) print(e);\nm.forEach((v, k) => print(k, v));",
    },
    {
      name: "for...of over a Set, and its forEach",
      code: "const s = new Set<string>(['a']);\nfor (const x of s) print(x);\ns.forEach((x) => print(x));",
    },
    {
      name: "for...of over an array, forEach and a numeric loop",
      code: "const a = [1, 2, 3];\nfor (const x of a) print(x);\na.forEach((x) => print(x));\nfor (let i = 0; i < a.length; i++) print(a[i]);",
    },
    {
      name: "ipairs",
      code: "const a = [1, 2, 3];\nfor (const [i, x] of ipairs(a)) print(i, x);",
    },
    {
      name: "other Object statics",
      code: "const o = Object.freeze({ a: 1 });\nObject.assign({}, o);",
    },
    {
      name: "a project binding named Object",
      code: "export function f(Object: { keys(o: object): string[] }): string[] {\n  return Object.keys({});\n}",
    },
    {
      name: "project functions named pairs and next",
      code: "export function pairs(o: object): object[] {\n  return [o];\n}\nexport function next(o: object): object {\n  return o;\n}\npairs({});\nnext({});",
    },
    {
      name: "an iterator's next method",
      code: "const it = [1, 2][Symbol.iterator]();\nit.next();",
    },
  ],
  invalid: [
    {
      name: "for...in",
      code: `${table}for (const k in t) print(k);`,
      errors: [{ messageId: "forIn", line: 2, column: 1 }],
    },
    ...["keys", "values", "entries"].map((method) => ({
      name: `Object.${method}`,
      code: `${table}Object.${method}(t).forEach((x) => print(x));`,
      errors: [
        {
          messageId: "objectIteration" as const,
          data: { method },
          line: 2,
          column: 1,
        },
      ],
    })),
    {
      name: "a string-keyed member",
      code: `${table}Object["keys"](t);`,
      errors: [{ messageId: "objectIteration", data: { method: "keys" } }],
    },
    {
      name: "pairs, reported once at the call",
      code: `${table}for (const [k, v] of pairs(t)) print(k, v);`,
      errors: [
        {
          messageId: "luaIteration",
          data: { name: "pairs" },
          line: 2,
          column: 22,
        },
      ],
    },
    {
      name: "next",
      code: `${table}const [k] = next(t);\nprint(k);`,
      errors: [{ messageId: "luaIteration", data: { name: "next" } }],
    },
    {
      name: "for...of over a LuaTable",
      code: "const t = new LuaTable<string, number>();\nfor (const [k, v] of t) print(k, v);",
      errors: [
        {
          messageId: "pairsForOf",
          data: { type: "LuaTable<string, number>" },
          line: 2,
        },
      ],
    },
    {
      name: "for...of over a LuaMap, a LuaSet and their read-only forms",
      code: "declare const m: LuaMap<string, number>;\ndeclare const s: LuaSet<string>;\ndeclare const rm: ReadonlyLuaMap<string, number>;\ndeclare const rs: ReadonlyLuaSet<string>;\nfor (const e of m) print(e);\nfor (const x of s) print(x);\nfor (const e of rm) print(e);\nfor (const x of rs) print(x);",
      errors: [
        {
          messageId: "pairsForOf",
          data: { type: "LuaMap<string, number>" },
          line: 5,
        },
        { messageId: "pairsForOf", data: { type: "LuaSet<string>" }, line: 6 },
        {
          messageId: "pairsForOf",
          data: { type: "ReadonlyLuaMap<string, number>" },
          line: 7,
        },
        {
          messageId: "pairsForOf",
          data: { type: "ReadonlyLuaSet<string>" },
          line: 8,
        },
      ],
    },
    {
      name: "for...of over a union with a LuaSet",
      code: "declare const s: LuaSet<string> | string[];\nfor (const x of s) print(x);",
      errors: [{ messageId: "pairsForOf", line: 2 }],
    },
  ],
});

describe("no-unordered-iteration through the recommended config", () => {
  it("reports for...in as a warning", () => {
    expect(
      lintWithRecommended(`${table}for (const k in t) print(k);`),
    ).toMatchObject([
      {
        ruleId: "reforged/no-unordered-iteration",
        severity: 1,
        messageId: "forIn",
      },
    ]);
  });

  it("honours an eslint-disable-next-line escape with a reason", () => {
    expect(
      lintWithRecommended(
        `${table}// eslint-disable-next-line reforged/no-unordered-iteration -- only sums the values, order does not matter\nfor (const k in t) print(k);`,
      ),
    ).toEqual([]);
  });
});
