import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli/generate.js";
import { entry, writeFixture } from "./support/fixture.js";

const fixture = fileURLToPath(new URL("./fixtures/cli/", import.meta.url));

async function runCli(args: string[]) {
  let stdout = "";
  let stderr = "";
  const status = await main(args, {
    stdout: (text) => (stdout += text),
    stderr: (text) => (stderr += text),
  });
  return { status, stdout, stderr };
}

describe("typings:generate", () => {
  it("writes the files and exits zero when there are warnings only", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "reforged-types-out-"));

    const { status, stdout, stderr } = await runCli([
      join(fixture, "patch"),
      join(fixture, "overlay"),
      outDir,
    ]);

    expect(status).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toBe(
      [
        "Generated 3 files for Patch 3.0.0.24268.",
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
    ]);
    expect(
      await readFile(join(outDir, "3.0.0", "common.j.d.ts"), "utf8")
    ).toContain(
      "declare function CreateUnit(id: player, unitid: number, x: number, y: number, face: number): unit | undefined;"
    );
  });

  it("prints the checklist, writes nothing and exits non-zero on errors", async () => {
    const { patchDir, overlayDir } = await writeFixture(
      {
        "common.j":
          "native A takes nothing returns nothing\nnative B takes integer n returns nothing\nbogus\n",
      },
      [entry("common.j", "B", ["m"]), entry("common.j", "Gone")]
    );
    const outDir = await mkdtemp(join(tmpdir(), "reforged-types-out-"));

    const { status, stdout, stderr } = await runCli([
      patchDir,
      overlayDir,
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

  it("rejects more than three arguments", async () => {
    const { status, stderr } = await runCli(["a", "b", "c", "d"]);

    expect(status).toBe(2);
    expect(stderr).toContain(
      "Usage: typings:generate [patchDir] [overlayDir] [outDir]"
    );
  });
});
