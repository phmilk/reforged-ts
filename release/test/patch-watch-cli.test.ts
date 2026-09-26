import { describe, expect, it } from "vitest";
import { main, type PlanReport } from "../src/cli/patch-watch.js";
import { fetchTags, TAGS_URL } from "../src/jass-history.js";
import { readWatchRepository, WatchInputError } from "../src/patch-watch.js";
import { repositoryRoot } from "../src/workspace.js";
import {
  LIVE_23745,
  LIVE_24268,
  SNAPSHOT,
  tagsApi,
  TODAY,
} from "./support/jass-history.js";
import { PACKAGES, writeText, writeWorkspace } from "./support/workspace.js";

describe("fetchTags", () => {
  it("follows the pages to the last one", async () => {
    const requests: Request[] = [];
    const fetched = await fetchTags(tagsApi(SNAPSHOT, 50, requests), "t0k");

    expect(fetched).toEqual(TODAY);
    expect(requests.map(({ url }) => url)).toEqual([
      TAGS_URL,
      `${TAGS_URL}&page=2`,
      `${TAGS_URL}&page=3`,
    ]);
    expect(requests[0]?.headers.get("authorization")).toBe("Bearer t0k");
  });

  it("sends no authorization without a token", async () => {
    const requests: Request[] = [];
    await fetchTags(tagsApi(SNAPSHOT, 100, requests));

    expect(requests[0]?.headers.has("authorization")).toBe(false);
  });

  it("throws on an answer that is not 200", async () => {
    const forbidden: typeof fetch = () =>
      Promise.resolve(
        new Response("{}", { status: 403, statusText: "rate limited" }),
      );

    await expect(fetchTags(forbidden)).rejects.toThrow(
      `GET ${TAGS_URL} answered 403 rate limited.`,
    );
  });

  it("throws on an answer that is not JSON", async () => {
    const html: typeof fetch = () =>
      Promise.resolve(new Response("<html>", { status: 200 }));

    await expect(fetchTags(html)).rejects.toThrow(
      `GET ${TAGS_URL} answered no JSON`,
    );
  });

  it("throws on a tag without a commit", async () => {
    await expect(fetchTags(tagsApi([{ name: "baseline" }]))).rejects.toThrow(
      "answered a tag without a name and a commit",
    );
  });

  it("never follows a next page off the API", async () => {
    const elsewhere: typeof fetch = () =>
      Promise.resolve(
        Response.json([], {
          headers: { link: '<https://example.invalid/tags>; rel="next"' },
        }),
      );

    await expect(fetchTags(elsewhere, "t0k")).rejects.toThrow(
      "the next page is off the API",
    );
  });
});

/**
 * A fixture workspace whose Typings support `supported` and vendor
 * `vendored`.
 */
async function repository(
  supported: unknown = "3.0.0.24268",
  vendored: readonly string[] = ["3.0.0.24268"],
): Promise<string> {
  const root = await writeWorkspace(
    PACKAGES.map((pkg) =>
      pkg.name === "reforged-types"
        ? { ...pkg, fields: { reforged: { patch: supported } } }
        : pkg,
    ),
  );
  for (const patch of vendored) {
    await writeText(
      root,
      `packages/reforged-types/vendor/${patch}/provenance.json`,
      JSON.stringify({ patch, tag: `Reforged-v${patch}-w3` }),
    );
  }
  return root;
}

describe("readWatchRepository", () => {
  it("reads this repository's supported Patch and vendored Builds", async () => {
    expect(await readWatchRepository(repositoryRoot)).toEqual({
      supported: "3.0.0.24268",
      vendored: ["3.0.0.24268"],
    });
  });

  it("reads the vendored Builds in Build order", async () => {
    const root = await repository("2.0.4.23745", [
      "3.0.0.24268",
      "2.0.4.23745",
    ]);

    expect(await readWatchRepository(root)).toEqual({
      supported: "2.0.4.23745",
      vendored: ["2.0.4.23745", "3.0.0.24268"],
    });
  });

  it("reads no vendored Build without a vendor folder", async () => {
    const root = await repository("3.0.0.24268", []);

    expect(await readWatchRepository(root)).toEqual({
      supported: "3.0.0.24268",
      vendored: [],
    });
  });

  it("skips a vendor folder not named after a Build", async () => {
    const root = await repository();
    await writeText(root, "packages/reforged-types/vendor/notes/README.md", "");

    expect(await readWatchRepository(root)).toMatchObject({
      vendored: ["3.0.0.24268"],
    });
  });

  it("rejects a supported Patch that is not a Build", async () => {
    await expect(readWatchRepository(await repository("3.0"))).rejects.toThrow(
      WatchInputError,
    );
  });

  it("rejects a vendored folder without a readable provenance", async () => {
    const root = await repository();
    await writeText(
      root,
      "packages/reforged-types/vendor/3.1.0.1/common.j",
      "",
    );

    await expect(readWatchRepository(root)).rejects.toThrow(
      /3\.1\.0\.1.provenance\.json/,
    );
  });
});

