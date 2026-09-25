// The data files: their shape is checked at plugin load, and every Native
// they name resolves in the installed Typings.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import banList from "../data/unsafe-natives.json" with { type: "json" };
import { createPlugin, DataFileError } from "../src/index.js";
import { installedNatives } from "./support/typings.js";

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
    expect(() => createPlugin({ files: { unsafeNatives: file } })).toThrow(
      DataFileError,
    );
    expect(() => createPlugin({ files: { unsafeNatives: file } })).toThrow(
      `${file}: ${message}`,
    );
  });

  it("loads a well-formed file", () => {
    const file = dataFile("unsafe-natives.json", JSON.stringify([entry]));
    expect(
      createPlugin({ files: { unsafeNatives: file } }).rules,
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
