// The complete test of the guide "Testing your map" on reforged-test/map is
// an example file the package compiles and runs (examples/welcome.test.ts).
// The guide shows it in a fence until a guide page can include a file: this
// holds the fence to the file, so neither changes alone.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const read = (path: string): string =>
  readFileSync(
    fileURLToPath(new URL(path, import.meta.url)),
    "utf8",
  ).replaceAll("\r\n", "\n");

const FENCE = /```ts title="tests\/lua\/welcome\.test\.ts"\n([\s\S]*?)```/;

describe("the guide's complete test on reforged-test/map", () => {
  it("is the example file welcome.test.ts", () => {
    const guide = read("../../../website/docs/guides/testing-your-map.md");
    expect(FENCE.exec(guide)?.[1]).toBe(read("../examples/welcome.test.ts"));
  });
});