describe("patch-watch:plan", () => {
  async function runCli(
    args: string[],
    root?: string,
    fetcher: typeof fetch = tagsApi(),
  ) {
    let stdout = "";
    let stderr = "";
    const status = await main(
      args,
      {
        stdout: (text) => (stdout += text),
        stderr: (text) => (stderr += text),
      },
      { root: root ?? (await repository()), env: {}, fetcher },
    );
    return { status, stdout, stderr };
  }

  it("prints an empty plan on today's tag list", async () => {
    const result = await runCli([]);

    expect(result).toMatchObject({ status: 0, stderr: "" });
    expect(result.stdout.split("\n")).toEqual([
      "jass-history: 128 tags. Supported Patch: 3.0.0.24268 (reforged-types reforged.patch). " +
        "Vendored: 3.0.0.24268. Reported: none.",
      "No new live Patch.",
      "Ignored:",
      "- Reforged-v3.0.0.24277-w3t-e38e03b is of the test client (w3t), not a live Patch.",
      "- 75 tags without a four-number Build (baseline, locale-only tags, old betas).",
      "- 52 tags not above the supported Patch.",
      "",
    ]);
  });

  it("plans the vendored Build when the supported Patch is simulated below it", async () => {
    const result = await runCli([
      "--simulate-current-patch",
      "3.0.0.24267",
      "--json",
    ]);

    expect(result).toMatchObject({ status: 0, stderr: "" });
    const report = JSON.parse(result.stdout) as PlanReport;
    expect(report).toMatchObject({
      supported: "3.0.0.24267",
      simulated: true,
      vendored: [],
      reported: [],
      tags: 128,
      patch: {
        build: "3.0.0.24268",
        tag: LIVE_24268,
        commit: "a392fc3d5e6c37980accbfc560b28387fc7d01bc",
      },
      superseded: [],
    });
    expect(Object.keys(report)).toEqual([
      "supported",
      "simulated",
      "vendored",
      "reported",
      "tags",
      "patch",
      "superseded",
      "ignored",
    ]);
  });

  it("prints the plan with its links and the superseded Builds", async () => {
    const result = await runCli(["--simulate-current-patch", "2.0.3.23175"]);

    expect(result.stdout).toContain(
      "Supported Patch: 2.0.3.23175 (simulated). Vendored: none. Reported: none.\n" +
        `New live Patch: 3.0.0.24268 (tag ${LIVE_24268}, commit a392fc3d5e6c37980accbfc560b28387fc7d01bc).\n` +
        `  https://github.com/Luashine/jass-history/tree/${LIVE_24268}\n` +
        "  https://github.com/Luashine/jass-history/commit/a392fc3d5e6c37980accbfc560b28387fc7d01bc\n" +
        "  https://github.com/Luashine/jass-history/tree/a392fc3d5e6c37980accbfc560b28387fc7d01bc/timeline/scripts\n" +
        "Superseded:\n" +
        `- 2.0.4.23745 (tag ${LIVE_23745}, commit 6bd66bd45987cea6842d86d16a26e10c9e85065b)\n`,
    );
  });

  it("plans nothing for a reported Build", async () => {
    const result = await runCli([
      "--simulate-current-patch",
      "3.0.0.24267",
      "--reported",
      "3.0.0.24268",
      "--json",
    ]);

    expect(JSON.parse(result.stdout)).toMatchObject({
      reported: ["3.0.0.24268"],
      patch: null,
    });
  });

  it("authenticates with the token of the environment", async () => {
    const requests: Request[] = [];
    await main(
      [],
      { stdout: () => undefined, stderr: () => undefined },
      {
        root: await repository(),
        env: { GITHUB_TOKEN: "", GH_TOKEN: "t0k" },
        fetcher: tagsApi(SNAPSHOT, 100, requests),
      },
    );

    expect(requests[0]?.headers.get("authorization")).toBe("Bearer t0k");
  });

  it("exits 1 when the tags cannot be fetched", async () => {
    const result = await runCli([], undefined, () =>
      Promise.reject(new Error("getaddrinfo ENOTFOUND api.github.com")),
    );

    expect(result).toEqual({
      status: 1,
      stdout: "",
      stderr: "getaddrinfo ENOTFOUND api.github.com\n",
    });
  });

  it("exits 1 when the repository cannot be read", async () => {
    const result = await runCli([], await repository(null));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("reforged.patch is null");
  });

  it("prints the usage and exits 2 on a bad argument", async () => {
    for (const args of [
      ["--dry-run"],
      ["--reported"],
      ["--simulate-current-patch", "3.0"],
      ["--reported", "--json"],
      [
        "--simulate-current-patch",
        "3.0.0.1",
        "--simulate-current-patch",
        "3.0.0.2",
      ],
    ]) {
      expect(await runCli(args)).toEqual({
        status: 2,
        stdout: "",
        stderr:
          "Usage: patch-watch:plan [--simulate-current-patch <build>] [--reported <build>]... [--json]\n",
      });
    }
  });
});
