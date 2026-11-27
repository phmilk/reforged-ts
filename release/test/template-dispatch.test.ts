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
  "reforged-map": "1.0.0-alpha.0",
  "reforged-builtins": "1.0.0-alpha.0",
  "reforged-studio": "1.0.0-alpha.0",
};

describe("templateDispatch", () => {
  it("dispatches a library release under its tag, with every package's version, to the Template's main from master", async () => {
    const root = await workspace({ ...ON_NPM, "reforged-ts": "1.0.0-alpha.3" });
    const pack = await packDir(entry("reforged-ts", "1.0.0-alpha.3"));

    expect(await templateDispatch(pack, root, "master")).toEqual({
      event_type: "reforged-ts-release",
      client_payload: {
        tag: "reforged-ts@1.0.0-alpha.3",
        branch: "main",
        versions: {
          "reforged-ts": "1.0.0-alpha.3",
          "reforged-types": "1.0.0-alpha.1",
          "reforged-test": "1.0.0-alpha.1",
          "eslint-plugin-reforged": "1.0.0-alpha.1",
          "reforged-map": "1.0.0-alpha.0",
          "reforged-builtins": "1.0.0-alpha.0",
          "reforged-studio": "1.0.0-alpha.0",
        },
        contextUrl: `${RAW}/reforged-ts@1.0.0-alpha.3/GLOSSARY.md`,
        matrixUrl: `${RAW}/reforged-ts@1.0.0-alpha.3/release/compatibility/matrix.md`,
        llmsUrl: "https://phmilk.github.io/reforged-ts/docs/next/llms.txt",
      },
    });
  });

  it("dispatches a release without the library under the Typings' tag, first of the seven", async () => {
    const root = await workspace({
      "reforged-ts": "1.2.0",
      "reforged-types": "1.3.0",
      "reforged-test": "1.1.1",
      "eslint-plugin-reforged": "1.2.0",
      "reforged-map": "1.0.2",
      "reforged-builtins": "1.0.1",
      "reforged-studio": "1.0.3",
    });
    const pack = await packDir(
      entry("reforged-test", "1.1.1"),
      entry("reforged-types", "1.3.0"),
    );

    expect(
      (await templateDispatch(pack, root, "master"))?.client_payload,
    ).toEqual({
      tag: "reforged-types@1.3.0",
      branch: "main",
      versions: {
        "reforged-ts": "1.2.0",
        "reforged-types": "1.3.0",
        "reforged-test": "1.1.1",
        "eslint-plugin-reforged": "1.2.0",
        "reforged-map": "1.0.2",
        "reforged-builtins": "1.0.1",
        "reforged-studio": "1.0.3",
      },
      contextUrl: `${RAW}/reforged-types@1.3.0/GLOSSARY.md`,
      matrixUrl: `${RAW}/reforged-types@1.3.0/release/compatibility/matrix.md`,
      llmsUrl: "https://phmilk.github.io/reforged-ts/docs/1.2/llms.txt",
    });
  });

  it("dispatches a release from next to the Template's next, which its sync applies it to", async () => {
    const root = await workspace({
      "reforged-ts": "2.0.0-beta.0",
      "reforged-types": "1.3.0",
      "reforged-test": "1.1.1",
      "eslint-plugin-reforged": "1.2.0",
      "reforged-map": "1.0.2",
      "reforged-builtins": "1.0.1",
      "reforged-studio": "1.0.3",
    });
    const pack = await packDir(entry("reforged-ts", "2.0.0-beta.1"));

    expect(
      (await templateDispatch(pack, root, "next"))?.client_payload,
    ).toMatchObject({
      tag: "reforged-ts@2.0.0-beta.1",
      branch: "next",
      llmsUrl: "https://phmilk.github.io/reforged-ts/docs/next/llms.txt",
    });
  });

  it("refuses a branch with no Release channel, naming master and next, before reading the plan", async () => {
    const root = await workspace(ON_NPM);
    await expect(
      templateDispatch(await tempDir("empty"), root, "feature/1065"),
    ).rejects.toThrow(
      'A release runs from master or next, and "feature/1065" is neither',
    );
  });

  it("dispatches the first release of reforged-map with the version of each package, under the tag of the first of the seven", async () => {
    const root = await workspace({
      ...ON_NPM,
      "reforged-types": "1.0.0-alpha.5",
      "reforged-map": "1.0.0-alpha.0",
    });
    const pack = await packDir(
      entry("reforged-types", "1.0.0-alpha.5"),
      entry("reforged-map", "1.0.0-alpha.0"),
    );

    expect(
      (await templateDispatch(pack, root, "master"))?.client_payload,
    ).toMatchObject({
      tag: "reforged-types@1.0.0-alpha.5",
      versions: {
        ...ON_NPM,
        "reforged-types": "1.0.0-alpha.5",
        "reforged-map": "1.0.0-alpha.0",
      },
    });

    const alone = await packDir(entry("reforged-map", "1.0.1"));
    expect(
      (await templateDispatch(alone, root, "master"))?.client_payload,
    ).toMatchObject({
      tag: "reforged-map@1.0.1",
      versions: {
        ...ON_NPM,
        "reforged-types": "1.0.0-alpha.5",
        "reforged-map": "1.0.1",
      },
    });
  });

  it("dispatches the first release of reforged-builtins with the version of each package, under its own tag when alone", async () => {
    const root = await workspace({
      ...ON_NPM,
      "reforged-builtins": "1.0.0-alpha.0",
    });
    const alone = await packDir(entry("reforged-builtins", "1.0.0-alpha.0"));

    expect(
      (await templateDispatch(alone, root, "master"))?.client_payload,
    ).toMatchObject({
      tag: "reforged-builtins@1.0.0-alpha.0",
      versions: ON_NPM,
    });

    const withLibrary = await packDir(
      entry("reforged-builtins", "1.0.0-alpha.0"),
      entry("reforged-ts", "1.0.0-alpha.2"),
    );
    expect(
      (await templateDispatch(withLibrary, root, "master"))?.client_payload,
    ).toMatchObject({ tag: "reforged-ts@1.0.0-alpha.2", versions: ON_NPM });
  });

  it("dispatches the first release of reforged-studio with the version of each package, under its own tag when alone", async () => {
    const root = await workspace(ON_NPM);
    const alone = await packDir(entry("reforged-studio", "1.0.0-alpha.0"));

    expect(
      (await templateDispatch(alone, root, "master"))?.client_payload,
    ).toMatchObject({
      tag: "reforged-studio@1.0.0-alpha.0",
      versions: ON_NPM,
    });

    const withMap = await packDir(
      entry("reforged-studio", "1.0.0-alpha.0"),
      entry("reforged-map", "1.0.0-alpha.0"),
    );
    expect(
      (await templateDispatch(withMap, root, "master"))?.client_payload,
    ).toMatchObject({ tag: "reforged-map@1.0.0-alpha.0", versions: ON_NPM });
  });

  it("dispatches nothing for a release of create-reforged-map alone, which leaves the Template's ranges as they are", async () => {
    const root = await workspace(ON_NPM);
    const pack = await packDir(entry("create-reforged-map", "1.0.0-alpha.1"));
    expect(await templateDispatch(pack, root, "master")).toBeUndefined();
  });

  it("refuses a plan that publishes no package", async () => {
    const root = await workspace(ON_NPM);
    await expect(
      templateDispatch(await packDir(), root, "master"),
    ).rejects.toThrow(
      "The publish plan publishes no package: there is no release to dispatch.",
    );
  });

  it("refuses a workspace without one of the seven packages, naming it", async () => {
    const root = await writeWorkspace(
      PACKAGES.filter(({ name }) => name !== "reforged-test"),
    );
    const pack = await packDir(entry("reforged-ts", "1.0.0"));
    await expect(templateDispatch(pack, root, "master")).rejects.toThrow(
      "Neither the publish plan nor the workspace has reforged-test.",
    );
  });

  it("refuses a library version that names no docs version", async () => {
    const root = await workspace(ON_NPM);
    const pack = await packDir(entry("reforged-ts", "next"));
    await expect(templateDispatch(pack, root, "master")).rejects.toThrow(
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

  it("writes the request body of the branch's channel to the out file, and the payload to stdout and the job summary", async () => {
    const root = await workspace({ ...ON_NPM, "reforged-ts": "1.0.0-alpha.3" });
    const pack = await packDir(entry("reforged-ts", "1.0.0-alpha.3"));
    const cwd = await tempDir("cwd");
    const summary = join(cwd, "summary.md");

    const result = await runCli(
      ["--pack-dir", pack, "--out", "dispatch.json", "--branch", "next"],
      root,
      cwd,
      { GITHUB_STEP_SUMMARY: summary },
    );

    const body = await templateDispatch(pack, root, "next");
    expect(body?.client_payload.branch).toBe("next");
    const payload = JSON.stringify(body?.client_payload, null, 2);
    expect(result).toEqual({
      status: 0,
      stdout: `reforged-ts-release, tag reforged-ts@1.0.0-alpha.3, Template branch next:\n${payload}\n`,
      stderr: "",
    });
    expect(
      JSON.parse(await readFile(join(cwd, "dispatch.json"), "utf8")),
    ).toEqual(body);
    expect(await readFile(summary, "utf8")).toBe(
      "## Template dispatch\n\n" +
        "`reforged-ts-release` to phmilk/reforged-ts-template, tag `reforged-ts@1.0.0-alpha.3`, Template branch `next`:\n\n" +
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
      "reforged-map": [["1.0.0-alpha.0"]],
      "reforged-builtins": [["1.0.0-alpha.0"]],
      "reforged-studio": [["1.0.0-alpha.0"]],
    });
    const cwd = await tempDir("cwd");
    const args = [
      "--pack-dir",
      pack,
      "--out",
      "dispatch.json",
      "--branch",
      "master",
      "--await-npm",
      "1",
    ];

    expect(await runCli(args, root, cwd, {}, listed.fetcher)).toMatchObject({
      status: 0,
    });
    expect(listed.asked.get("reforged-ts")).toBe(2);
    expect(
      JSON.parse(await readFile(join(cwd, "dispatch.json"), "utf8")),
    ).toEqual(await templateDispatch(pack, root, "master"));

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

  it("writes no out file for a release with nothing to dispatch, saying so", async () => {
    const root = await workspace(ON_NPM);
    const pack = await packDir(entry("create-reforged-map", "1.0.0-alpha.1"));
    const cwd = await tempDir("cwd");
    const summary = join(cwd, "summary.md");
    const message =
      "The release publishes none of reforged-ts, reforged-types, reforged-test, eslint-plugin-reforged, reforged-map, reforged-builtins, reforged-studio: the Template has nothing to sync, and nothing is dispatched.\n";

    expect(
      await runCli(
        [
          "--pack-dir",
          pack,
          "--out",
          "dispatch.json",
          "--branch",
          "master",
          "--await-npm",
          "1",
        ],
        root,
        cwd,
        { GITHUB_STEP_SUMMARY: summary },
      ),
    ).toEqual({ status: 0, stdout: message, stderr: "" });
    await expect(readFile(join(cwd, "dispatch.json"))).rejects.toThrow();
    expect(await readFile(summary, "utf8")).toBe(
      `## Template dispatch\n\n${message}`,
    );
  });

  it("exits 1 on a plan it cannot dispatch or a branch with no channel, and 2 on bad arguments", async () => {
    const root = await workspace(ON_NPM);
    const cwd = await tempDir("cwd");
    const empty = await tempDir("empty");
    expect(
      await runCli(
        ["--pack-dir", empty, "--out", "dispatch.json", "--branch", "master"],
        root,
        cwd,
      ),
    ).toMatchObject({
      status: 1,
      stderr: expect.stringContaining(
        "Cannot read the publish plan",
      ) as unknown,
    });
    expect(
      await runCli(
        ["--pack-dir", empty, "--out", "dispatch.json", "--branch", "main"],
        root,
        cwd,
      ),
    ).toMatchObject({
      status: 1,
      stderr: expect.stringContaining(
        'A release runs from master or next, and "main" is neither',
      ) as unknown,
    });
    for (const args of [
      [],
      ["--pack-dir", "pack", "--branch", "master"],
      ["--pack-dir", "pack", "--out", "x"],
      ["--out", "x", "--out", "y", "--branch", "master"],
      ["--pack-dir", "pack", "--out", "x", "--branch"],
      [
        ...["--pack-dir", "pack", "--out", "x", "--branch", "master"],
        ...["--await-npm", "0"],
      ],
      [
        ...["--pack-dir", "pack", "--out", "x", "--branch", "master"],
        ...["--await-npm", "soon"],
      ],
    ]) {
      expect(await runCli(args, root, cwd)).toMatchObject({
        status: 2,
        stderr:
          "Usage: release:template-dispatch --pack-dir <dir> --out <file> --branch <name> [--await-npm <minutes>]\n",
      });
    }
  });
});
