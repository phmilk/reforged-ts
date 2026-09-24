import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type Fetcher,
  JASS_HISTORY,
  parseProvenance,
  patchFromTag,
  runVerify,
  vendorTag,
  verifyPatchDir,
} from "../src/vendor/index.js";

// A stand-in for jass-history: tags.json maps each tag to a commit, and
// <commit>/timeline/scripts/ holds the files at that commit (cheats.j included,
// which must never be vendored; common.ai has CRLF line ends on purpose).
const ARCHIVE = fileURLToPath(new URL("./fixtures/jass-history/", import.meta.url));
const TAG = "Reforged-v9.9.9.12345-w3-fixture";
const COMMIT = "0123456789abcdef0123456789abcdef01234567";
const NOW = new Date("2026-09-24T23:30:00Z");

const API = "https://api.github.com/repos/Luashine/jass-history/commits/";
const RAW = "https://raw.githubusercontent.com/Luashine/jass-history/";

/** Serves the fixture archive at the URLs the vendor module requests, and records them. */
function archiveFetcher(): Fetcher & { requests: string[] } {
  const requests: string[] = [];
  const fetcher = async (url: string, options?: { accept?: string }): Promise<Uint8Array> => {
    requests.push(url);
    if (url.startsWith(API)) {
      expect(options?.accept).toBe("application/vnd.github.sha");
      const tags = JSON.parse(await readFile(join(ARCHIVE, "tags.json"), "utf8")) as Record<string, string>;
      const commit = tags[decodeURIComponent(url.slice(API.length))];
      if (!commit) throw new Error(`GET ${url} failed: 422 Unprocessable Entity`);
      return new TextEncoder().encode(commit);
    }
    if (url.startsWith(RAW)) {
      return new Uint8Array(await readFile(join(ARCHIVE, url.slice(RAW.length))));
    }
    throw new Error(`unexpected URL ${url}`);
  };
  return Object.assign(fetcher, { requests });
}

const fixtureFile = (name: string) => readFile(join(ARCHIVE, COMMIT, "timeline/scripts", name));

let vendorRoot: string;

beforeEach(async () => {
  vendorRoot = await mkdtemp(join(tmpdir(), "reforged-types-vendor-"));
  // Any attempt to reach the network fails the test.
  vi.stubGlobal("fetch", () => {
    throw new Error("tests must not open a network connection");
  });
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await rm(vendorRoot, { recursive: true, force: true });
});

describe("patchFromTag", () => {
  it("reads the Patch build out of a jass-history tag", () => {
    expect(patchFromTag("Reforged-v3.0.0.24268-w3-3a9d8f2")).toBe("3.0.0.24268");
    expect(patchFromTag("Reforged-v3.0.0.24277-w3t-e38e03b")).toBe("3.0.0.24277");
  });

  it("rejects anything that is not a Reforged tag", () => {
    expect(() => patchFromTag("v1.26")).toThrow(/not a jass-history Reforged tag/);
    expect(() => patchFromTag("Reforged-v3.0.0")).toThrow(/not a jass-history Reforged tag/);
  });
});

