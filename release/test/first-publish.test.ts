import { execFileSync, spawnSync } from "node:child_process";
import { chmod, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { repositoryRoot } from "../src/workspace.js";
import { publishEntry, publishPlan } from "./support/publish-plan.js";
import { tempDir, writeText } from "./support/workspace.js";

// The first-publish wizard, run with bash against a checkout the test writes
// and fake npm and pnpm programs first on the PATH: npm answers what the
// test says it holds, and pnpm writes the publish plan the test gives it.
// The checkout is its own origin, so `git fetch origin master` succeeds
// offline. Linux and macOS only: the wizard runs in Git Bash on Windows,
// where the fake programs would need .cmd shims.

const WIZARD = join(repositoryRoot, "release", "first-publish.sh");
const FIRST_FOUR = [
  "reforged-ts",
  "reforged-types",
  "reforged-test",
  "eslint-plugin-reforged",
];

// npm: `view <pkg> dist-tags.next` answers FAKE_NPM_NEXT ("pkg=version ...")
// and what the fake publish published, or E404; `view <pkg>@<x> version`
// answers nothing; whoami answers once the token is set, and refuses it as
// revoked afterwards; every call is logged.
const FAKE_NPM = `#!/usr/bin/env bash
printf 'npm %s\\n' "$*" >>"$FAKE_LOG"
case "$1" in
  view)
    if [[ "$3" == dist-tags.next ]]; then
      for pair in $FAKE_NPM_NEXT $(cat "$FAKE_STATE/published" 2>/dev/null); do
        [[ "\${pair%%=*}" == "$2" ]] && { printf '%s\\n' "\${pair#*=}"; exit 0; }
      done
      echo "npm error code E404" >&2
      exit 1
    fi
    exit 0
    ;;
  whoami)
    if [[ -f "$FAKE_STATE/token" && ! -f "$FAKE_STATE/revoked" ]]; then
      touch "$FAKE_STATE/revoked"
      echo paulo
      exit 0
    fi
    echo "npm error code E401" >&2
    exit 1
    ;;
  config)
    if [[ "$2" == set ]]; then touch "$FAKE_STATE/token"; else rm -f "$FAKE_STATE/token"; fi
    ;;
esac
exit 0
`;

// pnpm: `changeset pack --out-dir <dir>` copies FAKE_PLAN there, and
// `changeset publish` publishes each entry of the plan it is given (npm then
// answers its version as `next`) and tags it locally; every call is logged.
const FAKE_PNPM = `#!/usr/bin/env bash
printf 'pnpm %s\\n' "$*" >>"$FAKE_LOG"
if [[ "$1 $2" == "changeset pack" ]]; then cp "$FAKE_PLAN" "$4/publish-plan.json"; fi
if [[ "$1 $2" == "changeset publish" ]]; then
  node -e '
    const plan = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    for (const e of plan.plan.flat()) console.log(e.name + "=" + e.version);
  ' "$4/publish-plan.json" >>"$FAKE_STATE/published"
  while IFS== read -r name version; do git tag "$name@$version"; done <"$FAKE_STATE/published"
fi
exit 0
`;

interface Fixture {
  /** Each package of the checkout and its version. */
  versions: Record<string, string>;
  /** The packages whose manifest is private. */
  private?: string[];
  /** Each package npm holds and its `next`. */
  npm?: Record<string, string>;
  /** The publish plan `changeset pack` writes. */
  plan?: unknown;
}

async function wizard(fixture: Fixture, args: string[], input = "") {
  const root = await tempDir("first-publish");
  const checkout = join(root, "checkout");
  const bin = join(root, "bin");
  const state = join(root, "state");
  await writeText(state, "log", "");
  await writeText(checkout, ".changeset/config.json", "{}\n");
  await writeText(
    checkout,
    ".changeset/pre.json",
    `${JSON.stringify({ mode: "pre", tag: "alpha" })}\n`,
  );
  for (const [name, version] of Object.entries(fixture.versions)) {
    const manifest = {
      name,
      version,
      ...(fixture.private?.includes(name) ? { private: true } : {}),
    };
    await writeText(
      checkout,
      `packages/${name}/package.json`,
      `${JSON.stringify(manifest)}\n`,
    );
  }
  const git = (...gitArgs: string[]) =>
    execFileSync(
      "git",
      ["-c", "user.name=t", "-c", "user.email=t@t", ...gitArgs],
      { cwd: checkout, encoding: "utf8" },
    );
  git("init", "-q", "-b", "master");
  git("add", "-A");
  git("commit", "-qm", "master");
  const origin = join(root, "origin.git");
  execFileSync("git", ["init", "-q", "--bare", origin]);
  git("remote", "add", "origin", origin);
  git("push", "-q", "origin", "master");

  for (const [name, text] of [
    ["npm", FAKE_NPM],
    ["pnpm", FAKE_PNPM],
    ...["wslview", "explorer.exe", "xdg-open", "open"].map((opener) => [
      opener,
      "#!/usr/bin/env bash\nexit 0\n",
    ]),
  ] as const) {
    await writeText(bin, name, text);
    await chmod(join(bin, name), 0o755);
  }
  await writeText(
    state,
    "plan.json",
    JSON.stringify(fixture.plan ?? publishPlan([])),
  );

  const result = spawnSync("bash", [WIZARD, ...args], {
    cwd: checkout,
    encoding: "utf8",
    input,
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH ?? ""}`,
      FAKE_LOG: join(state, "log"),
      FAKE_STATE: state,
      FAKE_PLAN: join(state, "plan.json"),
      FAKE_NPM_NEXT: Object.entries(fixture.npm ?? {})
        .map(([name, next]) => `${name}=${next}`)
        .join(" "),
    },
  });
  return {
    status: result.status,
    output: `${result.stdout}${result.stderr}`,
    log: await readFile(join(state, "log"), "utf8"),
    originTags: execFileSync("git", ["ls-remote", "--tags", origin], {
      encoding: "utf8",
    }),
  };
}

/** `entry` with a tarball holding its package.json, which has no peer. */
async function packed(entry: ReturnType<typeof publishEntry>) {
  const pack = await tempDir("first-publish-pack");
  await writeText(
    pack,
    "package/package.json",
    `${JSON.stringify({ name: entry.name, version: entry.version })}\n`,
  );
  execFileSync("tar", ["-czf", "package.tgz", "package"], { cwd: pack });
  return { ...entry, tarball: { path: join(pack, "package.tgz") } };
}

const firstFour = (version = "1.0.0-alpha.0") =>
  Object.fromEntries(FIRST_FOUR.map((name) => [name, version]));

/** The first four on npm and reforged-studio at `version`, as master holds. */
const laterPackage = (version: string): Fixture => ({
  versions: { ...firstFour("1.0.0-alpha.8"), "reforged-studio": version },
});

describe.skipIf(process.platform === "win32")(
  "the first-publish wizard",
  () => {
    describe("in its one-package mode", () => {
      const studio = ["--package", "reforged-studio", "--dry-run"];

      it("publishes the 1.0.0-alpha.N master holds, past alpha.0", async () => {
        const result = await wizard(laterPackage("1.0.0-alpha.3"), studio);
        expect(result.output).toContain(
          "First publish of reforged-studio@1.0.0-alpha.3",
        );
        expect(result.output).toContain("reforged-studio is at 1.0.0-alpha.3");
        expect(result.output).toContain("reforged-studio: not published yet");
        expect(result.output).toContain(
          "$ git ls-remote --tags origin refs/tags/reforged-studio@1.0.0-alpha.3",
        );
        expect(result.output).toContain(
          "Push the tags reforged-studio@1.0.0-alpha.3 to origin?",
        );
        expect(result.status).toBe(0);
      });

      it("publishes 1.0.0-alpha.0 as before", async () => {
        const result = await wizard(laterPackage("1.0.0-alpha.0"), studio);
        expect(result.output).toContain("reforged-studio is at 1.0.0-alpha.0");
        expect(result.status).toBe(0);
      });

      it("publishes nothing again when npm's next is that version", async () => {
        const result = await wizard(
          {
            ...laterPackage("1.0.0-alpha.3"),
            npm: { "reforged-studio": "1.0.0-alpha.3" },
          },
          studio,
        );
        expect(result.output).toContain(
          "reforged-studio: next is 1.0.0-alpha.3, already published",
        );
        expect(result.output).toContain("nothing to publish");
        expect(result.status).toBe(0);
      });

      it("refuses a package npm holds at another version", async () => {
        const result = await wizard(
          {
            ...laterPackage("1.0.0-alpha.3"),
            npm: { "reforged-studio": "1.0.0-alpha.2" },
          },
          studio,
        );
        expect(result.output).toContain(
          "reforged-studio: npm's next is 1.0.0-alpha.2, past the first publish.",
        );
        expect(result.status).toBe(1);
      });

      it("refuses a private package", async () => {
        const result = await wizard(
          { ...laterPackage("1.0.0-alpha.3"), private: ["reforged-studio"] },
          studio,
        );
        expect(result.output).toContain("reforged-studio is private");
        expect(result.status).toBe(1);
      });

      it.each([
        "0.0.0",
        "1.0.0",
        "1.1.0-alpha.0",
        "2.0.0-alpha.1",
        "1.0.0-beta.1",
        "1.0.0-alpha.01",
      ])(
        "refuses a version that is not a 1.0.0-alpha.N: %s",
        async (version) => {
          const result = await wizard(laterPackage(version), studio);
          expect(result.output).toContain(
            "The first version of reforged-studio is not applied: it must be at 1.0.0-alpha.N.",
          );
          expect(result.output).toContain(`reforged-studio is at ${version}`);
          expect(result.status).toBe(1);
        },
      );

      it.each([
        [
          "another version",
          publishEntry("reforged-studio", "1.0.0-alpha.2", "next"),
          "1.0.0-alpha.2 under 'next'",
        ],
        [
          "another dist-tag",
          publishEntry("reforged-studio", "1.0.0-alpha.3", "alpha"),
          "1.0.0-alpha.3 under 'alpha'",
        ],
      ])(
        "refuses a publish plan entry at %s, and publishes nothing",
        async (_, entry, found) => {
          const result = await wizard(
            {
              ...laterPackage("1.0.0-alpha.3"),
              plan: publishPlan([await packed(entry)]),
            },
            ["--package", "reforged-studio"],
            // The banner, stage 1, the npm username, the token, its 2FA.
            "\n\npaulo\ntoken\ny\n",
          );
          expect(result.output).toContain(
            `The publish plan has reforged-studio at ${found}, not 1.0.0-alpha.3 under 'next'.`,
          );
          expect(result.log).not.toContain("changeset publish");
          expect(result.status).toBe(1);
        },
      );

      it("publishes alpha.3, waits for npm's next at it and pushes its tag", async () => {
        const result = await wizard(
          {
            ...laterPackage("1.0.0-alpha.3"),
            plan: publishPlan([
              await packed(
                publishEntry("reforged-studio", "1.0.0-alpha.3", "next"),
              ),
            ]),
          },
          ["--package", "reforged-studio"],
          // Every pause, prompt and confirmation answered, yes to each.
          "y\n".repeat(20),
        );
        expect(result.output).toContain(
          "the publish plan: reforged-studio at 1.0.0-alpha.3 under 'next'",
        );
        expect(result.log).toContain("changeset publish");
        expect(result.output).toContain(
          "reforged-studio: next is 1.0.0-alpha.3",
        );
        expect(result.originTags).toContain(
          "refs/tags/reforged-studio@1.0.0-alpha.3",
        );
        expect(result.output).toContain(
          "reforged-studio is on npm with next at 1.0.0-alpha.3",
        );
        expect(result.status).toBe(0);
      });
    });

    describe("without --package", () => {
      it("publishes 1.0.0-alpha.0 of the first four", async () => {
        const result = await wizard({ versions: firstFour() }, ["--dry-run"]);
        expect(result.output).toContain("First publish of 1.0.0-alpha.0");
        expect(result.output).toContain(
          "the four packages are at 1.0.0-alpha.0",
        );
        expect(result.status).toBe(0);
      });

      it("refuses a package at another alpha", async () => {
        const result = await wizard(
          { versions: { ...firstFour(), "reforged-types": "1.0.0-alpha.3" } },
          ["--dry-run"],
        );
        expect(result.output).toContain(
          "every package must be at 1.0.0-alpha.0.",
        );
        expect(result.output).toContain("reforged-types is at 1.0.0-alpha.3");
        expect(result.status).toBe(1);
      });
    });
  },
);
