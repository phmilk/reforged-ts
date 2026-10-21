/**
 * Where the Template comes from. A source writes the Template's files into
 * an empty folder; `create` never knows whether they came from an archive,
 * a folder or a download.
 */
import { cp, readFile, stat } from "node:fs/promises";
import { basename } from "node:path";
import { ArchiveError, extractArchive } from "./tar.js";

/** The Template's files, from somewhere. */
export interface TemplateSource {
  /** Where it comes from, for the messages: "the archive t.tar.gz". */
  description: string;
  /** Writes the Template's files into the empty folder `folder`. */
  write: (folder: string) => Promise<void>;
}

/**
 * The Template's repository on GitHub: the one the release gate clones,
 * which a test of the release scripts holds equal to it.
 */
export const TEMPLATE_REPOSITORY = "phmilk/reforged-ts-template";

/**
 * The Template ref the CLI downloads: `v<major>`, the line the release gate
 * checks out for the library's major (`templateRef` in the release scripts).
 * A test of the release scripts holds it equal to `templateRef` of the
 * library's version in the workspace, so it moves with the library's major.
 */
export const TEMPLATE_REF = "v1";

/** Fetches a URL: the global `fetch`, or a test's stand-in. */
export type Fetch = (url: string) => Promise<Response>;

/**
 * What a folder source leaves out: the Template checkout's own git
 * repository, and what its install writes.
 */
const NOT_COPIED = new Set([".git", "node_modules"]);

/** The error codes of a host name that does not resolve: offline, mostly. */
const NO_HOST = new Set(["ENOTFOUND", "EAI_AGAIN"]);

/**
 * The Template at `path` on this machine: a tar archive, gzipped or not,
 * whose one top-level folder is left out (GitHub's tarball of a ref, or
 * `git archive --prefix`), or a folder whose files are copied but for
 * `.git` and `node_modules`.
 */
export function localTemplate(path: string): TemplateSource {
  return {
    description: path,
    write: async (folder) => {
      const found = await stat(path).catch(() => null);
      if (found === null)
        throw new Error(`there is no file or folder ${path}.`);
      if (found.isDirectory()) {
        await cp(path, folder, {
          recursive: true,
          filter: (source) => !NOT_COPIED.has(basename(source)),
        });
      } else {
        await extract(await readFile(path), folder, path);
      }
    },
  };
}

/**
 * The Template downloaded from GitHub: the tarball of `TEMPLATE_REPOSITORY`
 * at `ref`, its top-level folder left out. A download that fails says
 * whether the host does not resolve (offline), GitHub cannot be reached or
 * answers an error, or the ref does not exist.
 */
export function githubTemplate(
  options: { ref?: string; fetch?: Fetch } = {},
): TemplateSource {
  const ref = options.ref ?? TEMPLATE_REF;
  const download = options.fetch ?? fetch;
  const url = `https://codeload.github.com/${TEMPLATE_REPOSITORY}/tar.gz/${ref}`;
  return {
    description: `GitHub, ${TEMPLATE_REPOSITORY} at ${ref}`,
    write: async (folder) => {
      const failed = (error: unknown) =>
        new Error(networkMessage(url, error), { cause: error });
      const response = await download(url).catch((error: unknown) => {
        throw failed(error);
      });
      if (response.status === 404) {
        throw new Error(
          `the Template has no ${ref} tag or branch on GitHub (https://github.com/${TEMPLATE_REPOSITORY}): ${url} answered 404.`,
        );
      }
      if (!response.ok) {
        const status = `${String(response.status)} ${response.statusText}`;
        throw new Error(
          `GitHub answered ${status.trim()} for ${url}. Try again later, or pass --template with a Template archive or folder.`,
        );
      }
      const bytes = await response.arrayBuffer().catch((error: unknown) => {
        throw failed(error);
      });
      await extract(new Uint8Array(bytes), folder, url);
    },
  };
}

/** Writes the archive `bytes`, read from `from`, into `folder`. */
async function extract(
  bytes: Uint8Array,
  folder: string,
  from: string,
): Promise<void> {
  try {
    await extractArchive(bytes, folder);
  } catch (error) {
    if (!(error instanceof ArchiveError)) throw error;
    throw new Error(`${from} cannot be read: ${error.message}.`, {
      cause: error,
    });
  }
}

/** Why the download of `url` failed with the network error `error`. */
function networkMessage(url: string, error: unknown): string {
  // fetch rejects with "fetch failed", the system's error as its cause.
  const cause =
    error instanceof Error && error.cause instanceof Error
      ? error.cause
      : error;
  const code =
    cause instanceof Error && "code" in cause && typeof cause.code === "string"
      ? cause.code
      : undefined;
  const reason = cause instanceof Error ? cause.message : String(cause);
  const host = new URL(url).host;
  if (code !== undefined && NO_HOST.has(code)) {
    return `${host} does not resolve, so this machine looks offline (${reason}). Connect, then create the project again, or pass --template with a Template archive or folder.`;
  }
  return `GitHub cannot be reached at ${url} (${reason}). Check the connection, then create the project again, or pass --template with a Template archive or folder.`;
}
