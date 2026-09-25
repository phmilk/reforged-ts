import { describe, expect, it } from "vitest";
import { readPublishablePackages, repositoryRoot } from "../src/workspace.js";
import { writeWorkspace } from "./support/workspace.js";

describe("readPublishablePackages", () => {
  it("reads the packages that are not private, by name", async () => {
    const root = await writeWorkspace([
      { dir: "packages/zeta", name: "zeta" },
      {
        dir: "packages/alpha",
        name: "alpha",
        fields: { reforged: { patch: "3.0.0.24268" } },
      },
      { dir: "packages/hidden", name: "hidden", private: true },
      { dir: "tools", name: "tools", private: true },
    ]);

    const packages = await readPublishablePackages(root);

    expect(
      packages.map(({ name, version, dir }) => ({ name, version, dir })),
    ).toEqual([
      { name: "alpha", version: "1.0.0", dir: "packages/alpha" },
      { name: "zeta", version: "1.0.0", dir: "packages/zeta" },
    ]);
    expect(packages[0].manifest.reforged).toEqual({ patch: "3.0.0.24268" });
  });

  it("reads the four publishable packages of this repository", async () => {
    const packages = await readPublishablePackages(repositoryRoot);

    expect(packages.map(({ name, dir }) => ({ name, dir }))).toEqual([
      {
        name: "eslint-plugin-reforged",
        dir: "packages/eslint-plugin-reforged",
      },
      { name: "reforged-test", dir: "packages/reforged-test" },
      { name: "reforged-ts", dir: "packages/reforged-ts" },
      { name: "reforged-types", dir: "packages/reforged-types" },
    ]);
  });
});
