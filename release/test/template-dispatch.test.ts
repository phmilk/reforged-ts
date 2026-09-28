import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli/template-dispatch.js";
import { awaitOnNpm, templateDispatch } from "../src/template-dispatch.js";
import {
  publishEntry,
  publishPlan,
  writePackDir,
} from "./support/publish-plan.js";
import { PACKAGES, tempDir, writeWorkspace } from "./support/workspace.js";

const RAW = "https://raw.githubusercontent.com/phmilk/reforged-ts";

const entry = (name: string, version: string) =>
  publishEntry(name, version, "next");

/** A `changeset pack` output folder whose plan publishes `entries`. */
const packDir = (...entries: unknown[]) => writePackDir(publishPlan(entries));

/** The fixture workspace, each package at the version `versions` gives. */
function workspace(versions: Readonly<Record<string, string>>) {
  return writeWorkspace(
    PACKAGES.map((pkg) =>
      pkg.name in versions
        ? { ...pkg, fields: { version: versions[pkg.name] } }
        : pkg,
    ),
  );
}

const ON_NPM = {
  "reforged-ts": "1.0.0-alpha.2",
  "reforged-types": "1.0.0-alpha.1",
  "reforged-test": "1.0.0-alpha.1",
  "eslint-plugin-reforged": "1.0.0-alpha.1",
};

describe("templateDispatch", () => {
  it("dispatches a library release under its tag, with every package's version", async () => {
    const root = await workspace({ ...ON_NPM, "reforged-ts": "1.0.0-alpha.3" });
    const pack = await packDir(entry("reforged-ts", "1.0.0-alpha.3"));

    expect(await templateDispatch(pack, root)).toEqual({
      event_type: "reforged-ts-release",
      client_payload: {
        tag: "reforged-ts@1.0.0-alpha.3",
        versions: {
          "reforged-ts": "1.0.0-alpha.3",
          "reforged-types": "1.0.0-alpha.1",
          "reforged-test": "1.0.0-alpha.1",
          "eslint-plugin-reforged": "1.0.0-alpha.1",
        },
        contextUrl: `${RAW}/reforged-ts@1.0.0-alpha.3/CONTEXT.md`,
        matrixUrl: `${RAW}/reforged-ts@1.0.0-alpha.3/release/compatibility/matrix.md`,
        llmsUrl: "https://phmilk.github.io/reforged-ts/docs/next/llms.txt",
      },
    });
  });

  it("dispatches a release without the library under the Typings' tag, first of the four", async () => {
    const root = await workspace({
      "reforged-ts": "1.2.0",
      "reforged-types": "1.3.0",
      "reforged-test": "1.1.1",
      "eslint-plugin-reforged": "1.2.0",
    });
    const pack = await packDir(
      entry("reforged-test", "1.1.1"),
      entry("reforged-types", "1.3.0"),
    );

    expect((await templateDispatch(pack, root)).client_payload).toEqual({
      tag: "reforged-types@1.3.0",
      versions: {
        "reforged-ts": "1.2.0",
        "reforged-types": "1.3.0",
        "reforged-test": "1.1.1",
        "eslint-plugin-reforged": "1.2.0",
      },
      contextUrl: `${RAW}/reforged-types@1.3.0/CONTEXT.md`,
      matrixUrl: `${RAW}/reforged-types@1.3.0/release/compatibility/matrix.md`,
      llmsUrl: "https://phmilk.github.io/reforged-ts/docs/1.2/llms.txt",
    });
  });

  it("refuses a plan that publishes none of the four packages", async () => {
    const root = await workspace(ON_NPM);
    await expect(templateDispatch(await packDir(), root)).rejects.toThrow(
      "The publish plan publishes none of reforged-ts, reforged-types, reforged-test, eslint-plugin-reforged: there is no release to dispatch.",
    );
  });

  it("refuses a workspace without one of the four packages, naming it", async () => {
    const root = await writeWorkspace(
      PACKAGES.filter(({ name }) => name !== "reforged-test"),
    );
    const pack = await packDir(entry("reforged-ts", "1.0.0"));
    await expect(templateDispatch(pack, root)).rejects.toThrow(
      "Neither the publish plan nor the workspace has reforged-test.",
    );
  });

  it("refuses a library version that names no docs version", async () => {
    const root = await workspace({ ...ON_NPM, "reforged-ts": "next" });
    const pack = await packDir(entry("reforged-types", "1.0.0-alpha.2"));
    await expect(templateDispatch(pack, root)).rejects.toThrow(
      "reforged-ts next is not a semantic version: it names no docs version for the llmsUrl.",
    );
  });
});

