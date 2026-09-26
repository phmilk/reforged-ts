import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ChangesetError,
  isChangesetPath,
  parseChangeset,
  readChangesetFolder,
} from "../src/changesets.js";
import { tempDir, writeText } from "./support/workspace.js";

describe("parseChangeset", () => {
  it("reads the packages and bumps of the frontmatter, and the summary", () => {
    expect(
      parseChangeset(
        ".changeset/brave-lions.md",
        '---\n"reforged-ts": major\nreforged-types: patch\n---\n\nRename `Unit`.\n',
      ),
    ).toEqual({
      file: ".changeset/brave-lions.md",
      releases: [
        { name: "reforged-ts", type: "major" },
        { name: "reforged-types", type: "patch" },
      ],
      summary: "Rename `Unit`.",
    });
  });

  it("reads an empty changeset as no release", () => {
    expect(
      parseChangeset(".changeset/quiet-owls.md", "---\n---\n\nDocs only.\n")
        .releases,
    ).toEqual([]);
  });

  it("reads CRLF line endings", () => {
    expect(
      parseChangeset(
        ".changeset/a.md",
        '---\r\n"reforged-ts": minor\r\n---\r\n',
      ).releases,
    ).toEqual([{ name: "reforged-ts", type: "minor" }]);
  });

  it("throws naming the file of a changeset Changesets rejects", () => {
    expect(() =>
      parseChangeset(".changeset/bad.md", '---\n"reforged-ts": huge\n---\n'),
    ).toThrow(ChangesetError);
    expect(() =>
      parseChangeset(".changeset/bad.md", "No frontmatter.\n"),
    ).toThrow(/^\.changeset\/bad\.md: could not parse changeset/);
  });
});

describe("isChangesetPath", () => {
  it.each([
    [".changeset/brave-lions.md", true],
    [".changeset/README.md", false],
    [".changeset/config.json", false],
    [".changeset/pre.json", false],
    [".changeset/pre/brave-lions.md", false],
    ["packages/reforged-ts/.changeset/brave-lions.md", false],
    ["CHANGELOG.md", false],
  ])("%s: %s", (path, expected) => {
    expect(isChangesetPath(path)).toBe(expected);
  });
});

describe("readChangesetFolder", () => {
  it("reads every changeset of the folder but its README, by file name", async () => {
    const root = await tempDir("changesets");
    await writeText(root, "b.md", '---\n"reforged-ts": minor\n---\n\nB.\n');
    await writeText(root, "a.md", "---\n---\n\nA.\n");
    await writeText(root, "README.md", "# Changesets\n");
    await writeText(root, "config.json", "{}\n");
    await writeText(root, "pre/c.md", '---\n"reforged-ts": major\n---\n');

    const changesets = await readChangesetFolder(root);

    expect(
      changesets.map(({ file, releases }) => ({ file, releases })),
    ).toEqual([
      { file: join(root, "a.md"), releases: [] },
      {
        file: join(root, "b.md"),
        releases: [{ name: "reforged-ts", type: "minor" }],
      },
    ]);
  });

  it("reads no changeset from a folder that does not exist", async () => {
    const root = await tempDir("changesets");

    expect(await readChangesetFolder(join(root, "missing"))).toEqual([]);
  });
});
