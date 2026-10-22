import { describe, expect, it } from "vitest";
import { packagesDiagram } from "../src/diagram-packages.js";
import { writeWorkspace, type FixturePackage } from "./support/workspace.js";

const render = async (packages: readonly FixturePackage[]) =>
  packagesDiagram.render(await writeWorkspace(packages));

describe("the packages diagram", () => {
  it("draws the published and the private packages apart, their dependencies and peers, and the external nodes", async () => {
    const mermaid = await render([
      {
        dir: "packages/lib",
        name: "lib",
        fields: {
          dependencies: { types: "workspace:^", lodash: "^4.0.0" },
          peerDependencies: { harness: "workspace:^", typescript: "^6" },
          peerDependenciesMeta: { harness: { optional: true } },
          devDependencies: { tooling: "workspace:^" },
        },
      },
      { dir: "packages/types", name: "types" },
      { dir: "packages/harness", name: "harness" },
      {
        dir: "tooling",
        name: "tooling",
        private: true,
        fields: { peerDependencies: { types: "workspace:^" } },
      },
      {
        dir: "site",
        name: "site",
        private: true,
        fields: {
          dependencies: { lib: "workspace:^" },
          devDependencies: { harness: "workspace:^" },
        },
      },
    ]);

    expect(mermaid).toBe(
      "```mermaid\n" +
        "flowchart LR\n" +
        "  %% diagram: packages\n" +
        "  %% Generated from each workspace package's dependencies and peerDependencies; devDependencies are left out.\n" +
        '  subgraph published["Published packages"]\n' +
        '    harness["harness"]\n' +
        '    lib["lib"]\n' +
        '    types["types"]\n' +
        "  end\n" +
        '  subgraph private["Private packages"]\n' +
        '    site["site"]\n' +
        '    tooling["tooling"]\n' +
        "  end\n" +
        '  map_project(["Map project"])\n' +
        '  template(["Template: phmilk/reforged-ts-template"])\n' +
        '  lib -.->|"optional peer"| harness\n' +
        "  lib --> types\n" +
        "  site --> lib\n" +
        '  tooling -.->|"peer"| types\n' +
        '  map_project -->|"starts from"| template\n' +
        '  template -->|"builds every release before it is published (Template gate)"| published\n' +
        "```\n",
    );
  });

  it("refuses two packages whose names give one node id", async () => {
    await expect(
      render([
        { dir: "packages/a", name: "my-lib" },
        { dir: "packages/b", name: "my_lib" },
      ]),
    ).rejects.toThrow("my_lib and my-lib share the Mermaid id my_lib.");
    await expect(
      render([{ dir: "packages/t", name: "template" }]),
    ).rejects.toThrow(
      "template and the reserved id template share the Mermaid id template.",
    );
  });
});
