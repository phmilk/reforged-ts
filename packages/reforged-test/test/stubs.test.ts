import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { runLuaTestFiles } from "../src/index.js";
import { outDir, removeOutDirs } from "./support/fixture.js";

afterAll(removeOutDirs);

const stubsDir = fileURLToPath(new URL("../stubs/", import.meta.url));
const shipped = readdirSync(stubsDir).filter((file) => file.endsWith(".lua"));

describe("the baseline stub on a fresh state", () => {
  const [baseline] = runLuaTestFiles({ outDir: outDir("baseline") });

  it.each(
    baseline.tests.map((test) => [
      `${test.suite.join(" > ")} > ${test.name}`,
      test,
    ]),
  )("%s", (_, test) => {
    expect(test).toMatchObject({ status: "pass" });
  });

  it("runs all its checks", () => {
    expect(baseline.error).toBeUndefined();
    expect(baseline.tests).toHaveLength(14);
  });
});

describe("the shipped stub families on a fresh state", () => {
  const families = runLuaTestFiles({ outDir: outDir("families") });
  const tests = families.flatMap((file) => file.tests);

  it.each(
    tests.map((test) => [`${test.suite.join(" > ")} > ${test.name}`, test]),
  )("%s", (_, test) => {
    expect(test).toMatchObject({ status: "pass" });
  });

  it("runs all its checks", () => {
    expect(families.map((file) => file.error)).toEqual([undefined]);
    expect(tests).toHaveLength(39);
  });
});

describe("the test controls of the shipped stubs on a fresh state", () => {
  const [controls] = runLuaTestFiles({ outDir: outDir("controls") });

  it.each(
    controls.tests.map((test) => [
      `${test.suite.join(" > ")} > ${test.name}`,
      test,
    ]),
  )("%s", (_, test) => {
    expect(test).toMatchObject({ status: "pass" });
  });

  it("runs all its checks", () => {
    expect(controls.error).toBeUndefined();
    expect(controls.tests).toHaveLength(17);
  });
});

// The game has none of these; a stub that used one would pass here and
// describe nothing the game can run.
const FORBIDDEN: [string, RegExp][] = [
  ["debug", /\bdebug\s*\./],
  ["require", /\brequire\s*[("']/],
  ["package beyond preload", /\bpackage\s*\.(?!preload\b)/],
  ["io", /\bio\s*\./],
  ["collectgarbage", /\bcollectgarbage\b/],
  ["os.getenv", /\bos\s*\.\s*getenv\b/],
  ["load", /\b(load|loadstring|dofile|loadfile)\s*\(/],
];

describe.each(shipped)("stubs/%s", (file) => {
  const code = readFileSync(join(stubsDir, file), "utf8")
    .replace(/--\[(=*)\[[\s\S]*?\]\1\]/g, "")
    .replace(/--.*$/gm, "");

  it.each(FORBIDDEN)("does not use %s", (_, pattern) => {
    expect(code).not.toMatch(pattern);
  });
});

it("ships the baseline file", () => {
  expect(shipped).toContain("base.lua");
});
