import { describe, expect, it } from "vitest";
import { generate } from "../src/index.js";
import { entry, writeFixture } from "./support/fixture.js";

async function run(...args: Parameters<typeof writeFixture>) {
  return generate(await writeFixture(...args));
}

describe("generate: reserved words", () => {
  it("suffixes a reserved parameter name in the declaration and keeps the Jass name in the header", async () => {
    const result = await run(
      {
        "common.j": [
          "type unit extends handle",
          "native Remove takes unit delete, integer default, boolean in returns nothing",
        ].join("\n"),
      },
      [entry("common.j", "Remove", ["delete", "default?", "in?"])],
    );

    expect(result.ok).toBe(true);
    const text = result.ok ? result.files.get("3.0.0/common.j.d.ts")! : "";
    expect(text).toContain(
      [
        " * @param delete - unit",
        " * @param default - integer (32-bit)",
        " * @param in - boolean",
      ].join("\n"),
    );
    expect(text).toContain(
      "declare function Remove(delete_: unit, default_?: number, in_?: boolean): void;",
    );
    expect(result.diagnostics).toEqual([]);
  });

  it("keeps an ordinary name that only contains a reserved word", async () => {
    const result = await run(
      {
        "common.j":
          "native F takes integer newX, integer classic returns nothing\n",
      },
      [entry("common.j", "F", ["newX", "classic"])],
    );

    expect(result.ok && result.files.get("3.0.0/common.j.d.ts")).toContain(
      "declare function F(newX: number, classic: number): void;",
    );
  });

  it("fails on a Native named after a reserved word, naming it", async () => {
    const result = await run(
      {
        "common.j":
          "type unit extends handle\nnative delete takes unit u returns nothing\n",
      },
      [entry("common.j", "delete", ["u"])],
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        severity: "error",
        kind: "reserved-name",
        file: "common.j",
        line: 2,
        name: "delete",
        message:
          'common.j:2: native "delete" is a TypeScript reserved word and cannot be declared',
      },
    ]);
  });

  it("fails on a Blizzard.j function named after a reserved word", async () => {
    const result = await run(
      {
        "blizzard.j":
          "function switch takes nothing returns nothing\nendfunction\n",
      },
      [entry("blizzard.j", "switch")],
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.message).toBe(
      'blizzard.j:1: function "switch" is a TypeScript reserved word and cannot be declared',
    );
  });

  it.each(["class", "string", "void", "code", "boolcode"])(
    "fails on a type named %s, naming it",
    async (name) => {
      const result = await run({
        "common.j": `type agent extends handle\ntype ${name} extends agent\n`,
      });

      expect(result.ok).toBe(false);
      expect(result.diagnostics).toEqual([
        {
          severity: "error",
          kind: "reserved-name",
          file: "common.j",
          line: 2,
          name,
          message: `common.j:2: type "${name}" is a TypeScript reserved word or a name the Typings already declare, and cannot be declared`,
        },
      ]);
    },
  );
});

describe("generate: names declared in two source files", () => {
  it("emits both declarations and reports one warning", async () => {
    const result = await run(
      {
        "common.j": "native Shared takes integer a returns nothing\n",
        "common.ai": [
          "native AiOnly takes nothing returns nothing",
          "native Shared takes integer a returns nothing",
        ].join("\n"),
      },
      [
        entry("common.j", "Shared", ["a"]),
        entry("common.ai", "AiOnly"),
        entry("common.ai", "Shared", ["a"]),
      ],
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([
      {
        severity: "warning",
        kind: "duplicate-name",
        file: "common.ai",
        line: 2,
        name: "Shared",
        message:
          "common.ai:2: Shared is also declared in common.j; both are emitted and merge as overloads",
      },
    ]);
    if (!result.ok) return;
    for (const path of ["3.0.0/common.j.d.ts", "3.0.0/common.ai.d.ts"]) {
      expect(result.files.get(path)).toContain(
        "declare function Shared(a: number): void;",
      );
    }
  });
});
