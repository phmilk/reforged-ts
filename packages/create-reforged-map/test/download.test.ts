import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { create, type CreateResult } from "../src/create.js";
import { githubTemplate, TEMPLATE_REF, type Fetch } from "../src/template.js";
import {
  detachedFiles,
  listFiles,
  recordingRunner,
  tempDir,
  templateArchive,
} from "./support/template.js";

/** The tarball GitHub serves for the Template at `TEMPLATE_REF`. */
const URL = `https://codeload.github.com/phmilk/reforged-ts-template/tar.gz/${TEMPLATE_REF}`;

/** A fetch that records each URL and answers with `answer`. */
function fakeFetch(answer: () => Promise<Response>) {
  const urls: string[] = [];
  const fetch: Fetch = (url) => {
    urls.push(url);
    return answer();
  };
  return { fetch, urls };
}

/** The error `fetch` rejects with when the system cannot connect. */
function networkError(code: string, message: string): TypeError {
  return new TypeError("fetch failed", {
    cause: Object.assign(new Error(message), { code }),
  });
}

/** Runs `create` into a new temporary folder, downloading with `fetch`. */
async function createFrom(
  fetch: Fetch,
): Promise<{ result: CreateResult; folder: string; printed: string[] }> {
  const folder = join(await tempDir("target"), "my-map");
  const printed: string[] = [];
  const result = await create({
    answers: { folder, skipInstall: true, skipGit: true },
    template: githubTemplate({ fetch }),
    run: recordingRunner().run,
    print: (line) => printed.push(line),
    nodeVersion: "v24.0.0",
  });
  return { result, folder, printed };
}

describe("githubTemplate", () => {
  it("downloads the Template's tarball at the ref and writes it without its top-level folder", async () => {
    const archive = new Uint8Array(await readFile(await templateArchive()));
    const download = fakeFetch(() => Promise.resolve(new Response(archive)));
    const { result, folder, printed } = await createFrom(download.fetch);

    expect(result).toEqual({ ok: true, folder, committed: false });
    expect(download.urls).toEqual([URL]);
    expect(printed).toContain(
      `Writing the Template from GitHub, phmilk/reforged-ts-template at ${TEMPLATE_REF}`,
    );
    expect(await listFiles(folder)).toEqual(detachedFiles());
  });

  it("downloads another ref when given one", async () => {
    const download = fakeFetch(() =>
      Promise.resolve(new Response(null, { status: 404 })),
    );
    await githubTemplate({ ref: "v2", fetch: download.fetch })
      .write(await tempDir("staging"))
      .catch(() => undefined);

    expect(download.urls).toEqual([
      "https://codeload.github.com/phmilk/reforged-ts-template/tar.gz/v2",
    ]);
  });

  it.each([
    [
      "a ref that does not exist (404)",
      () => Promise.resolve(new Response("404: Not Found", { status: 404 })),
      `the Template has no ${TEMPLATE_REF} tag or branch on GitHub (https://github.com/phmilk/reforged-ts-template): ${URL} answered 404.`,
    ],
    [
      "an error status",
      () =>
        Promise.resolve(
          new Response("", { status: 503, statusText: "Service Unavailable" }),
        ),
      `GitHub answered 503 Service Unavailable for ${URL}. Try again later, or pass --template with a Template archive or folder.`,
    ],
    [
      "a host that does not resolve (offline)",
      () =>
        Promise.reject(
          networkError(
            "ENOTFOUND",
            "getaddrinfo ENOTFOUND codeload.github.com",
          ),
        ),
      "codeload.github.com does not resolve, so this machine looks offline (getaddrinfo ENOTFOUND codeload.github.com). Connect, then create the project again, or pass --template with a Template archive or folder.",
    ],
    [
      "a connection GitHub refuses (unreachable)",
      () =>
        Promise.reject(
          networkError(
            "ECONNREFUSED",
            "connect ECONNREFUSED 140.82.112.10:443",
          ),
        ),
      `GitHub cannot be reached at ${URL} (connect ECONNREFUSED 140.82.112.10:443). Check the connection, then create the project again, or pass --template with a Template archive or folder.`,
    ],
    [
      "a connection cut during the download",
      () =>
        Promise.resolve(
          new Response(
            new ReadableStream({
              start(controller) {
                controller.error(new TypeError("terminated"));
              },
            }),
          ),
        ),
      `GitHub cannot be reached at ${URL} (terminated). Check the connection, then create the project again, or pass --template with a Template archive or folder.`,
    ],
    [
      "an answer that is not a tarball",
      () => Promise.resolve(new Response("<html>a captive portal</html>")),
      `${URL} cannot be read: it ends before its last entry.`,
    ],
  ])(
    "stops at writing the Template on %s, saying so, and leaves no target",
    async (_what, answer, reason) => {
      const runner = recordingRunner();
      const folder = join(await tempDir("target"), "my-map");
      const result = await create({
        answers: { folder, skipInstall: false, skipGit: false },
        template: githubTemplate({ fetch: fakeFetch(answer).fetch }),
        run: runner.run,
        print: () => undefined,
      });

      expect(result).toEqual({
        ok: false,
        stage: "template",
        message: `The creation stopped at writing the Template: ${reason}`,
      });
      expect(await readdir(dirname(folder))).toEqual([]);
      expect(runner.commands.map(({ cwd }) => cwd)).toEqual([
        undefined,
        undefined,
      ]);
    },
  );
});
