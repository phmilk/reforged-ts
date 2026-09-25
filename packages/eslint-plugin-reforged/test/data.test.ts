// The data files: their shape is checked at plugin load, and every Native
// they name resolves in the installed Typings.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import creationNatives from "../data/creation-natives.json" with { type: "json" };
import localSafe from "../data/local-safe.json" with { type: "json" };
import banList from "../data/unsafe-natives.json" with { type: "json" };
import {
  isRegistrationType,
  returnedHandleType,
} from "../src/classify/handle.js";
import { createPlugin, DataFileError } from "../src/index.js";
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

describe("the allowlist (data/local-safe.json)", () => {
  const entry = { name: "BlzFrameSetText", kind: "text", reason: "r." };

  it.each([
    ["not an array", "{}", "the root must be an array"],
    ["an entry not an object", "[null]", "[0] must be an object"],
    [
      "a missing kind",
      JSON.stringify([entry, { name: "SetCameraField", reason: "r." }]),
      '[1].kind must be one of "visual", "text"',
    ],
    [
      "an unknown kind",
      JSON.stringify([{ ...entry, kind: "sound" }]),
      '[0].kind must be one of "visual", "text"',
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
      "a name listed twice",
      JSON.stringify([entry, entry]),
      '[1].name must be unique ("BlzFrameSetText" is listed twice)',
    ],
    ["invalid JSON", "[{", "the content must be valid JSON"],
  ])("throws at load for %s, naming the field", (_, content, message) => {
    const file = dataFile("local-safe.json", content);
    expect(() => createPlugin({ files: { localSafe: file } })).toThrow(
      DataFileError,
    );
    expect(() => createPlugin({ files: { localSafe: file } })).toThrow(
      `${file}: ${message}`,
    );
  });

  it("loads a well-formed file", () => {
    const file = dataFile("local-safe.json", JSON.stringify([entry]));
    expect(createPlugin({ files: { localSafe: file } }).rules).toHaveProperty(
      "no-percent-in-display-strings",
    );
  });

  it("gives every entry a non-empty reason and a known kind", () => {
    for (const each of localSafe) {
      expect(each.reason.trim(), each.name).not.toBe("");
      expect(["visual", "text"], each.name).toContain(each.kind);
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
    expect(() => createPlugin({ files: { creationNatives: file } })).toThrow(
      `${file}: ${message}`,
    );
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
