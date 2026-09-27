/**
 * The jass-history tag list as the tags API answered on 2026-09-25, and a
 * fake of that API serving it.
 */
import { readFile } from "node:fs/promises";
import type { JassHistoryTag } from "../../src/jass-history.js";

/** The snapshot, in the API's shape (the fields the watch reads). */
export const SNAPSHOT = JSON.parse(
  await readFile(
    new URL("../fixtures/jass-history-tags.json", import.meta.url),
    "utf8",
  ),
) as { name: string; commit: { sha: string } }[];

/** The snapshot, as the watch reads it. */
export const TODAY: JassHistoryTag[] = SNAPSHOT.map(({ name, commit }) => ({
  name,
  commit: commit.sha,
}));

/** The tags of `TODAY` named `names`, in that order. */
export function tags(...names: string[]): JassHistoryTag[] {
  return names.map((name) => {
    const tag = TODAY.find((candidate) => candidate.name === name);
    if (tag === undefined) throw new Error(`${name} is not in the snapshot`);
    return tag;
  });
}

export const LIVE_24268 = "Reforged-v3.0.0.24268-w3-3a9d8f2";
export const TEST_24277 = "Reforged-v3.0.0.24277-w3t-e38e03b";
export const LIVE_23745 = "Reforged-v2.0.4.23745-w3-9a94ff7";
export const TEST_23727 = "Reforged-v2.0.4.23727-w3t-bfa6462";
export const LIVE_23175 = "Reforged-v2.0.3.23175-w3-8ddf8a2";

/**
 * The tags API over `items`, `perPage` a page, linking each page to the
 * next as GitHub does; records the requests it answers in `requests`.
 */
export function tagsApi(
  items: readonly unknown[] = SNAPSHOT,
  perPage = 100,
  requests: Request[] = [],
): typeof fetch {
  return (input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const headers = new Headers();
    if (page * perPage < items.length) {
      url.searchParams.set("page", String(page + 1));
      headers.set(
        "link",
        `<${url.href}>; rel="next", <${url.href}>; rel="last"`,
      );
    }
    return Promise.resolve(
      Response.json(items.slice((page - 1) * perPage, page * perPage), {
        headers,
      }),
    );
  };
}
