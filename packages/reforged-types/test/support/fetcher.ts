import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Fetcher } from "../../src/vendor/index.js";

const API = "https://api.github.com/repos/Luashine/jass-history/commits/";
const RAW = "https://raw.githubusercontent.com/Luashine/jass-history/";

/**
 * A stand-in for jass-history at the URLs the vendor step requests: each
 * tag resolves to its commit, and a Patch file at a commit is read from the
 * folder given for that commit. Any other URL fails, and nothing reaches the
 * network.
 */
export function jassHistoryFetcher(
  tags: Record<string, { commit: string; folder: string }>,
): Fetcher {
  return async (url) => {
    if (url.startsWith(API)) {
      const tag = (tags as Partial<typeof tags>)[
        decodeURIComponent(url.slice(API.length))
      ];
      if (!tag) throw new Error(`GET ${url} failed: 422 Unprocessable Entity`);
      return new TextEncoder().encode(tag.commit);
    }
    const match = /^([0-9a-f]{40})\/timeline\/scripts\/([\w.]+)$/.exec(
      url.startsWith(RAW) ? url.slice(RAW.length) : "",
    );
    const folder = Object.values(tags).find(
      (tag) => tag.commit === match?.[1],
    )?.folder;
    if (!match || folder === undefined)
      throw new Error(`unexpected URL ${url}`);
    return new Uint8Array(await readFile(join(folder, match[2])));
  };
}
