import { describe, expect, it } from "vitest";
import { parseChangeset } from "../src/changesets.js";
import { checkChangeset } from "../src/check-changeset.js";
import { releaseChannel } from "../src/release-channel.js";
import { readPublishablePackages } from "../src/workspace.js";
import { changesetText, writeWorkspace } from "./support/workspace.js";

const packages = await readPublishablePackages(await writeWorkspace());

function check(
  changedFiles: string[],
  ...changesets: Record<string, string>[]
) {
  return checkChangeset({
    packages,
    changedFiles,
    changesets: changesets.map((releases, i) =>
      parseChangeset(`.changeset/c${String(i)}.md`, changesetText(releases)),
    ),
  });
}

describe("checkChangeset", () => {
  it("passes when a changed package is named by a changeset", () => {
    expect(
      check(["packages/reforged-ts/src/index.ts", ".changeset/c0.md"], {
        "reforged-ts": "minor",
      }),
    ).toEqual({ ok: true, changed: ["reforged-ts"], missing: [], refused: [] });
  });

  it("fails naming the package that changed without a changeset", () => {
    expect(check(["packages/reforged-ts/src/index.ts"])).toEqual({
      ok: false,
      changed: ["reforged-ts"],
      missing: ["reforged-ts"],
      refused: [],
    });
  });

  it("names only the changed packages no changeset names", () => {
    expect(
      check(
        [
          "packages/reforged-types/3.0.0.d.ts",
          "packages/reforged-ts/src/index.ts",
          "packages/eslint-plugin-reforged/README.md",
        ],
        { "reforged-types": "patch" },
      ),
    ).toEqual({
      ok: false,
      changed: ["eslint-plugin-reforged", "reforged-ts", "reforged-types"],
      missing: ["eslint-plugin-reforged", "reforged-ts"],
      refused: [],
    });
  });

  it("passes on an empty changeset: the changes publish nothing", () => {
    expect(
      check(
        [
          "packages/reforged-ts/test/node/renames.test.ts",
          "packages/reforged-types/README.md",
        ],
        {},
      ),
    ).toEqual({
      ok: true,
      changed: ["reforged-ts", "reforged-types"],
      missing: [],
      refused: [],
    });
  });

  it("passes when only files outside the publishable packages changed", () => {
    expect(
      check([
        "README.md",
        "docs/adr/0009-independent-semver-with-changesets-and-patch-field.md",
        "website/docs/guides/index.md",
        "release/src/check-changeset.ts",
        "packages/README.md",
        // A sibling folder whose name starts with a package's.
        "packages/reforged-ts-extras/index.ts",
      ]),
    ).toEqual({ ok: true, changed: [], missing: [], refused: [] });
  });

  it("counts a changeset naming the package with no bump", () => {
    expect(
      check(["packages/reforged-test/src/index.ts"], {
        "reforged-test": "none",
      }).ok,
    ).toBe(true);
  });

  it("gives a file to the deepest package holding it", async () => {
    const nested = await readPublishablePackages(
      await writeWorkspace([
        { dir: "packages/outer", name: "outer" },
        { dir: "packages/outer/inner", name: "inner" },
      ]),
    );

    expect(
      checkChangeset({
        packages: nested,
        changedFiles: ["packages/outer/inner/src/index.ts"],
        changesets: [],
      }),
    ).toEqual({
      ok: false,
      changed: ["inner"],
      missing: ["inner"],
      refused: [],
    });
  });
});

describe("checkChangeset: a major changeset and the base's channel", () => {
  const STABLE = "1.2.0";
  const ALPHA = "1.0.0-alpha.23";

  function onBase(
    branch: string,
    versions: Record<string, string>,
    ...changesets: Record<string, string>[]
  ) {
    return checkChangeset({
      packages,
      changedFiles: changesets.map((_, i) => `.changeset/c${String(i)}.md`),
      changesets: changesets.map((releases, i) =>
        parseChangeset(`.changeset/c${String(i)}.md`, changesetText(releases)),
      ),
      channel: releaseChannel(
        branch,
        Object.entries(versions).map(([name, version]) => ({ name, version })),
      ),
    });
  }

  it("refuses on master a major of a package at a stable version, naming the package and its changeset", () => {
    expect(
      onBase(
        "master",
        { "reforged-ts": STABLE, "reforged-types": ALPHA },
        { "reforged-ts": "major", "reforged-types": "major" },
        { "reforged-ts": "minor" },
      ),
    ).toEqual({
      ok: false,
      changed: [],
      missing: [],
      refused: [{ package: "reforged-ts", changeset: ".changeset/c0.md" }],
    });
  });

  it("passes on next a major of a package at a stable version", () => {
    expect(
      onBase(
        "next",
        { "reforged-ts": STABLE, "reforged-types": STABLE },
        { "reforged-ts": "major", "reforged-types": "major" },
      ),
    ).toEqual({ ok: true, changed: [], missing: [], refused: [] });
  });

  it("refuses nothing on master during the build phase", () => {
    expect(
      onBase(
        "master",
        {
          "reforged-ts": ALPHA,
          "reforged-types": ALPHA,
          "reforged-builtins": "0.3.0",
        },
        { "reforged-ts": "major", "reforged-types": "major" },
        { "reforged-builtins": "major" },
      ),
    ).toEqual({ ok: true, changed: [], missing: [], refused: [] });
  });

  it("leaves a major of a package the channel does not know to Changesets", () => {
    expect(
      onBase(
        "master",
        { "reforged-ts": STABLE },
        { "not-in-the-workspace": "major" },
      ).refused,
    ).toEqual([]);
  });

  it("refuses nothing without the base's channel", () => {
    expect(
      checkChangeset({
        packages,
        changedFiles: [".changeset/c0.md"],
        changesets: [
          parseChangeset(
            ".changeset/c0.md",
            changesetText({ "reforged-ts": "major" }),
          ),
        ],
      }).ok,
    ).toBe(true);
  });
});
