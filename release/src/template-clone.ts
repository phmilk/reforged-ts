/**
 * `release:template-clone`, programmatic entry point: a throwaway clone of
 * the Template at the ref a release is gated against, for the Template
 * gate. Before cloning it asks the remote for the ref, so a missing
 * `v<major>` ref fails with a message naming it. The Template is public:
 * git reads it without a token.
 */
import type { GitRunner } from "./git.js";

/** The Template repository, on GitHub. */
export const TEMPLATE_REPOSITORY = "phmilk/reforged-ts-template";

const TEMPLATE_URL = `https://github.com/${TEMPLATE_REPOSITORY}.git`;

/** `git ls-remote --exit-code` found no matching ref. */
const NO_MATCHING_REF = 2;

export interface CloneInput {
  /** The Template ref: `v<major>`, a tag or a branch. */
  ref: string;
  /** The folder to clone into. */
  into: string;
  git: GitRunner;
}

export type CloneResult = { ok: true } | { ok: false; message: string };

/**
 * The environment of the git commands: never interactive, so a Template git
 * cannot read fails instead of prompting for credentials.
 */
export const GIT_ENVIRONMENT: Readonly<Record<string, string>> = {
  GIT_TERMINAL_PROMPT: "0",
};

/**
 * Clones the Template at `ref` into `into`, shallow. Fails naming the ref
 * when the Template has no such ref, and saying so when git cannot read it.
 */
export async function cloneTemplate(input: CloneInput): Promise<CloneResult> {
  const env = GIT_ENVIRONMENT;
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
    return {
      ok: false,
      message:
        `Cannot read the Template (${TEMPLATE_REPOSITORY}), git ls-remote exit code ${String(lookup)}. ` +
        "The gate clones it without a token: check that the repository exists and is public.",
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
