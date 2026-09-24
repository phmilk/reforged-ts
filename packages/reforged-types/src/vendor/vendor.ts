/**
 * The vendor step: resolves a jass-history tag to its commit and stores the
 * three Patch files at that commit, byte for byte, in a folder named after
 * the Build, with the provenance file next to them.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { BUILD_PATTERN, isCommit } from "../build.js";
import { SOURCES, type SourceName } from "../model.js";
import {
  fileRecord,
  parseProvenance,
  PROVENANCE_FILE,
  serializeProvenance,
  type Provenance,
} from "../provenance.js";

/**
 * Fetches a URL and returns the response body, failing on any non-success
 * answer. Every network access of the vendor step (tag resolution and file
 * download) goes through it, so tests inject a fixture fetcher and never open
 * a connection.
 */
export type Fetcher = (
  url: string,
  options?: { accept?: string }
) => Promise<Uint8Array>;

/** A GitHub repository and the folder in it that holds the Patch files. */
export interface Upstream {
  owner: string;
  repo: string;
  path: string;
}

/** Luashine/jass-history: the raw Patch files of every Build, one tag each. */
export const JASS_HISTORY: Upstream = {
  owner: "Luashine",
  repo: "jass-history",
  path: "timeline/scripts",
};

export function upstreamUrl(upstream: Upstream): string {
  return `https://github.com/${upstream.owner}/${upstream.repo}`;
}

/**
 * GitHub API URL that answers with the bare commit hash when asked for
 * `application/vnd.github.sha`.
 */
export function tagCommitUrl(upstream: Upstream, tag: string): string {
  const { owner, repo } = upstream;
  const ref = encodeURIComponent(tag);
  return `https://api.github.com/repos/${owner}/${repo}/commits/${ref}`;
}

export function rawFileUrl(
  upstream: Upstream,
  commit: string,
  file: string
): string {
  const { owner, repo, path } = upstream;
  const host = "https://raw.githubusercontent.com";
  return `${host}/${owner}/${repo}/${commit}/${path}/${file}`;
}

const REFORGED_TAG = new RegExp(`^Reforged-v(${BUILD_PATTERN})(?:-|$)`);

/**
 * Reads the Build out of a jass-history tag:
 * `Reforged-v3.0.0.24268-w3-3a9d8f2` gives `3.0.0.24268`.
 */
export function patchFromTag(tag: string): string {
  const match = REFORGED_TAG.exec(tag);
  if (!match) {
    throw new Error(
      `"${tag}" is not a jass-history Reforged tag ` +
        "(expected Reforged-v<a.b.c.build>-...)"
    );
  }
  return match[1]!;
}

/** Default fetcher over the global `fetch`. */
export const httpFetcher: Fetcher = async (url, options) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "reforged-types-vendor",
      ...(options?.accept ? { Accept: options.accept } : {}),
    },
  });
  if (!response.ok) {
    throw new Error(
      `GET ${url} failed: ${response.status} ${response.statusText}`
    );
  }
  return new Uint8Array(await response.arrayBuffer());
};

export interface VendorOptions {
  /** jass-history tag to vendor. */
  tag: string;
  /** Holds one folder per vendored Patch (the package's `vendor/`). */
  vendorRoot: string;
  fetcher: Fetcher;
  /** Clock for the download date; defaults to now. */
  now?: Date;
  upstream?: Upstream;
}

export interface VendorResult {
  patchDir: string;
  provenance: Provenance;
  /**
   * The folder already held this tag at this commit with these exact bytes;
   * it is rewritten unchanged, download date included.
   */
  unchanged: boolean;
}

/**
 * Resolves the tag to a commit, downloads the three Patch files at that
 * commit, stores them byte for byte in `<vendorRoot>/<Build>/` and writes the
 * provenance file next to them. Nothing is written unless every download
 * succeeds. Vendoring a tag again that yields the same commit and bytes keeps
 * the recorded download date, so it leaves the folder byte for byte as it
 * was.
 */
export async function vendorTag(options: VendorOptions): Promise<VendorResult> {
  const upstream = options.upstream ?? JASS_HISTORY;
  const patch = patchFromTag(options.tag);

  const commitBytes = await options.fetcher(
    tagCommitUrl(upstream, options.tag),
    { accept: "application/vnd.github.sha" }
  );
  const commit = new TextDecoder().decode(commitBytes).trim();
  if (!isCommit(commit)) {
    const got = commit.slice(0, 80);
    throw new Error(
      `tag ${options.tag} did not resolve to a commit sha (got "${got}")`
    );
  }

  const contents = new Map<SourceName, Uint8Array>();
  for (const name of SOURCES) {
    const url = rawFileUrl(upstream, commit, name);
    contents.set(name, await options.fetcher(url));
  }

  const provenance: Provenance = {
    patch,
    tag: options.tag,
    commit,
    upstream: upstreamUrl(upstream),
    path: upstream.path,
    downloaded: (options.now ?? new Date()).toISOString().slice(0, 10),
    files: Object.fromEntries(
      SOURCES.map((name) => [name, fileRecord(contents.get(name)!)])
    ) as Provenance["files"],
  };

  const patchDir = join(options.vendorRoot, patch);
  const previous = await readPrevious(patchDir);
  const unchanged =
    previous !== undefined &&
    serializeProvenance({ ...previous, downloaded: provenance.downloaded }) ===
      serializeProvenance(provenance);
  if (unchanged) provenance.downloaded = previous.downloaded;
  await mkdir(patchDir, { recursive: true });
  for (const name of SOURCES) {
    await writeFile(join(patchDir, name), contents.get(name)!);
  }
  await writeFile(
    join(patchDir, PROVENANCE_FILE),
    serializeProvenance(provenance)
  );
  return { patchDir, provenance, unchanged };
}

/** The provenance already in the Patch folder, if there is a valid one. */
async function readPrevious(patchDir: string): Promise<Provenance | undefined> {
  try {
    return parseProvenance(
      await readFile(join(patchDir, PROVENANCE_FILE), "utf8")
    );
  } catch {
    return undefined;
  }
}
