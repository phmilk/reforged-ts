/**
 * `release:template-clone`, programmatic entry point: a throwaway clone of
 * the Template at the ref a release is gated against, for the Template
 * gate. Before cloning it asks the remote for the ref, so the two missing
 * prerequisites fail with a message naming them: read access to the
 * Template while it is private, and its `v<major>` ref.
 */
import type { GitRunner } from "./git.js";

/** The Template repository, on GitHub. */
export const TEMPLATE_REPOSITORY = "phmilk/reforged-ts-template";

/** The environment variable holding the token that reads the Template. */
export const TOKEN_VARIABLE = "TEMPLATE_READ_TOKEN";

const TEMPLATE_URL = `https://github.com/${TEMPLATE_REPOSITORY}.git`;

/** `git ls-remote --exit-code` found no matching ref. */
const NO_MATCHING_REF = 2;

export interface CloneInput {
  /** The Template ref: `v<major>`, a tag or a branch. */
  ref: string;
  /** The folder to clone into. */
  into: string;
  /** A token that reads the Template; none while it is public. */
  token: string | undefined;
  git: GitRunner;
}

export type CloneResult = { ok: true } | { ok: false; message: string };

/**
 * The environment that authenticates git to github.com with `token`,
 * through configuration variables rather than the command line or the URL,
 * so the token appears in no argument and no message. It is never
 * interactive.
 */
export function gitEnvironment(
  token: string | undefined,
): Record<string, string> {
  const env: Record<string, string> = { GIT_TERMINAL_PROMPT: "0" };
  if (token === undefined || token === "") return env;
  const basic = Buffer.from(`x-access-token:${token}`).toString("base64");
  return {
    ...env,
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${basic}`,
  };
}

/**
 * Clones the Template at `ref` into `into`, shallow. Fails naming the
 * missing prerequisite when the Template cannot be read (no token, or one
 * that lacks access) or has no such ref.
 */
export async function cloneTemplate(input: CloneInput): Promise<CloneResult> {
  const env = gitEnvironment(input.token);
  const lookup = await input.git({
    args: [
      "ls-remote",
      "--exit-code",
      TEMPLATE_URL,
      `refs/tags/${input.ref}`,
      `refs/heads/${input.ref}`,
    ],
    env,
  });
  if (lookup === NO_MATCHING_REF) {
    return {
      ok: false,
      message:
        `The Template (${TEMPLATE_REPOSITORY}) has no ${input.ref} tag or branch. ` +
        `A release is gated against the Template ref named after the library major: ` +
        `create ${input.ref} on the Template commit that supports this release ` +
        `(git tag ${input.ref} <commit> && git push origin ${input.ref}), then re-run this job.`,
    };
  }
  if (lookup !== 0) {
    const hasToken = input.token !== undefined && input.token !== "";
    return {
      ok: false,
      message: hasToken
        ? `The token in ${TOKEN_VARIABLE} cannot read the Template (${TEMPLATE_REPOSITORY}), ` +
          `git ls-remote exit code ${String(lookup)}: check that it grants Contents: read ` +
          "on that repository and has not expired."
        : `Cannot read the Template (${TEMPLATE_REPOSITORY}) without a token, ` +
          `git ls-remote exit code ${String(lookup)}. While the Template is private, ` +
          `set the repository secret ${TOKEN_VARIABLE} to a fine-grained token with ` +
          "Contents: read on it.",
    };
  }
  const clone = await input.git({
    args: [
      "clone",
      "--quiet",
      "--depth",
      "1",
      "--branch",
      input.ref,
      TEMPLATE_URL,
      input.into,
    ],
    env,
  });
  if (clone !== 0) {
    return {
      ok: false,
      message: `git clone of the Template (${TEMPLATE_REPOSITORY}) at ${input.ref} into ${input.into} failed with exit code ${String(clone)}.`,
    };
  }
  return { ok: true };
}