/**
 * A registry answering the install metadata of each package with the
 * versions `shown` lists for it, the `n`th time it is asked (the last list
 * from then on); `asked` counts the requests.
 */
function registry(shown: Readonly<Record<string, readonly string[][]>>) {
  const asked = new Map<string, number>();
  const fetcher: typeof fetch = (input, init) => {
    const url = typeof input === "string" ? input : (input as URL).href;
    const name = decodeURIComponent(url.split("/").at(-1) ?? "");
    const n = asked.get(name) ?? 0;
    asked.set(name, n + 1);
    expect(new Headers(init?.headers).get("accept")).toBe(
      "application/vnd.npm.install-v1+json",
    );
    const lists = shown[name] ?? [];
    const versions = lists[Math.min(n, lists.length - 1)] ?? [];
    return Promise.resolve(
      versions.length === 0
        ? new Response("{}", { status: 404 })
        : Response.json({
            name,
            versions: Object.fromEntries(versions.map((v) => [v, {}])),
          }),
    );
  };
  return { fetcher, asked };
}

describe("awaitOnNpm", () => {
  const RELEASED = {
    "reforged-ts": "1.0.0-alpha.3",
    "reforged-types": "1.0.0-alpha.1",
  };

  it("waits until the registry lists every version", async () => {
    const { fetcher, asked } = registry({
      "reforged-ts": [
        ["1.0.0-alpha.2"],
        ["1.0.0-alpha.2"],
        ["1.0.0-alpha.2", "1.0.0-alpha.3"],
      ],
      "reforged-types": [["1.0.0-alpha.1"]],
    });
    const slept: number[] = [];

    await awaitOnNpm(RELEASED, {
      fetcher,
      sleep: (ms) => {
        slept.push(ms);
        return Promise.resolve();
      },
      timeoutMs: 60_000,
      intervalMs: 15_000,
    });

    expect(slept).toEqual([15_000, 15_000]);
    expect(asked.get("reforged-ts")).toBe(3);
  });

  it("fails naming the versions npm still lacks once the time is up", async () => {
    const { fetcher } = registry({
      "reforged-ts": [["1.0.0-alpha.2"]],
      "reforged-types": [],
    });
    await expect(
      awaitOnNpm(RELEASED, {
        fetcher,
        sleep: () => Promise.resolve(),
        timeoutMs: 60_000,
        intervalMs: 15_000,
      }),
    ).rejects.toThrow(
      "npm does not list reforged-ts@1.0.0-alpha.3, reforged-types@1.0.0-alpha.1 after 1 minute: " +
        "the Template's sync would install the versions before them. " +
        "Re-run this job once `npm view <package>@<version>` answers.",
    );
  });
});

