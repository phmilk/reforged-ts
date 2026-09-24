import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  PATCH_FILES,
  PROVENANCE_FILE,
  fileRecord,
  serializeProvenance,
  type PatchFileName,
  type Provenance,
} from "./provenance.js";

/**
 * Fetches a URL and returns the response body, failing on any non-success
 * answer. Every network access of the vendor command (tag resolution and file
 * download) goes through it, so tests inject a fixture fetcher and never open
 * a connection.
 */
export type Fetcher = (url: string, options?: { accept?: string }) => Promise<Uint8Array>;

/** A GitHub repository and the folder in it that holds the Patch files. */
export interface Upstream {
  owner: string;
  repo: string;
  path: string;
}

/** Luashine/jass-history: the raw Patch files of every game build, one tag per build. */
export const JASS_HISTORY: Upstream = {
  owner: "Luashine",
  repo: "jass-history",
  path: "timeline/scripts",
};

export function upstreamUrl(upstream: Upstream): string {
  return `https://github.com/${upstream.owner}/${upstream.repo}`;
}

/** GitHub API URL that answers with the bare commit sha when asked for `application/vnd.github.sha`. */
export function tagCommitUrl(upstream: Upstream, tag: string): string {
  return `https://api.github.com/repos/${upstream.owner}/${upstream.repo}/commits/${encodeURIComponent(tag)}`;
}

export function rawFileUrl(upstream: Upstream, commit: string, file: string): string {
  return `https://raw.githubusercontent.com/${upstream.owner}/${upstream.repo}/${commit}/${upstream.path}/${file}`;
}

/** Reads the Patch build out of a jass-history tag: `Reforged-v3.0.0.24268-w3-3a9d8f2` gives `3.0.0.24268`. */
export function patchFromTag(tag: string): string {
  const match = /^Reforged-v(\d+\.\d+\.\d+\.\d+)(?:-|$)/.exec(tag);
  if (!match) {
    throw new Error(`"${tag}" is not a jass-history Reforged tag (expected Reforged-v<a.b.c.build>-...)`);
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
  if (!response.ok) throw new Error(`GET ${url} failed: ${response.status} ${response.statusText}`);
  return new Uint8Array(await response.arrayBuffer());
};

export interface VendorOptions {
  /** jass-history tag to vendor. */
  tag: string;
  /** Folder holding one sub-folder per vendored Patch (the package's `vendor/`). */
  vendorRoot: string;
  fetcher: Fetcher;
  /** Clock for the download date; defaults to now. */
  now?: Date;
  upstream?: Upstream;
}

export interface VendorResult {
  patchDir: string;
  provenance: Provenance;
}

/**
 * Resolves the tag to a commit, downloads the three Patch files at that
 * commit, stores them byte for byte in `<vendorRoot>/<patch>/` and writes the
 * provenance file next to them. Nothing is written unless every download succeeds.
 */
export async function vendorTag(options: VendorOptions): Promise<VendorResult> {
  const upstream = options.upstream ?? JASS_HISTORY;
  const patch = patchFromTag(options.tag);

  const commitBytes = await options.fetcher(tagCommitUrl(upstream, options.tag), {
    accept: "application/vnd.github.sha",
  });
  const commit = new TextDecoder().decode(commitBytes).trim();
  if (!/^[0-9a-f]{40}$/.test(commit)) {
    throw new Error(`tag ${options.tag} did not resolve to a commit sha (got "${commit.slice(0, 80)}")`);
  }

  const contents = new Map<PatchFileName, Uint8Array>();
  for (const name of PATCH_FILES) {
    contents.set(name, await options.fetcher(rawFileUrl(upstream, commit, name)));
  }

  const provenance: Provenance = {
    patch,
    tag: options.tag,
    commit,
    upstream: upstreamUrl(upstream),
    path: upstream.path,
    downloaded: (options.now ?? new Date()).toISOString().slice(0, 10),
    files: Object.fromEntries(
      PATCH_FILES.map((name) => [name, fileRecord(contents.get(name)!)]),
    ) as Provenance["files"],
  };

  const patchDir = join(options.vendorRoot, patch);
  await mkdir(patchDir, { recursive: true });
  for (const name of PATCH_FILES) {
    await writeFile(join(patchDir, name), contents.get(name)!);
  }
  await writeFile(join(patchDir, PROVENANCE_FILE), serializeProvenance(provenance));
  return { patchDir, provenance };
}
