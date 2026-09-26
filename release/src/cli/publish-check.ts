/**
 * `release:publish-check`: run by the release workflow's publish job before
 * it publishes. Checks that the job can request an OIDC token, that the
 * publishing tool does trusted publishing (pnpm 11, or npm 11.5.1 under
 * pnpm 10), and that every publishable package already exists on npm.
 * Prints one line per missing prerequisite. Exit codes: 0 ready, 1 a
 * prerequisite is missing or the registry cannot be asked, 2 usage.
 */
import { exec } from "node:child_process";
import { promisify } from "node:util";
import {
  checkPublish,
  ID_TOKEN_VARIABLE,
  onNpm,
  type PublishCheckInput,
} from "../publish-check.js";
import { readPublishablePackages, repositoryRoot } from "../workspace.js";
import {
  errorMessage,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = "Usage: release:publish-check\n";

export interface Context {
  root: string;
  env: Readonly<Record<string, string | undefined>>;
  /** The version a tool prints, or `null` when it cannot be run. */
  version: (tool: "pnpm" | "npm") => Promise<string | null>;
  fetcher: typeof fetch;
}

const run = promisify(exec);

/** `<tool> --version`, through a shell: on Windows both are `.cmd` shims. */
async function toolVersion(tool: "pnpm" | "npm"): Promise<string | null> {
  try {
    const { stdout } = await run(`${tool} --version`);
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    root: repositoryRoot,
    env: process.env,
    version: toolVersion,
    fetcher: fetch,
  },
): Promise<number> {
  if (args.length > 0) {
    output.stderr(USAGE);
    return 2;
  }

  let input: PublishCheckInput;
  try {
    const packages = await readPublishablePackages(context.root);
    input = {
      idToken: (context.env[ID_TOKEN_VARIABLE] ?? "") !== "",
      pnpm: await context.version("pnpm"),
      npm: await context.version("npm"),
      packages: await Promise.all(
        packages.map(async ({ name }) => ({
          name,
          onNpm: await onNpm(name, context.fetcher),
        })),
      ),
    };
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }

  const result = checkPublish(input);
  if (!result.ok) {
    output.stderr(result.problems.map((problem) => `${problem}\n`).join(""));
    return 1;
  }
  output.stdout(
    `Ready for trusted publishing: pnpm ${String(input.pnpm)}, npm ${String(input.npm)}, ` +
      `${input.packages.map(({ name }) => name).join(", ")} on npm.\n`,
  );
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