describe("vendorTag", () => {
  it("resolves the tag, downloads the three Patch files at that commit and writes the provenance file", async () => {
    const fetcher = archiveFetcher();
    const { patchDir, provenance } = await vendorTag({ tag: TAG, vendorRoot, fetcher, now: NOW });

    expect(patchDir).toBe(join(vendorRoot, "9.9.9.12345"));
    expect(fetcher.requests).toEqual([
      `${API}${TAG}`,
      `${RAW}${COMMIT}/timeline/scripts/common.j`,
      `${RAW}${COMMIT}/timeline/scripts/blizzard.j`,
      `${RAW}${COMMIT}/timeline/scripts/common.ai`,
    ]);
    expect(await readFile(join(patchDir, "provenance.json"), "utf8")).toBe(
      `{
  "patch": "9.9.9.12345",
  "tag": "Reforged-v9.9.9.12345-w3-fixture",
  "commit": "0123456789abcdef0123456789abcdef01234567",
  "upstream": "https://github.com/Luashine/jass-history",
  "path": "timeline/scripts",
  "downloaded": "2026-09-24",
  "files": {
    "common.j": {
      "sha256": "fd5a7b59004af2a6db151a786791485e01fa03bbaf48019a92f0f5493ae26c4f",
      "bytes": 100
    },
    "blizzard.j": {
      "sha256": "3056ce29069164b6706f6e2df5a35ff9dd9cbb4ad8033f507dc0878e9b5c961b",
      "bytes": 134
    },
    "common.ai": {
      "sha256": "ff10503ac2388e65964ca63af72da57b4c769f2c2536f54050e6fb95a4f72875",
      "bytes": 120
    }
  }
}
`,
    );
    expect(parseProvenance(await readFile(join(patchDir, "provenance.json"), "utf8"))).toEqual(provenance);
  });

  it("stores the files byte for byte, CRLF included, and nothing else from the upstream folder", async () => {
    const { patchDir } = await vendorTag({ tag: TAG, vendorRoot, fetcher: archiveFetcher(), now: NOW });

    expect((await readdir(patchDir)).sort()).toEqual(["blizzard.j", "common.ai", "common.j", "provenance.json"]);
    for (const name of ["common.j", "blizzard.j", "common.ai"]) {
      expect((await readFile(join(patchDir, name))).equals(await fixtureFile(name))).toBe(true);
    }
    expect((await readFile(join(patchDir, "common.ai"), "latin1")).includes("\r\n")).toBe(true);
  });

  it("leaves a folder byte for byte as it was when the same tag is vendored again on a later day", async () => {
    const first = await vendorTag({ tag: TAG, vendorRoot, fetcher: archiveFetcher(), now: NOW });
    const before = await readFile(join(first.patchDir, "provenance.json"));

    const again = await vendorTag({
      tag: TAG,
      vendorRoot,
      fetcher: archiveFetcher(),
      now: new Date("2027-03-01T00:00:00Z"),
    });

    expect(first.unchanged).toBe(false);
    expect(again.unchanged).toBe(true);
    expect(again.provenance.downloaded).toBe("2026-09-24");
    expect((await readFile(join(again.patchDir, "provenance.json"))).equals(before)).toBe(true);
  });

  it("records the new download date when the stored provenance differs", async () => {
    const { patchDir } = await vendorTag({ tag: TAG, vendorRoot, fetcher: archiveFetcher(), now: NOW });
    const file = join(patchDir, "provenance.json");
    await writeFile(file, (await readFile(file, "utf8")).replace(/"bytes": \d+/, '"bytes": 1'));

    const again = await vendorTag({
      tag: TAG,
      vendorRoot,
      fetcher: archiveFetcher(),
      now: new Date("2027-03-01T00:00:00Z"),
    });

    expect(again.unchanged).toBe(false);
    expect(parseProvenance(await readFile(file, "utf8")).downloaded).toBe("2027-03-01");
  });

  it("fails on an unknown tag and writes nothing", async () => {
    await expect(
      vendorTag({ tag: "Reforged-v1.2.3.4-w3-missing", vendorRoot, fetcher: archiveFetcher(), now: NOW }),
    ).rejects.toThrow(/422/);
    expect(await readdir(vendorRoot)).toEqual([]);
  });

  it("fails when the tag does not resolve to a commit sha", async () => {
    const fetcher: Fetcher = async () => new TextEncoder().encode('{"message":"Not Found"}');
    await expect(vendorTag({ tag: TAG, vendorRoot, fetcher, now: NOW })).rejects.toThrow(
      /did not resolve to a commit sha/,
    );
    expect(await readdir(vendorRoot)).toEqual([]);
  });

  it("defaults to jass-history's timeline/scripts folder", () => {
    expect(JASS_HISTORY).toEqual({ owner: "Luashine", repo: "jass-history", path: "timeline/scripts" });
  });
});

describe("verify", () => {
  const silent = { log: () => {}, error: () => {} };

  async function vendored(): Promise<string> {
    return (await vendorTag({ tag: TAG, vendorRoot, fetcher: archiveFetcher(), now: NOW })).patchDir;
  }

  it("passes on an untouched Patch folder", async () => {
    const patchDir = await vendored();
    expect((await verifyPatchDir(patchDir)).problems).toEqual([]);
    expect(await runVerify([patchDir], silent)).toBe(0);
  });

  it("fails on a tampered file", async () => {
    const patchDir = await vendored();
    const original = await readFile(join(patchDir, "blizzard.j"));
    const tampered = Buffer.from(original);
    tampered[0] = tampered[0]! ^ 0x20;
    await writeFile(join(patchDir, "blizzard.j"), tampered);

    const { problems } = await verifyPatchDir(patchDir);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/^blizzard\.j: sha256 [0-9a-f]{64} does not match recorded 3056ce29/);
    expect(await runVerify([patchDir], silent)).toBe(1);
  });

  it("fails when line endings are converted", async () => {
    const patchDir = await vendored();
    const text = await readFile(join(patchDir, "common.ai"), "latin1");
    await writeFile(join(patchDir, "common.ai"), text.replaceAll("\r\n", "\n"), "latin1");

    const { problems } = await verifyPatchDir(patchDir);
    expect(problems.map((p) => p.split(":")[0])).toEqual(["common.ai", "common.ai"]);
    expect(problems[1]).toBe("common.ai: 118 bytes, recorded 120");
  });

  it("fails on a missing file", async () => {
    const patchDir = await vendored();
    await rm(join(patchDir, "common.j"));
    expect((await verifyPatchDir(patchDir)).problems).toEqual(["common.j: missing"]);
    expect(await runVerify([patchDir], silent)).toBe(1);
  });

  it("fails on a missing or malformed provenance file", async () => {
    const patchDir = await vendored();
    await writeFile(join(patchDir, "provenance.json"), '{ "patch": "9.9.9.12345" }\n');
    await expect(verifyPatchDir(patchDir)).rejects.toThrow(/field "tag" must be a string/);
    expect(await runVerify([patchDir], silent)).toBe(1);
    expect(await runVerify([join(vendorRoot, "absent")], silent)).toBe(1);
    expect(await runVerify([], silent)).toBe(1);
  });
});
