import { describe, expect, it } from "vitest";
import manifest from "../package.json" with { type: "json" };

// Smoke test for the build and test wiring; the generator tickets replace it.
describe("reforged-types package", () => {
  it("declares the Patch its Typings describe", () => {
    expect(manifest.reforged.patch).toBe("3.0.0.24268");
  });

  it("loads the generator entry point", async () => {
    await expect(import("../src/index.js")).resolves.toBeDefined();
  });
});