describe("release:template-dispatch", () => {
  async function runCli(
    args: string[],
    root: string,
    cwd: string,
    env: Record<string, string> = {},
    fetcher: typeof fetch = () => {
      throw new Error("The registry is not asked without --await-npm.");
    },
  ) {
    let stdout = "";
    let stderr = "";
    const slept: number[] = [];
    const status = await main(
      args,
      {
        stdout: (text) => (stdout += text),
        stderr: (text) => (stderr += text),
      },
      {
        cwd,
        root,
        env,
        fetcher,
        sleep: (ms) => {
          slept.push(ms);
          return Promise.resolve();
        },
      },
    );
    return { status, stdout, stderr };
  }

  it("writes the request body to the out file, and the payload to stdout and the job summary", async () => {
    const root = await workspace({ ...ON_NPM, "reforged-ts": "1.0.0-alpha.3" });
    const pack = await packDir(entry("reforged-ts", "1.0.0-alpha.3"));
    const cwd = await tempDir("cwd");
    const summary = join(cwd, "summary.md");

    const result = await runCli(
      ["--pack-dir", pack, "--out", "dispatch.json"],
      root,
      cwd,
      { GITHUB_STEP_SUMMARY: summary },
    );

    const body = await templateDispatch(pack, root);
    const payload = JSON.stringify(body.client_payload, null, 2);
    expect(result).toEqual({
      status: 0,
      stdout: `reforged-ts-release, tag reforged-ts@1.0.0-alpha.3:\n${payload}\n`,
      stderr: "",
    });
    expect(
      JSON.parse(await readFile(join(cwd, "dispatch.json"), "utf8")),
    ).toEqual(body);
    expect(await readFile(summary, "utf8")).toBe(
      "## Template dispatch\n\n" +
        "`reforged-ts-release` to phmilk/reforged-ts-template, tag `reforged-ts@1.0.0-alpha.3`:\n\n" +
        `\`\`\`json\n${payload}\n\`\`\`\n`,
    );
  });

  it("with --await-npm, writes the body once npm lists every version, and fails without writing it when the time is up", async () => {
    const root = await workspace({ ...ON_NPM, "reforged-ts": "1.0.0-alpha.3" });
    const pack = await packDir(entry("reforged-ts", "1.0.0-alpha.3"));
    const listed = registry({
      "reforged-ts": [["1.0.0-alpha.2"], ["1.0.0-alpha.2", "1.0.0-alpha.3"]],
      "reforged-types": [["1.0.0-alpha.1"]],
      "reforged-test": [["1.0.0-alpha.1"]],
      "eslint-plugin-reforged": [["1.0.0-alpha.1"]],
    });
    const cwd = await tempDir("cwd");
    const args = [
      "--pack-dir",
      pack,
      "--out",
      "dispatch.json",
      "--await-npm",
      "1",
    ];

    expect(await runCli(args, root, cwd, {}, listed.fetcher)).toMatchObject({
      status: 0,
    });
    expect(listed.asked.get("reforged-ts")).toBe(2);
    expect(
      JSON.parse(await readFile(join(cwd, "dispatch.json"), "utf8")),
    ).toEqual(await templateDispatch(pack, root));

    const late = await tempDir("cwd");
    const unlisted = registry({ "reforged-ts": [["1.0.0-alpha.2"]] });
    expect(await runCli(args, root, late, {}, unlisted.fetcher)).toEqual({
      status: 1,
      stdout: "",
      stderr: expect.stringContaining(
        "npm does not list reforged-ts@1.0.0-alpha.3, reforged-types@1.0.0-alpha.1",
      ) as unknown,
    });
    await expect(readFile(join(late, "dispatch.json"))).rejects.toThrow();
  });

  it("exits 1 on a plan it cannot dispatch and 2 on bad arguments", async () => {
    const root = await workspace(ON_NPM);
    const cwd = await tempDir("cwd");
    expect(
      await runCli(
        ["--pack-dir", await tempDir("empty"), "--out", "dispatch.json"],
        root,
        cwd,
      ),
    ).toMatchObject({
      status: 1,
      stderr: expect.stringContaining(
        "Cannot read the publish plan",
      ) as unknown,
    });
    for (const args of [
      [],
      ["--pack-dir", "pack"],
      ["--out", "x", "--out", "y"],
      ["--pack-dir", "pack", "--out", "x", "--await-npm", "0"],
      ["--pack-dir", "pack", "--out", "x", "--await-npm", "soon"],
    ]) {
      expect(await runCli(args, root, cwd)).toMatchObject({
        status: 2,
        stderr:
          "Usage: release:template-dispatch --pack-dir <dir> --out <file> [--await-npm <minutes>]\n",
      });
    }
  });
});
