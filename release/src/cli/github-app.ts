/**
 * `github-app`: the repository's GitHub App, for the setup wizard
 * (`release/repo-setup.sh`).
 *
 * - `github-app url --repo <owner/name>` prints the page registering the App
 *   with the permissions the workflows need.
 * - `github-app check --repo <owner/name> --client-id <id> --private-key
 *   <file> [--installed]` authenticates as the App with a JWT signed by the
 *   key and checks it: owner, permissions, no webhook events; with
 *   `--installed`, also its installation on the repository. It prints what
 *   it read, the last line `Installation page: <url>`; never the key.
 *
 * Exit codes: 0 fine, 1 a check failed or GitHub could not be asked (the
 * reasons on stderr), 2 usage.
 */
import { readFile } from "node:fs/promises";
import {
  appJwt,
  checkApp,
  checkInstallation,
  formatPermissions,
  installationUrl,
  registrationUrl,
} from "../github-app.js";
import { isRepository } from "../repo-settings.js";
import {
  errorMessage,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE =
  "Usage: github-app url --repo <owner/name>\n" +
  "       github-app check --repo <owner/name> --client-id <id> --private-key <file> [--installed]\n";

const API_ROOT = "https://api.github.com";

export interface Context {
  fetcher: typeof fetch;
  now: () => Date;
}

type Options =
  | { command: "url"; repository: string }
  | {
      command: "check";
      repository: string;
      clientId: string;
      keyFile: string;
      installed: boolean;
    };

const VALUED = ["--repo", "--client-id", "--private-key"] as const;

/** The options of the arguments; `undefined` on a usage error. */
function parseArgs(args: readonly string[]): Options | undefined {
  const [command, ...rest] = args;
  const values = new Map<string, string>();
  let installed = false;
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i] ?? "";
    if (arg === "--installed" && command === "check" && !installed) {
      installed = true;
      continue;
    }
    const value = rest.at(i + 1);
    if (!(VALUED as readonly string[]).includes(arg) || values.has(arg)) {
      return undefined;
    }
    if (value === undefined || value === "" || value.startsWith("--")) {
      return undefined;
    }
    values.set(arg, value);
    i++;
  }
  const repository = values.get("--repo");
  if (repository === undefined || !isRepository(repository)) return undefined;
  if (command === "url") {
    return values.size === 1 ? { command, repository } : undefined;
  }
  const clientId = values.get("--client-id");
  const keyFile = values.get("--private-key");
  if (command !== "check" || clientId === undefined || keyFile === undefined) {
    return undefined;
  }
  return { command, repository, clientId, keyFile, installed };
}

/** `GET endpoint` as the App; the status and the parsed body. */
async function getAsApp(
  fetcher: typeof fetch,
  jwt: string,
  endpoint: string,
): Promise<{ status: number; body: unknown }> {
  const response = await fetcher(`${API_ROOT}${endpoint}`, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${jwt}`,
      "x-github-api-version": "2022-11-28",
      "user-agent": "reforged-ts-github-app",
    },
  });
  const text = await response.text();
  let body: unknown;
  try {
    body = text === "" ? null : JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status, body };
}

/** The `message` of an API error body, else the status. */
function apiMessage({ status, body }: { status: number; body: unknown }) {
  const message =
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
      ? `: ${body.message}`
      : "";
  return `${String(status)}${message}`;
}

async function check(
  options: Extract<Options, { command: "check" }>,
  output: Output,
  context: Context,
): Promise<number> {
  let jwt: string;
  try {
    jwt = appJwt(
      options.clientId,
      await readFile(options.keyFile, "utf8"),
      context.now(),
    );
  } catch (error) {
    output.stderr(
      `${options.keyFile} is not a readable private key (the .pem file the App's settings page downloads): ${errorMessage(error)}\n`,
    );
    return 1;
  }

  const answer = await getAsApp(context.fetcher, jwt, "/app");
  if (answer.status === 401) {
    output.stderr(
      `GitHub refuses the App's credentials (${apiMessage(answer)}): the client ID ${options.clientId} and the key in ${options.keyFile} are not of the same App, or the key was deleted. Copy the Client ID from the App's settings page and generate a new private key there.\n`,
    );
    return 1;
  }
  if (answer.status === 404) {
    output.stderr(
      `GitHub knows no App of client ID ${options.clientId} (${apiMessage(answer)}). Copy the Client ID from the App's settings page, not the App ID.\n`,
    );
    return 1;
  }
  if (answer.status !== 200) {
    output.stderr(`GET /app answered ${apiMessage(answer)}.\n`);
    return 1;
  }
  const app = checkApp(answer.body, options.repository);
  output.stdout(
    `The App ${app.slug} ("${app.name}"), owned by ${app.owner}.\n` +
      `Repository permissions: ${formatPermissions(app.permissions)}.\n` +
      `Webhook events: ${app.events.length === 0 ? "none" : app.events.join(", ")}.\n`,
  );
  const problems = [...app.problems];

  if (options.installed) {
    const endpoint = `/repos/${options.repository}/installation`;
    const installation = await getAsApp(context.fetcher, jwt, endpoint);
    if (installation.status === 404) {
      problems.push(
        `The App is not installed on ${options.repository}: install it from ${installationUrl(app.slug)}, Only select repositories → ${options.repository}.`,
      );
    } else if (installation.status !== 200) {
      problems.push(`GET ${endpoint} answered ${apiMessage(installation)}.`);
    } else {
      const found = checkInstallation(installation.body, options.repository);
      output.stdout(
        `Installed on ${found.account} (installation ${String(found.id)}), repository access: ${found.selection}.\n`,
      );
      problems.push(...found.problems);
    }
  }

  output.stdout(`Installation page: ${installationUrl(app.slug)}\n`);
  for (const problem of problems) output.stderr(`${problem}\n`);
  return problems.length === 0 ? 0 : 1;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { fetcher: fetch, now: () => new Date() },
): Promise<number> {
  const options = parseArgs(args);
  if (options === undefined) {
    output.stderr(USAGE);
    return 2;
  }
  if (options.command === "url") {
    output.stdout(`${registrationUrl(options.repository)}\n`);
    return 0;
  }
  try {
    return await check(options, output, context);
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
