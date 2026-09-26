import { createHash } from "node:crypto";
import { access, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  actionlintAsset,
  ACTIONLINT_VERSION,
  type ActionlintAsset,
  type Fetcher,
} from "../src/actionlint.js";
import { main, type Context } from "../src/cli/actionlint.js";
import type { Command } from "../src/process.js";
import { tempDir, writeText } from "./support/workspace.js";

const ARCHIVE = Buffer.from("the actionlint release archive");

/** An asset whose pinned checksum is the one of `ARCHIVE`. */
function asset(sha256 = createHash("sha256").update(ARCHIVE).digest("hex")) {
  return {
    version: "9.9.9",
    url: "https://github.com/rhysd/actionlint/releases/download/v9.9.9/actionlint_9.9.9_os_arch.zip",
    archive: "actionlint_9.9.9_os_arch.zip",
    sha256,
    executable: "actionlint.exe",
  } satisfies ActionlintAsset;
}

/** A download that answers every request with `body` and `status`. */
function fakeFetch(body: Uint8Array = ARCHIVE, status = 200) {
  const urls: string[] = [];
  const fetcher: Fetcher = (url) => {
    urls.push(url);
    return Promise.resolve(new Response(body, { status }));
  };
  return { urls, fetcher };
}

/**
 * A runner that extracts like tar (the member is the archive's bytes) and
 * answers every other command, actionlint, with `code`.
 */
function fakeRun(code = 0) {
  const commands: Command[] = [];
  const run = async (command: Command) => {
    commands.push(command);
    if (basename(command.command).startsWith("tar")) {
      const [, archive, , into, member] = command.args;
      await writeFile(join(into, member), await readFile(archive));
      return 0;
    }
    return code;
  };
  return { commands, run };
}

async function exists(path: string): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false,
  );
}

async function context(overrides: Partial<Context> = {}): Promise<Context> {
  const root = await tempDir("actionlint");
  const bin = await tempDir("actionlint-path");
  await writeText(bin, "shellcheck", "");
  await writeText(bin, "shellcheck.exe", "");
  return {
    root,
    cwd: root,
    env: { PATH: bin },
    asset: asset(),
    fetcher: fakeFetch().fetcher,
    run: fakeRun().run,
    ...overrides,
  };
}

async function runCli(context: Context, args: string[] = []) {
  let stdout = "";
  let stderr = "";
  const status = await main(
    args,
    {
      stdout: (text) => (stdout += text),
      stderr: (text) => (stderr += text),
    },
    context,
  );
  return { status, stdout, stderr };
}

const cached = (root: string) =>
  join(
    root,
    "node_modules",
    ".cache",
    "actionlint",
    "actionlint_9.9.9_os_arch",
    "actionlint.exe",
  );

describe("actionlintAsset", () => {
  it("pins the release archive of each platform with its checksum", () => {
    const base = `https://github.com/rhysd/actionlint/releases/download/v${ACTIONLINT_VERSION}`;
    expect(actionlintAsset("win32", "x64")).toEqual({
      version: ACTIONLINT_VERSION,
      url: `${base}/actionlint_${ACTIONLINT_VERSION}_windows_amd64.zip`,
      archive: `actionlint_${ACTIONLINT_VERSION}_windows_amd64.zip`,
      sha256: expect.stringMatching(/^[0-9a-f]{64}$/) as unknown,
      executable: "actionlint.exe",
    });
    expect(actionlintAsset("linux", "x64")).toEqual({
      version: ACTIONLINT_VERSION,
      url: `${base}/actionlint_${ACTIONLINT_VERSION}_linux_amd64.tar.gz`,
      archive: `actionlint_${ACTIONLINT_VERSION}_linux_amd64.tar.gz`,
      sha256: expect.stringMatching(/^[0-9a-f]{64}$/) as unknown,
      executable: "actionlint",
    });
    expect(actionlintAsset("darwin", "arm64")?.archive).toBe(
      `actionlint_${ACTIONLINT_VERSION}_darwin_arm64.tar.gz`,
    );
  });

  it("has none for a platform actionlint publishes no build for", () => {
    expect(actionlintAsset("aix", "ppc64")).toBeUndefined();
    expect(actionlintAsset("linux", "s390x")).toBeUndefined();
  });
});

