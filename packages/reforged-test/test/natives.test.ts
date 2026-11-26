import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  commonDeclarations,
  NATIVES_FILE,
  nativesSource,
  typingsPatch,
} from "../scripts/natives.mts";

// The Drift check of runner/map/natives.ts, the names `stubNative` and
// `newHandle` are typed with: the committed file is what the generator
// emits from the Typings of their newest Patch. On a new Patch it fails
// until `pnpm --filter reforged-test natives:generate` has run.

describe("runner/map/natives.ts", () => {
  const patch = typingsPatch();
  const generated = nativesSource(patch, commonDeclarations(patch));

  it("is what the generator emits from the Typings: run pnpm --filter reforged-test natives:generate", () => {
    expect(readFileSync(NATIVES_FILE, "utf8")).toBe(generated);
  });

  it("names the Natives of common.j, and no function of blizzard.j or common.ai", () => {
    expect(generated).toContain('  | "GetUnitName"\n');
    expect(generated).toContain('  | "BlzGetLocale"\n');
    expect(generated).not.toContain('"BJDebugMsg"');
    expect(generated).not.toContain('"StartThread"');
  });

  it("names the Handle types of common.j, the base one included", () => {
    expect(generated).toContain("  handle: handle;\n");
    expect(generated).toContain("  unit: unit;\n");
    expect(generated).toContain("  framehandle: framehandle;\n");
  });

  it("refuses declarations that hold no Native", () => {
    expect(() => nativesSource(patch, "declare const x: number;\n")).toThrow(
      "found 0 Natives and 0 Handle types in common.j.d.ts; its declarations changed form",
    );
  });
});

describe("the package's dependencies", () => {
  it("hold neither the Built-in objects nor the library", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ) as Record<string, Record<string, string> | undefined>;
    const names = [
      "dependencies",
      "peerDependencies",
      "optionalDependencies",
      "devDependencies",
    ].flatMap((field) => Object.keys(manifest[field] ?? {}));
    expect(names).not.toContain("reforged-builtins");
    expect(names).not.toContain("reforged-ts");
  });
});
