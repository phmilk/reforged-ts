/** @noSelfInFile */

// The file System through the recorded Preload calls: a write keeps the
// strings `Preload` was given, and a read runs the generated file the way the
// game would, through a `Preloader` override that plays the file's user code:
// the opening string redefines `Preload` to collect what follows, each
// contents string goes through it, and the closing string sets the ability
// icon to what was collected. A written string holding a double quote would
// end the file's string literal early, so the override refuses one.
// That the write methods return nothing is a declaration fixture
// (`negative/file-sleep-no-value.ts`): the lint forbids using their value.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { File } from "../src/index";
import { withNative } from "./support/native-override";

/** The ability whose icon carries a file's contents back. */
const ability = FourCC("Amls");

/** The icon of an ability id never set, as the stubs answer it. */
const defaultIcon = "ReplaceableTextures\\CommandButtons\\BTNTemp.blp";

/** The escape character of the file System's escape scheme. */
const escape = string.char(27);

/** The most bytes one `Preload` call is given. */
const chunkLimit = 259;

/** The strings the last write of `filename` gave `Preload`, or an error. */
function written(filename: string): string[] {
  const strings = __stub_preload_file(filename);
  if (strings === undefined) {
    error(`${filename} was never written`);
  }
  return strings;
}

/**
 * Runs the generated file `filename` as the game would: sets the ability
 * icon to the contents strings joined, when the file opens by collecting them
 * and closes by setting the icon. Leaves the icon alone for a file never
 * written, as the game does for a missing file.
 */
function runGeneratedFile(filename: string): void {
  const strings = __stub_preload_file(filename);
  if (strings === undefined) {
    return;
  }
  const opening = strings.shift();
  const closing = strings.pop();
  if (
    opening === undefined ||
    closing === undefined ||
    !opening.includes("Preload=function(s)o=o..s end")
  ) {
    error(`${filename} does not collect its contents`);
  }
  // string.match returns nil for its capture when the closing has no
  // match, whatever its declared type says.
  const captures: LuaMultiReturn<(string | undefined)[]> = string.match(
    closing,
    "BlzSetAbilityIcon%((%d+),o%)",
  );
  const [id] = captures;
  if (id === undefined) {
    error(`${filename} does not set an ability icon`);
  }
  for (const contents of strings) {
    if (contents.includes('"')) {
      error(`${filename} has a double quote inside a string literal`);
    }
  }
  BlzSetAbilityIcon(tonumber(id) ?? 0, strings.join(""));
}

/** `File.read(filename)` with the generated file run as the game would. */
function readBack(filename: string): string | undefined {
  return withNative("Preloader", runGeneratedFile, () => File.read(filename));
}

/** Writes `contents` and reads them back through the generated file. */
function roundTrip(contents: string): string | undefined {
  File.write("roundtrip.txt", contents);
  return readBack("roundtrip.txt");
}

describe("File.write", () => {
  it("writes the contents between an opening that collects them and a closing that sets the ability icon", () => {
    File.write("hello.txt", "Hello world!");
    const strings = written("hello.txt");
    expect(strings.length).toEqual(3);
    expect(strings[1]).toEqual("Hello world!");
    expect(stubCalls()).toContainCall("PreloadGenClear()");
    expect(stubCalls()).toContainCall("PreloadGenStart()");
    expect(stubCalls()).toContainCall('PreloadGenEnd("hello.txt")');
    expect(strings[2]).toEqual(
      `")\n//! beginusercode\nBlzSetAbilityIcon(${tostring(ability)},o)\n//!endusercode\n//`,
    );
  });

  it("splits contents longer than one Preload call into chunks of at most 259 bytes", () => {
    const contents = string.rep("abcdefghij", 60);
    File.write("long.txt", contents);
    const chunks = written("long.txt").slice(1, -1);
    expect(chunks.map((chunk) => chunk.length)).toEqual([259, 259, 82]);
    expect(chunks.join("")).toEqual(contents);
  });

  it("writes contents of exactly one chunk as one Preload call", () => {
    File.write("exact.txt", string.rep("x", chunkLimit));
    expect(written("exact.txt").length).toEqual(3);
  });
});

describe("File.writeRaw", () => {
  it("writes the contents alone, unescaped, when reading is not allowed", () => {
    const contents = `a "quoted" ${escape} line`;
    File.writeRaw("raw.txt", contents);
    expect(written("raw.txt")).toEqual([contents]);
  });
});

describe("File.read", () => {
  it("round-trips plain text", () => {
    expect(roundTrip("Hello world!")).toEqual("Hello world!");
  });

  it("round-trips double quotes", () => {
    expect(roundTrip('say "hi" and ""')).toEqual('say "hi" and ""');
  });

  it("round-trips backslashes", () => {
    expect(roundTrip("C:\\maps\\save\\")).toEqual("C:\\maps\\save\\");
  });

  it("round-trips the escape character, alone, doubled and before the letter q", () => {
    for (const contents of [
      escape,
      escape + escape,
      `${escape}q`,
      `${escape}${escape}q`,
      `${escape}"q${escape}`,
    ]) {
      expect(roundTrip(contents)).toEqual(contents);
    }
  });

  it("round-trips contents longer than one Preload call, with escapes across a chunk boundary", () => {
    const contents = `${string.rep("a", chunkLimit - 1)}"${string.rep(`\\${escape}"`, 200)}`;
    File.write("chunks.txt", contents);
    expect(written("chunks.txt").length).toEqual(7);
    expect(readBack("chunks.txt")).toEqual(contents);
  });

  it("puts the ability icon back after reading", () => {
    roundTrip("contents");
    expect(BlzGetAbilityIcon(ability)).toEqual(defaultIcon);
  });

  it("returns undefined when the icon is unchanged", () => {
    File.write("unread.txt", "contents");
    expect(File.read("unread.txt")).toBeUndefined();
    expect(stubCalls()).toContainCall('Preloader("unread.txt")');
  });

  it("returns undefined for a file never written", () => {
    expect(readBack("missing.txt")).toBeUndefined();
  });
});
