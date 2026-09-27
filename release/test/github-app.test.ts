import { createVerify, generateKeyPairSync } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import {
  APP_PERMISSIONS,
  appJwt,
  checkApp,
  checkInstallation,
  formatPermissions,
  registrationUrl,
} from "../src/github-app.js";
import { repositoryRoot } from "../src/workspace.js";

const REPOSITORY = "phmilk/reforged-ts";

const decode = (part: string) =>
  JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as unknown;

describe("appJwt", () => {
  it("signs an RS256 token issued by the client ID, from a minute ago to nine minutes on", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    const now = new Date("2026-09-26T12:00:00Z");
    const seconds = now.getTime() / 1000;

    const [header = "", payload = "", signature = ""] = appJwt(
      "Iv23liABC",
      privateKey.export({ type: "pkcs1", format: "pem" }).toString(),
      now,
    ).split(".");

    expect(decode(header)).toEqual({ alg: "RS256", typ: "JWT" });
    expect(decode(payload)).toEqual({
      iat: seconds - 60,
      exp: seconds + 540,
      iss: "Iv23liABC",
    });
    const verified = createVerify("RSA-SHA256")
      .update(`${header}.${payload}`)
      .verify(publicKey, Buffer.from(signature, "base64url"));
    expect(verified).toBe(true);
  });

  it("throws on text that is not a private key", () => {
    expect(() => appJwt("Iv1.x", "not a key", new Date())).toThrow();
  });
});

describe("registrationUrl", () => {
  it("pre-fills a private App without webhook, with the permissions but metadata", () => {
    const url = new URL(registrationUrl(REPOSITORY));

    expect(`${url.origin}${url.pathname}`).toBe(
      "https://github.com/settings/apps/new",
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      name: "reforged-ts-bot",
      description:
        "Opens the release, docs and Patch-watch pull requests and issues of phmilk/reforged-ts.",
      url: "https://github.com/phmilk/reforged-ts",
      public: "false",
      webhook_active: "false",
      contents: "write",
      issues: "write",
      pull_requests: "write",
    });
  });
});

/** An App as `GET /app` answers, as this repository needs it. */
const app = (overrides: Record<string, unknown> = {}) => ({
  slug: "reforged-ts-bot",
  name: "reforged-ts-bot",
  owner: { login: "phmilk" },
  permissions: { ...APP_PERMISSIONS },
  events: [],
  ...overrides,
});

describe("checkApp", () => {
  it("accepts the App the workflows need", () => {
    expect(checkApp(app(), REPOSITORY)).toEqual({
      slug: "reforged-ts-bot",
      name: "reforged-ts-bot",
      owner: "phmilk",
      permissions: APP_PERMISSIONS,
      events: [],
      problems: [],
    });
  });

  it("reports another owner, other permissions and webhook events", () => {
    const { problems } = checkApp(
      app({
        owner: { login: "someone" },
        permissions: { contents: "write", metadata: "read" },
        events: ["push"],
      }),
      REPOSITORY,
    );

    expect(problems).toEqual([
      "The App is owned by someone, not phmilk: register it on phmilk's account.",
      "The App's repository permissions are contents write, metadata read; the workflows need exactly contents write, issues write, metadata read, pull_requests write, and no organization or account permission. Change them under Permissions & events: https://github.com/settings/apps/reforged-ts-bot/permissions",
      "The App subscribes to webhook events (push); it needs none. Untick Webhook → Active: https://github.com/settings/apps/reforged-ts-bot",
    ]);
  });

  it("reports a permission more than needed", () => {
    const { problems } = checkApp(
      app({ permissions: { ...APP_PERMISSIONS, members: "read" } }),
      REPOSITORY,
    );
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/^The App's repository permissions are /);
  });
});

/** An installation as `GET /repos/{repository}/installation` answers. */
const installation = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  account: { login: "phmilk" },
  repository_selection: "selected",
  permissions: { ...APP_PERMISSIONS },
  ...overrides,
});

describe("checkInstallation", () => {
  it("accepts an installation on selected repositories with the permissions", () => {
    expect(checkInstallation(installation(), REPOSITORY)).toEqual({
      id: 7,
      account: "phmilk",
      selection: "selected",
      problems: [],
    });
  });

  it("reports all repositories and permissions not accepted yet", () => {
    const { problems } = checkInstallation(
      installation({
        repository_selection: "all",
        permissions: { contents: "write", metadata: "read" },
      }),
      REPOSITORY,
    );

    expect(problems).toEqual([
      "The installation has access to all the repositories of phmilk; choose Only select repositories → phmilk/reforged-ts: https://github.com/settings/installations/7",
      "The installation grants contents write, metadata read, not contents write, issues write, metadata read, pull_requests write: accept the App's new permissions on https://github.com/settings/installations/7",
    ]);
  });
});

describe("formatPermissions", () => {
  it("sorts by name, and says none for no permission", () => {
    expect(formatPermissions({ issues: "write", contents: "read" })).toBe(
      "contents read, issues write",
    );
    expect(formatPermissions({})).toBe("none");
  });
});

interface Step {
  uses?: string;
  with?: Partial<Record<string, unknown>>;
}

describe("the App's permissions", () => {
  it("are exactly what the workflows mint its tokens with", async () => {
    const folder = join(repositoryRoot, ".github", "workflows");
    const requested: Record<string, "read" | "write"> = { metadata: "read" };
    for (const file of await readdir(folder)) {
      if (!/\.ya?ml$/.test(file)) continue;
      const workflow = parse(await readFile(join(folder, file), "utf8")) as {
        jobs?: Partial<Record<string, { steps?: Step[] }>>;
      };
      for (const job of Object.values(workflow.jobs ?? {})) {
        for (const step of job?.steps ?? []) {
          const uses = step.uses ?? "";
          if (
            uses !== "./.github/actions/app-token" &&
            !uses.startsWith("actions/create-github-app-token@")
          ) {
            continue;
          }
          for (const [input, value] of Object.entries(step.with ?? {})) {
            if (!input.startsWith("permission-")) continue;
            // An expression such as `dry-run && 'read' || 'write'` may ask
            // for either: the App must grant the stronger.
            const text = String(value);
            const access = text.includes("write")
              ? "write"
              : text.includes("read")
                ? "read"
                : null;
            if (access === null) continue;
            const name = input.slice("permission-".length).replaceAll("-", "_");
            if (requested[name] !== "write") requested[name] = access;
          }
        }
      }
    }

    expect(formatPermissions(requested)).toBe(
      formatPermissions(APP_PERMISSIONS),
    );
  });
});
