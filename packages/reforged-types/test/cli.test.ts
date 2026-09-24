import { cp, mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { main, type Network } from "../src/cli/generate.js";
import { jassHistoryFetcher } from "./support/fetcher.js";
import {
  entry,
  globalEntry,
  writeFixture,
  writeOverlay,
} from "./support/fixture.js";

const fixture = fileURLToPath(new URL("./fixtures/cli/", import.meta.url));

const NO_NETWORK: Network = {
  fetcher: async (url) => {
    throw new Error(`no fetch expected, got ${url}`);
  },
};

async function runCli(args: string[], network = NO_NETWORK) {
  let stdout = "";
  let stderr = "";
  const status = await main(
    args,
    {
      stdout: (text) => (stdout += text),
      stderr: (text) => (stderr += text),
    },
    network
  );
  return { status, stdout, stderr };
}

const tempDir = (name: string) =>
  mkdtemp(join(tmpdir(), `reforged-types-${name}-`));

beforeEach(() => {
  // Any attempt to reach the network fails the test.
  vi.stubGlobal("fetch", () => {
    throw new Error("tests must not open a network connection");
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("typings:generate", () => {
  it("writes the files and exits zero when there are warnings only", async () => {
    const outDir = await tempDir("out");

    const { status, stdout, stderr } = await runCli([
      "--vendor",
      join(fixture, "vendor"),
      "--overlay",
      join(fixture, "overlay"),
      "--out",
      outDir,
    ]);

    expect(status).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toBe(
      [
        "Generated 6 files for Patch 3.0.0.24268.",
        "",
        "Warnings (1):",
        "- [ ] common.j/functions/RequestExtraBooleanData.json: orphan Overlay entry, common.j of Patch 3.0.0.24268 declares no RequestExtraBooleanData",
        "",
      ].join("\n")
    );
    expect((await readdir(join(outDir, "3.0.0"))).sort()).toEqual([
      "blizzard.j.d.ts",
      "common.ai.d.ts",
      "common.j.d.ts",
      "manifest.json",
    ]);
    expect((await readdir(outDir)).sort()).toEqual([
      "3.0.0",
      "3.0.0.d.ts",
      "async-natives.json",
    ]);
    expect(
      await readFile(join(outDir, "3.0.0", "common.j.d.ts"), "utf8")
    ).toContain(
      "declare function CreateUnit(id: player, unitid: number, x: number, y: number, face: number): unit | undefined;"
    );
  });

  it("prints the checklist, writes nothing and exits non-zero on errors", async () => {
    const { vendorDir, overlayDir } = await writeFixture(
      {
        "common.j":
          "native A takes nothing returns nothing\nnative B takes integer n returns nothing\nbogus\n",
      },
      [entry("common.j", "B", ["m"]), entry("common.j", "Gone")]
    );
    const outDir = await tempDir("out");

    const { status, stdout, stderr } = await runCli([
      "--vendor",
      vendorDir,
      "--overlay",
      overlayDir,
      "--out",
      outDir,
    ]);

    expect(status).toBe(1);
    expect(stdout).toBe("");
    expect(stderr).toBe(
      [
        "Generation failed: 3 errors, 1 warning. No file was written.",
        "",
        "Errors (3):",
        "- [ ] common.j:3: unknown line: bogus",
        "- [ ] common.j: no Overlay entry for native A takes nothing returns nothing; expected common.j/functions/A.json",
        "- [ ] common.j/functions/B.json: parameters do not match the Patch: native B takes integer n returns nothing; Overlay has (m)",
        "",
        "Warnings (1):",
        "- [ ] common.j/functions/Gone.json: orphan Overlay entry, common.j of Patch 3.0.0.24268 declares no Gone",
        "",
      ].join("\n")
    );
    expect(await readdir(outDir)).toEqual([]);
  });

  it("prints each missing entry with its source, name, Jass signature and the Overlay file to write", async () => {
    const { vendorDir, overlayDir } = await writeFixture({
      "common.j": [
        "type unit extends handle",
        "globals",
        "    constant integer bj_MAX_PLAYERS = 24",
        "endglobals",
        "constant native GetUnitX takes unit whichUnit returns real",
      ].join("\n"),
      "blizzard.j":
        "function BJDebugMsg takes string msg returns nothing\nendfunction\n",
      "common.ai": "native DebugS takes string str returns nothing\n",
    });

    const { status, stderr } = await runCli([
      "--vendor",
      vendorDir,
      "--overlay",
      overlayDir,
    ]);

    expect(status).toBe(1);
    const items = stderr.split("\n").filter((line) => line.startsWith("- [ ]"));
    expect(items).toEqual([
      "- [ ] common.j: no Overlay entry for global constant integer bj_MAX_PLAYERS = 24; expected common.j/globals/bj_MAX_PLAYERS.json",
      "- [ ] common.j: no Overlay entry for constant native GetUnitX takes unit whichUnit returns real; expected common.j/functions/GetUnitX.json",
      "- [ ] blizzard.j: no Overlay entry for function BJDebugMsg takes string msg returns nothing; expected blizzard.j/functions/BJDebugMsg.json",
      "- [ ] common.ai: no Overlay entry for native DebugS takes string str returns nothing; expected common.ai/functions/DebugS.json",
    ]);
    // Each item names the source file, the declaration as Jass writes it
    // (kind, name, parameters, return type or global type and initializer)
    // and the entry file to create, so an entry is drafted from the line.
    for (const item of items) {
      const [, source, name, path] =
        /^- \[ \] ([\w.]+): no Overlay entry for (?:.* )?(\w+)(?: takes .*| = .*); expected (.+)$/.exec(
          item
        )!;
      expect(path).toBe(`${source}/${path!.split("/")[1]}/${name}.json`);
      expect(["functions", "globals"]).toContain(path!.split("/")[1]);
    }
  });

  it.each([
    ["two positional arguments", ["a", "b"]],
    ["an unknown option", ["--patch", "x"]],
    ["an option without its value", ["--vendor"]],
  ])("rejects %s", async (_case, args) => {
    const { status, stderr } = await runCli(args);

    expect(status).toBe(2);
    expect(stderr).toBe(
      "Usage: typings:generate [tag] [--vendor <dir>] [--overlay <dir>] [--out <dir>]\n"
    );
  });
});

describe("typings:generate <tag>", () => {
  const TAG = "Reforged-v9.9.9.12345-w3-fixture";
  const COMMIT = "0123456789abcdef0123456789abcdef01234567";
  const network: Network = {
    fetcher: jassHistoryFetcher({
      [TAG]: {
        commit: COMMIT,
        folder: fileURLToPath(
          new URL(
            `./fixtures/jass-history/${COMMIT}/timeline/scripts/`,
            import.meta.url
          )
        ),
      },
    }),
    now: new Date("2026-09-25T12:00:00Z"),
  };

  /** A vendor folder holding the CLI fixture's 3.0.0.24268, and its Overlay. */
  async function vendoredOnce() {
    const vendorDir = await tempDir("vendor");
    const overlayDir = await tempDir("overlay");
    const outDir = await tempDir("out");
    await cp(join(fixture, "vendor"), vendorDir, { recursive: true });
    await cp(join(fixture, "overlay"), overlayDir, { recursive: true });
    const folders = ["--vendor", vendorDir, "--overlay", overlayDir];
    return { vendorDir, overlayDir, outDir, folders: [...folders, "--out", outDir] };
  }

  it("vendors the tag, then prints what the new Patch adds and the checklist of its missing entries", async () => {
    const { vendorDir, outDir, folders } = await vendoredOnce();

    const { status, stdout, stderr } = await runCli([TAG, ...folders], network);

    expect(status).toBe(1);
    expect((await readdir(vendorDir)).sort()).toEqual([
      "3.0.0.24268",
      "9.9.9.12345",
    ]);
    expect(stdout).toBe(
      [
        `Vendored ${TAG}: Patch 9.9.9.12345 at commit ${COMMIT}.`,
        "In Patch 9.9.9.12345 and not in Patch 3.0.0.24268 (4):",
        "- common.j:4: native GetTriggerUnit takes nothing returns unit",
        "- blizzard.j:2: global integer bj_forLoopAIndex = 0",
        "- blizzard.j:5: function TriggerRegisterAnyUnitEventBJ takes nothing returns nothing",
        "- common.ai:2: native DebugS takes string str returns nothing",
        "",
        "",
      ].join("\n")
    );
    expect(stderr).toBe(
      [
        "Generation failed: 4 errors, 1 warning. No file was written.",
        "",
        "Errors (4):",
        "- [ ] common.j: no Overlay entry for native GetTriggerUnit takes nothing returns unit; expected common.j/functions/GetTriggerUnit.json",
        "- [ ] blizzard.j: no Overlay entry for global integer bj_forLoopAIndex = 0; expected blizzard.j/globals/bj_forLoopAIndex.json",
        "- [ ] blizzard.j: no Overlay entry for function TriggerRegisterAnyUnitEventBJ takes nothing returns nothing; expected blizzard.j/functions/TriggerRegisterAnyUnitEventBJ.json",
        "- [ ] common.ai: no Overlay entry for native DebugS takes string str returns nothing; expected common.ai/functions/DebugS.json",
        "",
        "Warnings (1):",
        "- [ ] common.j/functions/RequestExtraBooleanData.json: orphan Overlay entry, common.j of Patches 3.0.0.24268 and 9.9.9.12345 declares no RequestExtraBooleanData",
        "",
      ].join("\n")
    );
    expect(await readdir(outDir)).toEqual([]);
  });

  it("regenerates every vendored Patch without a tag once the checklist is curated", async () => {
    const { overlayDir, outDir, folders } = await vendoredOnce();
    await runCli([TAG, ...folders], network);
    await writeOverlay(overlayDir, [
      { ...entry("common.j", "GetTriggerUnit", [], true), since: "9.9.9.12345" },
      globalEntry("blizzard.j", "bj_forLoopAIndex", false, { since: "9.9.9.12345" }),
      entry("blizzard.j", "TriggerRegisterAnyUnitEventBJ"),
      entry("common.ai", "DebugS", ["str"]),
    ]);

    const { status, stdout, stderr } = await runCli(folders);

    expect(stderr).toBe("");
    expect(status).toBe(0);
    expect(stdout).toContain(
      "Generated 11 files for Patches 3.0.0.24268 and 9.9.9.12345.\n"
    );
    expect((await readdir(outDir)).sort()).toEqual([
      "3.0.0",
      "3.0.0.d.ts",
      "9.9.9",
      "9.9.9.d.ts",
      "async-natives.json",
    ]);
    expect(
      await readFile(join(outDir, "9.9.9", "common.j.d.ts"), "utf8")
    ).toContain("@patch 9.9.9.12345");
  });

  it("fails without generating when the tag cannot be vendored", async () => {
    const { folders } = await vendoredOnce();

    const { status, stdout, stderr } = await runCli(
      ["Reforged-v9.9.9.99999-w3-missing", ...folders],
      network
    );

    expect(status).toBe(1);
    expect(stdout).toBe("");
    expect(stderr).toMatch(
      /^Vendoring Reforged-v9\.9\.9\.99999-w3-missing failed: GET .* 422/
    );
  });
});

describe("typings:generate on the vendored 3.0.0.24268 tag", () => {
  const packageRoot = fileURLToPath(new URL("../", import.meta.url));
  const committed = join(packageRoot, "vendor", "3.0.0.24268");

  it("vendors the same bytes again and regenerates the committed output unchanged", async () => {
    const provenance = JSON.parse(
      await readFile(join(committed, "provenance.json"), "utf8")
    );
    const vendorDir = await tempDir("vendor");
    const outDir = await tempDir("out");
    await cp(committed, join(vendorDir, "3.0.0.24268"), { recursive: true });

    const { status, stdout } = await runCli(
      [
        provenance.tag,
        "--vendor",
        vendorDir,
        "--overlay",
        join(packageRoot, "overlay"),
        "--out",
        outDir,
      ],
      {
        fetcher: jassHistoryFetcher({
          [provenance.tag]: { commit: provenance.commit, folder: committed },
        }),
        // A later day: re-vendoring the same bytes keeps the recorded date.
        now: new Date("2031-01-01T00:00:00Z"),
      }
    );

    expect(status).toBe(0);
    expect(stdout).toBe(
      `Vendored ${provenance.tag}: Patch 3.0.0.24268 at commit ${provenance.commit}, unchanged.\n` +
        "Generated 6 files for Patch 3.0.0.24268.\n"
    );
    for (const name of await readdir(committed)) {
      expect(
        (await readFile(join(vendorDir, "3.0.0.24268", name))).equals(
          await readFile(join(committed, name))
        ),
        name
      ).toBe(true);
    }
    for (const path of [
      "3.0.0/common.j.d.ts",
      "3.0.0/blizzard.j.d.ts",
      "3.0.0/common.ai.d.ts",
      "3.0.0/manifest.json",
      "3.0.0.d.ts",
      "async-natives.json",
    ]) {
      expect(
        (await readFile(join(outDir, path))).equals(
          await readFile(join(packageRoot, path))
        ),
        path
      ).toBe(true);
    }
  }, 60_000);
});
