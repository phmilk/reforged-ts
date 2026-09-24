import { appendFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import { main as check } from "../src/cli/check.js";
import { main as generate } from "../src/cli/generate.js";
import { entry, writeFixture } from "./support/fixture.js";

const fixture = fileURLToPath(new URL("./fixtures/cli/", import.meta.url));
const vendorDir = join(fixture, "vendor");
const overlayDir = join(fixture, "overlay");

/** The folder options of both commands. */
const options = (vendor: string, overlay: string, out: string) => [
  "--vendor",
  vendor,
  "--overlay",
  overlay,
  "--out",
  out,
];

async function run(
  command: typeof check,
  args: string[]
): Promise<{ status: number; stdout: string; stderr: string }> {
  let stdout = "";
  let stderr = "";
  const status = await command(args, {
    stdout: (text) => (stdout += text),
    stderr: (text) => (stderr += text),
  });
  return { status, stdout, stderr };
}

const DRIFT =
  "not match what the sources and the Overlay generate. " +
  "Run `pnpm --filter reforged-types typings:generate` and commit the result.";

describe("typings:check", () => {
  /** The committed output: what `typings:generate` wrote. */
  let outDir: string;

  beforeEach(async () => {
    outDir = await mkdtemp(join(tmpdir(), "reforged-types-committed-"));
    const generated = await run(generate, options(vendorDir, overlayDir, outDir));
    expect(generated.status).toBe(0);
  });

  it("passes when the committed output is what generation produces", async () => {
    const { status, stdout, stderr } = await run(check, options(vendorDir, overlayDir, outDir));

    expect(status).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toBe(
      "Typings match: 6 files of Patch 3.0.0.24268 are exactly what the sources and the Overlay generate.\n"
    );
  });

  it("fails naming a committed output file that was edited", async () => {
    await appendFile(join(outDir, "3.0.0", "common.j.d.ts"), "// edited\n");

    const { status, stdout, stderr } = await run(check, options(vendorDir, overlayDir, outDir));

    expect(status).toBe(1);
    expect(stdout).toBe("");
    expect(stderr).toBe(
      `Typings drift: 1 file does ${DRIFT}\n\n` +
        "- [ ] 3.0.0/common.j.d.ts: differs from the generated file\n"
    );
  });

  it.each([
    ["the entry", "3.0.0.d.ts"],
    ["async-natives.json", "async-natives.json"],
    ["the manifest", "3.0.0/manifest.json"],
  ])("fails naming %s when it was edited", async (_, path) => {
    await appendFile(join(outDir, path), " ");

    const { status, stderr } = await run(check, options(vendorDir, overlayDir, outDir));

    expect(status).toBe(1);
    expect(stderr).toBe(
      `Typings drift: 1 file does ${DRIFT}\n\n` +
        `- [ ] ${path}: differs from the generated file\n`
    );
  });

  it("names a data artefact that is missing", async () => {
    await rm(join(outDir, "async-natives.json"));

    const { status, stderr } = await run(check, options(vendorDir, overlayDir, outDir));

    expect(status).toBe(1);
    expect(stderr).toContain(
      "- [ ] async-natives.json: generated but not committed\n"
    );
  });

  it("treats a line-ending change as drift", async () => {
    const file = join(outDir, "3.0.0", "common.ai.d.ts");
    await writeFile(file, (await readFile(file, "utf8")).replace(/\n/g, "\r\n"));

    const { status, stderr } = await run(check, options(vendorDir, overlayDir, outDir));

    expect(status).toBe(1);
    expect(stderr).toContain(
      "- [ ] 3.0.0/common.ai.d.ts: differs from the generated file\n"
    );
  });

  it("names each missing and extra file", async () => {
    await rm(join(outDir, "3.0.0", "blizzard.j.d.ts"));
    await writeFile(join(outDir, "3.0.0", "stale.d.ts"), "");
    // Files at the package root are not generated output of a folder.
    await writeFile(join(outDir, "package.json"), "{}");

    const { status, stderr } = await run(check, options(vendorDir, overlayDir, outDir));

    expect(status).toBe(1);
    expect(stderr).toBe(
      `Typings drift: 2 files do ${DRIFT}\n\n` +
        "- [ ] 3.0.0/blizzard.j.d.ts: generated but not committed\n" +
        "- [ ] 3.0.0/stale.d.ts: committed but no longer generated\n"
    );
  });

  it("fails with the generator's checklist when generation fails", async () => {
    const broken = await writeFixture(
      { "common.j": "native A takes nothing returns nothing\n" },
      [entry("common.j", "B")]
    );

    const { status, stdout, stderr } = await run(check, options(broken.vendorDir, broken.overlayDir, outDir));

    expect(status).toBe(1);
    expect(stdout).toBe("");
    expect(stderr).toBe(
      [
        "Generation failed: 1 error, 1 warning. Nothing was compared.",
        "",
        "Errors (1):",
        "- [ ] common.j: no Overlay entry for native A takes nothing returns nothing; expected common.j/functions/A.json",
        "",
        "Warnings (1):",
        "- [ ] common.j/functions/B.json: orphan Overlay entry, common.j of Patch 3.0.0.24268 declares no B",
        "",
      ].join("\n")
    );
  });

  it.each([
    ["a positional argument", ["Reforged-v3.0.0.24268-w3-3a9d8f2"]],
    ["an unknown option", ["--patch", "x"]],
  ])("rejects %s", async (_case, args) => {
    const { status, stderr } = await run(check, args);

    expect(status).toBe(2);
    expect(stderr).toBe(
      "Usage: typings:check [--vendor <dir>] [--overlay <dir>] [--out <dir>]\n"
    );
  });
});
