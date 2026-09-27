import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { main as pruneMain } from "../scripts/prune.mts";
import { type CutSteps, main as versionMain } from "../scripts/version.mts";
import { isLabel, prune, readVersions, retain } from "../scripts/versions.mts";
import { readText, writeText } from "./support/workspace.mts";

let site: string;

beforeEach(async () => {
  site = await mkdtemp(join(tmpdir(), "reforged-website-versions-"));
});

afterEach(async () => {
  await rm(site, { recursive: true, force: true });
});

function capture() {
  const out = { stdout: "", stderr: "" };
  return {
    out,
    output: {
      stdout: (text: string) => (out.stdout += text),
      stderr: (text: string) => (out.stderr += text),
    },
  };
}

/**
 * A fixture site with the cut versions `versions`, newest first as
 * Docusaurus lists them, each with its docs tree and its sidebars.
 */
async function cutSite(versions: readonly string[]): Promise<void> {
  await writeText(site, "versions.json", `${JSON.stringify(versions)}\n`);
  for (const label of versions) {
    await addVersionFiles(label);
  }
}

async function addVersionFiles(label: string): Promise<void> {
  await writeText(
    site,
    `versioned_docs/version-${label}/index.mdx`,
    `# ${label}\n`,
  );
  await writeText(
    site,
    `versioned_sidebars/version-${label}-sidebars.json`,
    "{}\n",
  );
}

/** The labels of the versions whose docs tree and sidebars are on disk. */
async function onDisk(): Promise<{ docs: string[]; sidebars: string[] }> {
  const docs = await readdir(join(site, "versioned_docs"));
  const sidebars = await readdir(join(site, "versioned_sidebars"));
  return {
    docs: docs.map((dir) => dir.replace(/^version-/, "")).sort(),
    sidebars: sidebars
      .map((file) => file.replace(/^version-(.+)-sidebars\.json$/, "$1"))
      .sort(),
  };
}

describe("the retention rule", () => {
  it("keeps the last three minors of each major, newest first", () => {
    expect(
      retain(["1.3", "2.0", "1.10", "1.2", "0.9", "1.1", "2.1", "0.10"]),
    ).toEqual({
      kept: ["2.1", "2.0", "1.10", "1.3", "1.2", "0.10", "0.9"],
      pruned: ["1.1"],
    });
  });

  it("never removes the newest version", () => {
    for (const versions of [
      ["1.0"],
      ["1.4", "1.3", "1.2", "1.1", "1.0"],
      ["2.0", "1.9", "1.8", "1.7", "1.6"],
    ]) {
      expect(retain(versions).kept[0]).toBe(versions[0]);
    }
  });

  it("refuses a version that is not a label, naming it", () => {
    expect(() => retain(["1.0", "v1.1"])).toThrow(
      "`v1.1` is not a docs version label",
    );
  });
});

describe("a label", () => {
  it("is the library's major.minor", () => {
    expect(["1.0", "0.99", "10.2"].filter(isLabel)).toEqual([
      "1.0",
      "0.99",
      "10.2",
    ]);
    expect(
      ["1", "1.0.0", "v1.0", "01.0", "1.01", "next", "1.0-alpha", ""].filter(
        isLabel,
      ),
    ).toEqual([]);
  });
});

describe("prune", () => {
  it("removes the docs tree and the sidebars of each version it does not keep", async () => {
    await cutSite(["1.4", "1.3", "0.9", "1.2", "1.1", "0.8"]);

    const retention = await prune(site);

    expect(retention).toEqual({
      kept: ["1.4", "1.3", "1.2", "0.9", "0.8"],
      pruned: ["1.1"],
    });
    expect(await onDisk()).toEqual({
      docs: ["0.8", "0.9", "1.2", "1.3", "1.4"],
      sidebars: ["0.8", "0.9", "1.2", "1.3", "1.4"],
    });
    expect(await readText(site, "versions.json")).toBe(
      `${JSON.stringify(["1.4", "1.3", "1.2", "0.9", "0.8"], null, 2)}\n`,
    );
  });

  it("changes nothing before the first cut", async () => {
    expect(await prune(site)).toEqual({ kept: [], pruned: [] });
    expect(await readdir(site)).toEqual([]);
  });
});