describe("actionlint", () => {
  it("downloads, verifies and caches the pinned build, then runs it on the arguments", async () => {
    const download = fakeFetch();
    const runner = fakeRun();
    const ctx = await context({ fetcher: download.fetcher, run: runner.run });

    expect(await runCli(ctx, [".github/workflows/ci.yml"])).toEqual({
      status: 0,
      stdout: "actionlint 9.9.9: no problem found.\n",
      stderr: "",
    });
    expect(download.urls).toEqual([asset().url]);
    expect(await readFile(cached(ctx.root))).toEqual(ARCHIVE);
    expect(runner.commands.at(-1)).toEqual({
      command: cached(ctx.root),
      args: [".github/workflows/ci.yml"],
      cwd: ctx.cwd,
    });
  });

  it("runs the cached build without downloading it again", async () => {
    const ctx = await context();
    await runCli(ctx);
    const download = fakeFetch();
    const runner = fakeRun();

    await runCli({ ...ctx, fetcher: download.fetcher, run: runner.run });

    expect(download.urls).toEqual([]);
    expect(runner.commands.map(({ command }) => command)).toEqual([
      cached(ctx.root),
    ]);
  });

  it("drops the `--` that separates the arguments from pnpm's own", async () => {
    const runner = fakeRun();
    const ctx = await context({ run: runner.run });
    await runCli(ctx, ["--", "-color", "a.yml"]);
    expect(runner.commands.at(-1)?.args).toEqual(["-color", "a.yml"]);
  });

  it("exits with actionlint's code when it finds a problem", async () => {
    const ctx = await context({ run: fakeRun(1).run });
    expect(await runCli(ctx)).toEqual({ status: 1, stdout: "", stderr: "" });
  });

  it("refuses an archive whose checksum is not the pinned one, and caches nothing", async () => {
    const pinned = "0".repeat(64);
    const runner = fakeRun();
    const ctx = await context({ asset: asset(pinned), run: runner.run });
    const actual = createHash("sha256").update(ARCHIVE).digest("hex");

    expect(await runCli(ctx)).toEqual({
      status: 1,
      stdout: "",
      stderr:
        `The checksum of ${asset().url} is ${actual}, not the pinned ${pinned}: ` +
        "the download is not the release actionlint published. Nothing was run.\n",
    });
    expect(runner.commands).toEqual([]);
    expect(await exists(cached(ctx.root))).toBe(false);
  });

  it("names the download that failed", async () => {
    const ctx = await context({ fetcher: fakeFetch(ARCHIVE, 404).fetcher });
    expect(await runCli(ctx)).toEqual({
      status: 1,
      stdout: "",
      stderr: `Downloading ${asset().url} failed: HTTP 404. Nothing was run.\n`,
    });
  });

  it("names the platform it has no pinned build for", async () => {
    const ctx = await context({ asset: undefined });
    expect(await runCli(ctx)).toEqual({
      status: 1,
      stdout: "",
      stderr: expect.stringContaining(
        `No actionlint ${ACTIONLINT_VERSION} build is pinned for ${process.platform} ${process.arch}`,
      ) as unknown,
    });
  });

  it("says the shell scripts go unchecked when shellcheck is not on the PATH", async () => {
    const ctx = await context({ env: { PATH: await tempDir("empty-path") } });
    expect(await runCli(ctx)).toEqual({
      status: 0,
      stdout: "actionlint 9.9.9: no problem found.\n",
      stderr:
        "shellcheck is not on the PATH: the run: scripts are not checked here, CI checks them.\n",
    });
  });
});
