import { describe, expect, it } from "vitest";

import { lintWithRecommended } from "../support/lint.js";
import { ruleOf } from "../support/plugin.js";
import { createRuleTester } from "../support/rule-tester.js";

const ruleTester = createRuleTester();

ruleTester.run("no-self-recursion", ruleOf("no-self-recursion"), {
  valid: [
    {
      name: "calls to other functions",
      code: "function f(n: number): number {\n  return g(n);\n}\nfunction g(n: number): number {\n  return n;\n}",
    },
    {
      name: "a self-call inside a nested function",
      code: 'import { Timer } from "reforged-ts";\nexport function tick(): void {\n  Timer.after(1, () => tick());\n  const again = function () {\n    tick();\n  };\n  again();\n}',
    },
    {
      name: "a parameter shadowing the function's name",
      code: "export function f(f: () => void): void {\n  f();\n}",
    },
    {
      name: "a local shadowing the function's name",
      code: "export function f(): void {\n  const f = (): void => undefined;\n  f();\n}",
    },
    {
      name: "an arrow bound by let (not covered)",
      code: "export let f = (n: number): number => (n > 0 ? f(n - 1) : 0);",
    },
    {
      name: "the same method name on another object",
      code: "export class Node {\n  constructor(readonly child?: Node) {}\n  visit(): void {\n    this.child?.visit();\n  }\n}",
    },
    {
      name: "this.m() inside a callback of the method",
      code: "export class Poller {\n  poll(): void {\n    [1].forEach(() => this.poll());\n  }\n}",
    },
    {
      name: "a static call through another class",
      code: "class A {\n  static m(): void {}\n}\nexport class B {\n  static m(): void {\n    A.m();\n  }\n}",
    },
  ],
  invalid: [
    {
      name: "a function declaration",
      code: "export function fact(n: number): number {\n  return n <= 1 ? 1 : n * fact(n - 1);\n}",
      errors: [
        {
          messageId: "selfRecursion",
          data: { name: "fact" },
          line: 2,
          column: 27,
        },
      ],
    },
    {
      name: "a named function expression",
      code: "export const walk = function visit(n: number): void {\n  if (n > 0) visit(n - 1);\n};",
      errors: [
        { messageId: "selfRecursion", data: { name: "visit" }, line: 2 },
      ],
    },
    {
      name: "an anonymous function expression bound by const",
      code: "export const walk = function (n: number): void {\n  if (n > 0) walk(n - 1);\n};",
      errors: [{ messageId: "selfRecursion", data: { name: "walk" }, line: 2 }],
    },
    {
      name: "an arrow bound by const, each call",
      code: "export const fib = (n: number): number =>\n  n < 2 ? n : fib(n - 1) + fib(n - 2);",
      errors: [
        {
          messageId: "selfRecursion",
          data: { name: "fib" },
          line: 2,
          column: 15,
        },
        {
          messageId: "selfRecursion",
          data: { name: "fib" },
          line: 2,
          column: 28,
        },
      ],
    },
    {
      name: "a class method through this",
      code: "export class Tree {\n  depth(n: number): number {\n    return n > 0 ? this.depth(n - 1) : 0;\n  }\n}",
      errors: [
        { messageId: "selfRecursion", data: { name: "depth" }, line: 3 },
      ],
    },
    {
      name: "a static method through its class",
      code: "export class Tree {\n  static depth(n: number): number {\n    return n > 0 ? Tree.depth(n - 1) : 0;\n  }\n}",
      errors: [
        { messageId: "selfRecursion", data: { name: "depth" }, line: 3 },
      ],
    },
    {
      name: "a private method",
      code: "export class Tree {\n  #depth(n: number): number {\n    return n > 0 ? this.#depth(n - 1) : 0;\n  }\n  depth(): number {\n    return this.#depth(3);\n  }\n}",
      errors: [
        { messageId: "selfRecursion", data: { name: "depth" }, line: 3 },
      ],
    },
    {
      name: "an object literal method",
      code: "export const tree = {\n  depth(n: number): number {\n    return n > 0 ? this.depth(n - 1) : 0;\n  },\n};",
      errors: [
        { messageId: "selfRecursion", data: { name: "depth" }, line: 3 },
      ],
    },
  ],
});

describe("no-self-recursion through the recommended config", () => {
  const code =
    "export function fact(n: number): number {\n  return n <= 1 ? 1 : n * fact(n - 1);\n}";

  it("reports self-recursion as a warning", () => {
    expect(lintWithRecommended(code)).toMatchObject([
      {
        ruleId: "reforged/no-self-recursion",
        severity: 1,
        messageId: "selfRecursion",
      },
    ]);
  });

  it("honours an eslint-disable-next-line escape with a reason", () => {
    expect(
      lintWithRecommended(
        "export function fact(n: number): number {\n  // eslint-disable-next-line reforged/no-self-recursion -- n is at most 12\n  return n <= 1 ? 1 : n * fact(n - 1);\n}",
      ),
    ).toEqual([]);
  });
});