describe("docs:prune", () => {
  it("runs alone and applies the same rule", async () => {
    await cutSite(["2.3", "2.2", "2.1", "2.0"]);
    const { out, output } = capture();

    expect(await pruneMain([], output, site)).toBe(0);

    expect(out.stdout).toBe("docs:prune: kept 2.3, 2.2, 2.1; removed 2.0.\n");
    expect(await readVersions(site)).toEqual(["2.3", "2.2", "2.1"]);
    expect((await onDisk()).docs).toEqual(["2.1", "2.2", "2.3"]);
  });

  it("fails naming a version of versions.json that is not a label", async () => {
    await cutSite(["1.0.0"]);
    const { out, output } = capture();

    expect(await pruneMain([], output, site)).toBe(1);

    expect(out.stderr).toContain("`1.0.0` is not a docs version label");
  });
});

describe("docs:version", () => {
  /** A cut whose Docusaurus step adds the version as Docusaurus does. */
  function steps(calls: string[], docusaurusExit = 0): CutSteps {
    return {
      site,
      collect: () => {
        calls.push("collect");
        return Promise.resolve(0);
      },
      docusaurusVersion: async (label) => {
        calls.push(`docusaurus docs:version ${label}`);
        if (docusaurusExit !== 0) return docusaurusExit;
        const versions = await readVersions(site);
        await writeText(
          site,
          "versions.json",
          `${JSON.stringify([label, ...versions], null, 2)}\n`,
        );
        await addVersionFiles(label);
        return 0;
      },
    };
  }

  it("collects, cuts with Docusaurus, then prunes to three minors per major", async () => {
    await cutSite(["1.2", "1.1", "1.0"]);
    const calls: string[] = [];
    const { out, output } = capture();

    expect(await versionMain(["1.3"], output, steps(calls))).toBe(0);

    expect(calls).toEqual(["collect", "docusaurus docs:version 1.3"]);
    expect(await readVersions(site)).toEqual(["1.3", "1.2", "1.1"]);
    expect(await onDisk()).toEqual({
      docs: ["1.1", "1.2", "1.3"],
      sidebars: ["1.1", "1.2", "1.3"],
    });
    expect(out.stdout).toBe("docs:prune: kept 1.3, 1.2, 1.1; removed 1.0.\n");
  });

  it("refuses a label that is not major.minor, with a message", async () => {
    for (const label of ["1.0.0", "v1.0", "next"]) {
      const calls: string[] = [];
      const { out, output } = capture();

      expect(await versionMain([label], output, steps(calls))).toBe(2);

      expect(out.stderr).toContain(
        `\`${label}\` is not a docs version label: a label is the library's major.minor, such as 1.0`,
      );
      expect(calls).toEqual([]);
    }
  });

  it("needs exactly one label", async () => {
    for (const args of [[], ["1.0", "1.1"]]) {
      const calls: string[] = [];
      const { out, output } = capture();

      expect(await versionMain(args, output, steps(calls))).toBe(2);

      expect(out.stderr).toMatch(/^Usage: docs:version <label>/);
    }
  });

  it("refuses a version cut already", async () => {
    await cutSite(["1.1", "1.0"]);
    const calls: string[] = [];
    const { out, output } = capture();

    expect(await versionMain(["1.0"], output, steps(calls))).toBe(1);

    expect(out.stderr).toContain("1.0 is cut already");
    expect(calls).toEqual([]);
  });

  it("refuses a version the retention rule would remove at once", async () => {
    await cutSite(["1.4", "1.3", "1.2"]);
    const calls: string[] = [];
    const { out, output } = capture();

    expect(await versionMain(["1.1"], output, steps(calls))).toBe(1);

    expect(out.stderr).toContain(
      "1.1 would be removed at once: the site keeps the last three minors of each major, and 1.4, 1.3, 1.2 are newer.",
    );
    expect(calls).toEqual([]);
  });

  it("stops without pruning when Docusaurus fails", async () => {
    await cutSite(["1.2", "1.1", "1.0"]);
    const calls: string[] = [];
    const { out, output } = capture();

    expect(await versionMain(["1.3"], output, steps(calls, 1))).toBe(1);

    expect(out.stderr).toContain("Docusaurus could not cut 1.3");
    expect(await readVersions(site)).toEqual(["1.2", "1.1", "1.0"]);
    expect((await onDisk()).docs).toEqual(["1.0", "1.1", "1.2"]);
  });
});
