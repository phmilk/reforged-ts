import { describe, expect, it } from "vitest";
import { main } from "../src/cli/publish-check.js";
import { atLeast, checkPublish, onNpm } from "../src/publish-check.js";
import { writeWorkspace } from "./support/workspace.js";

const ON_NPM = [
  { name: "reforged-ts", onNpm: true },
  { name: "reforged-types", onNpm: true },
];

const READY = {
  idToken: true,
  pnpm: "10.33.0",
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

describe("atLeast", () => {
  it("compares release versions part by part", () => {
    expect(atLeast("11.5.1", "11.5.1")).toBe(true);
    expect(atLeast("11.10.0", "11.5.1")).toBe(true);
    expect(atLeast("12.0.0", "11.5.1")).toBe(true);
    expect(atLeast("11.5.0", "11.5.1")).toBe(false);
    expect(atLeast("10.9.4", "11.5.1")).toBe(false);
    expect(atLeast("not a version", "11.5.1")).toBe(false);
  });
});

describe("checkPublish", () => {
  it("passes with an OIDC token, pnpm 10 over npm 11.5.1 or later, and every package on npm", () => {
    expect(checkPublish(READY)).toEqual({ ok: true, problems: [] });
    expect(checkPublish({ ...READY, npm: "11.5.1" }).ok).toBe(true);
  });

  it("does not need npm under pnpm 11, which publishes itself", () => {
    expect(checkPublish({ ...READY, pnpm: "11.2.0", npm: null }).ok).toBe(true);
  });

  it("names the npm floor when pnpm 10 would hand the upload to an older npm", () => {
    expect(checkPublish({ ...READY, npm: "10.9.4" })).toEqual({
      ok: false,
      problems: [
        expect.stringContaining(
          "pnpm 10.33.0 hands the upload to the npm CLI, which does trusted publishing from 11.5.1; found npm 10.9.4.",
        ) as unknown,
      ],
    });
    expect(checkPublish({ ...READY, npm: null }).problems).toEqual([
      expect.stringContaining("found no npm.") as unknown,
    ]);
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
        /^Not on npm yet: eslint-plugin-reforged, reforged-types\. .*first-publish wizard \(#149\)/,
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
            tool === "pnpm" ? "10.33.0" : (options.npm ?? "11.19.0"),
          ),
        fetcher: registry(
          options.published ?? [
            "reforged-ts",
            "reforged-types",
            "reforged-test",
            "eslint-plugin-reforged",
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
        "Ready for trusted publishing: pnpm 10.33.0, npm 11.19.0, " +
        "eslint-plugin-reforged, reforged-test, reforged-ts, reforged-types on npm.\n",
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
        "Not on npm yet: eslint-plugin-reforged.",
      ) as unknown,
    ]);
  });

  it("prints the usage and exits 2 on an argument", async () => {
    expect(await runCli(["--dry-run"])).toMatchObject({
      status: 2,
      stderr: "Usage: release:publish-check\n",
    });
  });
});
