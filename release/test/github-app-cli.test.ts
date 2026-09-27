import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { main } from "../src/cli/github-app.js";
import { APP_PERMISSIONS, registrationUrl } from "../src/github-app.js";

const API = "https://api.github.com";
const REPOSITORY = "phmilk/reforged-ts";

let folder = "";
let keyFile = "";

beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), "github-app-"));
  keyFile = join(folder, "app.private-key.pem");
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  await writeFile(
    keyFile,
    privateKey.export({ type: "pkcs1", format: "pem" }).toString(),
  );
});

afterAll(async () => {
  await rm(folder, { recursive: true, force: true });
});

const APP = {
  slug: "reforged-ts-bot",
  name: "reforged-ts-bot",
  owner: { login: "phmilk" },
  permissions: APP_PERMISSIONS,
  events: [],
};

const INSTALLATION = {
  id: 7,
  account: { login: "phmilk" },
  repository_selection: "selected",
  permissions: APP_PERMISSIONS,
};

/** A GitHub API answering `answers` (path → status and body; 404 else). */
function gitHub(
  answers: Record<string, { status?: number; body: unknown }>,
  seen: { method: string; path: string; authorization: string | null }[] = [],
): typeof fetch {
  return (input, init) => {
    const request = new Request(input, init);
    const path = request.url.slice(API.length);
    seen.push({
      method: request.method,
      path,
      authorization: request.headers.get("authorization"),
    });
    const answer = answers[path] as
      { status?: number; body: unknown } | undefined;
    return Promise.resolve(
      answer === undefined
        ? Response.json({ message: "Not Found" }, { status: 404 })
        : Response.json(answer.body, { status: answer.status ?? 200 }),
    );
  };
}

async function run(args: string[], fetcher: typeof fetch = gitHub({})) {
  let stdout = "";
  let stderr = "";
  const code = await main(
    args,
    {
      stdout: (text) => (stdout += text),
      stderr: (text) => (stderr += text),
    },
    { fetcher, now: () => new Date("2026-09-26T12:00:00Z") },
  );
  return { code, stdout, stderr };
}

const check = (...more: string[]) => [
  "check",
  "--repo",
  REPOSITORY,
  "--client-id",
  "Iv23liABC",
  "--private-key",
  keyFile,
  ...more,
];

describe("github-app url", () => {
  it("prints the registration page", async () => {
    expect(await run(["url", "--repo", REPOSITORY])).toEqual({
      code: 0,
      stdout: `${registrationUrl(REPOSITORY)}\n`,
      stderr: "",
    });
  });
});

describe("github-app check", () => {
  it("authenticates as the App and prints what it read", async () => {
    const seen: {
      method: string;
      path: string;
      authorization: string | null;
    }[] = [];
    const result = await run(check(), gitHub({ "/app": { body: APP } }, seen));

    expect(result).toEqual({
      code: 0,
      stdout:
        'The App reforged-ts-bot ("reforged-ts-bot"), owned by phmilk.\n' +
        "Repository permissions: contents write, issues write, metadata read, pull_requests write.\n" +
        "Webhook events: none.\n" +
        "Installation page: https://github.com/apps/reforged-ts-bot/installations/new\n",
      stderr: "",
    });
    expect(seen.map(({ method, path }) => `${method} ${path}`)).toEqual([
      "GET /app",
    ]);
    expect(seen[0]?.authorization).toMatch(/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/);
  });

  it("with --installed, checks the installation on the repository", async () => {
    const result = await run(
      check("--installed"),
      gitHub({
        "/app": { body: APP },
        [`/repos/${REPOSITORY}/installation`]: { body: INSTALLATION },
      }),
    );

    expect(result.code).toBe(0);
    expect(result.stdout).toContain(
      "Installed on phmilk (installation 7), repository access: selected.\n",
    );
    expect(result.stderr).toBe("");
  });

  it("fails when the App is not installed on the repository", async () => {
    const result = await run(
      check("--installed"),
      gitHub({ "/app": { body: APP } }),
    );

    expect(result.code).toBe(1);
    expect(result.stderr).toBe(
      "The App is not installed on phmilk/reforged-ts: install it from https://github.com/apps/reforged-ts-bot/installations/new, Only select repositories → phmilk/reforged-ts.\n",
    );
  });

  it("fails on the problems of the App, still printing what it read", async () => {
    const result = await run(
      check(),
      gitHub({ "/app": { body: { ...APP, events: ["push"] } } }),
    );

    expect(result.code).toBe(1);
    expect(result.stdout).toContain("Webhook events: push.\n");
    expect(result.stderr).toMatch(/^The App subscribes to webhook events/);
  });

  it("names the credentials when GitHub refuses them", async () => {
    const result = await run(
      check(),
      gitHub({
        "/app": {
          status: 401,
          body: { message: "A JSON web token could not be decoded" },
        },
      }),
    );

    expect(result.code).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "GitHub refuses the App's credentials (401: A JSON web token could not be decoded): the client ID Iv23liABC and the key in",
    );
  });

  it("names the client ID when GitHub knows no such App", async () => {
    const result = await run(
      check(),
      gitHub({
        "/app": { status: 404, body: { message: "Integration not found" } },
      }),
    );

    expect(result).toEqual({
      code: 1,
      stdout: "",
      stderr:
        "GitHub knows no App of client ID Iv23liABC (404: Integration not found). Copy the Client ID from the App's settings page, not the App ID.\n",
    });
  });

  it("fails without asking GitHub when the key file is not a key", async () => {
    const seen: {
      method: string;
      path: string;
      authorization: string | null;
    }[] = [];
    const notKey = join(folder, "not-a-key.pem");
    await writeFile(notKey, "hello");

    const result = await run(
      [
        "check",
        "--repo",
        REPOSITORY,
        "--client-id",
        "Iv23liABC",
        "--private-key",
        notKey,
      ],
      gitHub({}, seen),
    );

    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(
      /not-a-key\.pem is not a readable private key/,
    );
    expect(seen).toEqual([]);
  });

  it("never prints the key", async () => {
    const result = await run(
      check("--installed"),
      gitHub({
        "/app": { body: APP },
        [`/repos/${REPOSITORY}/installation`]: { body: INSTALLATION },
      }),
    );
    expect(`${result.stdout}${result.stderr}`).not.toMatch(/PRIVATE KEY/);
  });
});

describe("usage", () => {
  it.each([
    [[]],
    [["url"]],
    [["url", "--repo", "not-a-repository"]],
    [["url", "--repo", REPOSITORY, "--installed"]],
    [["url", "--repo", REPOSITORY, "--client-id", "x"]],
    [["check", "--repo", REPOSITORY, "--client-id", "x"]],
    [["check", "--repo", REPOSITORY, "--private-key", "k", "--client-id"]],
    [["check", "--repo", REPOSITORY, "--repo", REPOSITORY]],
    [["check", "--installed", "--installed"]],
    [["other", "--repo", REPOSITORY]],
  ])("exits 2 on %j", async (args) => {
    const result = await run(args);
    expect(result.code).toBe(2);
    expect(result.stderr).toMatch(/^Usage: github-app url/);
  });
});
