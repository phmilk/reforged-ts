import { describe, expect, it } from "vitest";
import { main } from "../src/cli/publish-check.js";
import { checkPublish, onNpm } from "../src/publish-check.js";
import { writeWorkspace } from "./support/workspace.js";

const ON_NPM = [
  { name: "reforged-ts", onNpm: true },
  { name: "reforged-types", onNpm: true },
];

const READY = {
  idToken: true,
  pnpm: "12.6.0",
  npm: "11.19.0",
  packages: ON_NPM,
};

/** A registry that holds the packages `published` and nothing else. */
function registry(published: readonly string[], status = 404): typeof fetch {
  return (input) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const name = decodeURIComponent(url.split("/").at(-1) ?? "");
    return Promise.resolve(
      new Response("{}", { status: published.includes(name) ? 200 : status }),
    );
  };
}

describe("checkPublish", () => {
  it("passes with an OIDC token, pnpm 11 or later, and every package on npm", () => {
    expect(checkPublish(READY)).toEqual({ ok: true, problems: [] });
    expect(checkPublish({ ...READY, pnpm: "11.0.0", npm: null }).ok).toBe(true);
  });

  it("refuses pnpm 10, which never exchanges the OIDC token, whatever its npm", () => {
    expect(checkPublish({ ...READY, pnpm: "10.33.0", npm: "11.19.0" })).toEqual(
      {
        ok: false,
        problems: [
          expect.stringContaining(
            "pnpm 10.33.0 cannot publish without a token: `pnpm publish` does trusted publishing from pnpm 11",
          ) as unknown,
        ],
      },
    );
  });

  it("sends a refused pnpm back to the root packageManager field, the pnpm the job runs", () => {
    const [problem] = checkPublish({ ...READY, pnpm: "10.33.0" }).problems;
    expect(problem).toContain(
      "The publish job runs the pnpm of the root packageManager field: pin pnpm 11 or later there.",
    );
  });

  it("names the missing id-token permission", () => {
    expect(checkPublish({ ...READY, idToken: false }).problems).toEqual([
      expect.stringContaining("`permissions: id-token: write`") as unknown,
    ]);
  });

  it("names the packages not on npm yet and the first-publish wizard", () => {
    const result = checkPublish({
      ...READY,
      packages: [
        { name: "reforged-types", onNpm: false },
        { name: "reforged-ts", onNpm: true },
        { name: "eslint-plugin-reforged", onNpm: false },
      ],
    });
    expect(result.problems).toEqual([
      expect.stringMatching(
        /^Not on npm yet: eslint-plugin-reforged, reforged-types\. .*first-publish wizard \(bash release\/first-publish\.sh\)/,
      ) as unknown,
    ]);
  });

  it("reports every missing prerequisite at once", () => {
    expect(
      checkPublish({
        idToken: false,
        pnpm: null,
        npm: null,
        packages: [{ name: "reforged-ts", onNpm: false }],
      }).problems,
    ).toHaveLength(3);
  });
});

describe("onNpm", () => {
  it("reads 200 as present and 404 as absent, and throws on anything else", async () => {
    expect(await onNpm("reforged-ts", registry(["reforged-ts"]))).toBe(true);
    expect(await onNpm("reforged-ts", registry([]))).toBe(false);
    await expect(onNpm("reforged-ts", registry([], 503))).rejects.toThrow(
      "https://registry.npmjs.org answered 503 for reforged-ts.",
    );
  });
});

describe("release:publish-check", () => {
  async function runCli(
    args: string[],
    options: {
      published?: string[];
      npm?: string | null;
      env?: Record<string, string>;
    } = {},
  ) {
    let stdout = "";
    let stderr = "";
    const status = await main(
      args,
      {
        stdout: (text) => (stdout += text),
        stderr: (text) => (stderr += text),
      },
      {
        root: await writeWorkspace(),
        env: options.env ?? {
          ACTIONS_ID_TOKEN_REQUEST_URL: "https://token.example.invalid",
        },
        version: (tool) =>
          Promise.resolve(
            tool === "pnpm" ? "12.6.0" : (options.npm ?? "11.19.0"),
          ),
        fetcher: registry(
          options.published ?? [
            "reforged-ts",
            "reforged-types",
            "reforged-test",
            "eslint-plugin-reforged",
            "reforged-map",
            "reforged-builtins",
          ],
        ),
      },
    );
    return { status, stdout, stderr };
  }

  it("exits 0 when the job is ready to publish", async () => {
    expect(await runCli([])).toEqual({
      status: 0,
      stdout:
        "Ready for trusted publishing: pnpm 12.6.0, npm 11.19.0, " +
        "eslint-plugin-reforged, reforged-builtins, reforged-map, reforged-test, reforged-ts, reforged-types on npm.\n",
      stderr: "",
    });
  });

  it("exits 1 with one line per missing prerequisite", async () => {
    const result = await runCli([], {
      published: ["reforged-ts", "reforged-types", "reforged-test"],
      env: {},
    });
    expect(result.status).toBe(1);
    expect(result.stderr.trimEnd().split("\n")).toEqual([
      expect.stringContaining("cannot request an OIDC token") as unknown,
      expect.stringContaining(
        "Not on npm yet: eslint-plugin-reforged, reforged-builtins, reforged-map.",
      ) as unknown,
    ]);
  });

  it("names reforged-builtins as not on npm until its first publish, the others being there", async () => {
    const result = await runCli([], {
      published: [
        "reforged-ts",
        "reforged-types",
        "reforged-test",
        "eslint-plugin-reforged",
        "reforged-map",
      ],
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(
      /^Not on npm yet: reforged-builtins\. .*first-publish wizard/,
    );
  });

  it("prints the usage and exits 2 on an argument", async () => {
    expect(await runCli(["--dry-run"])).toMatchObject({
      status: 2,
      stderr: "Usage: release:publish-check\n",
    });
  });
});
