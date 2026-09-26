/**
 * Luashine/jass-history, the repository the Typings vendor their Patch files
 * from (one tag per Build): where it lives, the links to one of its commits,
 * and its full tag list through the GitHub tags API. The same repository as
 * the Typings generator's `packages/reforged-types/src/vendor/vendor.ts`,
 * which is not part of the published package and so is not imported.
 */
import { isRecord } from "./unknown.js";

export const JASS_HISTORY = {
  owner: "Luashine",
  repo: "jass-history",
  /** The folder that holds the Patch files. */
  path: "timeline/scripts",
} as const;

const REPOSITORY_URL = `https://github.com/${JASS_HISTORY.owner}/${JASS_HISTORY.repo}`;

/** A jass-history tag and the commit it points at (40 hex digits). */
export interface JassHistoryTag {
  name: string;
  commit: string;
}

/** The pages of jass-history a person follows to see a tag. */
export interface TagLinks {
  /** The tree at the tag. */
  tag: string;
  commit: string;
  /** The Patch files at the commit. */
  scripts: string;
}

export function tagLinks(tag: JassHistoryTag): TagLinks {
  return {
    tag: `${REPOSITORY_URL}/tree/${encodeURIComponent(tag.name)}`,
    commit: `${REPOSITORY_URL}/commit/${tag.commit}`,
    scripts: `${REPOSITORY_URL}/tree/${tag.commit}/${JASS_HISTORY.path}`,
  };
}

const API_ORIGIN = "https://api.github.com/";

/** The first page of the tags API, at its largest page size. */
export const TAGS_URL = `${API_ORIGIN}repos/${JASS_HISTORY.owner}/${JASS_HISTORY.repo}/tags?per_page=100`;

/** More pages than jass-history will ever have: a guard against a loop. */
const MAX_PAGES = 50;

const COMMIT = /^[0-9a-f]{40}$/;

/** The `rel="next"` URL of a `Link` header, if any. */
function nextPage(link: string | null): string | undefined {
  for (const part of link?.split(",") ?? []) {
    const match = /^\s*<([^>]+)>\s*;\s*rel="next"\s*$/.exec(part);
    if (match) return match[1];
  }
  return undefined;
}

/**
 * Every tag of jass-history, following the tags API's pages to the last
 * one; in the API's order, which nothing should rely on. `token`, when set,
 * authenticates the requests (the anonymous rate limit is shared by every
 * job of a GitHub-hosted runner's address). Throws when a page does not
 * answer 200 or is not a list of tags.
 */
export async function fetchTags(
  fetcher: typeof fetch = fetch,
  token?: string,
): Promise<JassHistoryTag[]> {
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": "reforged-ts-patch-watch",
    "x-github-api-version": "2022-11-28",
  };
  if (token !== undefined && token !== "") {
    headers.authorization = `Bearer ${token}`;
  }

  const tags: JassHistoryTag[] = [];
  let url: string | undefined = TAGS_URL;
  for (let page = 0; url !== undefined; page++) {
    if (page === MAX_PAGES) {
      throw new Error(
        `${TAGS_URL}: more than ${String(MAX_PAGES)} pages of tags.`,
      );
    }
    const response = await fetcher(url, { headers });
    if (!response.ok) {
      throw new Error(
        `GET ${url} answered ${String(response.status)} ${response.statusText}.`,
      );
    }
    const body = await response.json();
    if (!Array.isArray(body)) {
      throw new Error(`GET ${url} did not answer a list of tags.`);
    }
    for (const item of body) {
      const name = isRecord(item) ? item.name : undefined;
      const commit =
        isRecord(item) && isRecord(item.commit) ? item.commit.sha : undefined;
      if (
        typeof name !== "string" ||
        typeof commit !== "string" ||
        !COMMIT.test(commit)
      ) {
        throw new Error(
          `GET ${url} answered a tag without a name and a commit: ${JSON.stringify(item)}.`,
        );
      }
      tags.push({ name, commit });
    }
    url = nextPage(response.headers.get("link"));
    // The token goes to the API and nowhere else.
    if (url !== undefined && !url.startsWith(API_ORIGIN)) {
      throw new Error(`GET ${TAGS_URL}: the next page is off the API: ${url}.`);
    }
  }
  return tags;
}
