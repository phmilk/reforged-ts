import { describe, expect, it } from "vitest";
import {
  parseTag,
  planPatchWatch,
  type PatchWatchInput,
} from "../src/patch-watch.js";
import {
  LIVE_23175,
  LIVE_23745,
  LIVE_24268,
  tags,
  TEST_23727,
  TEST_24277,
  TODAY,
} from "./support/jass-history.js";

function plan(input: Partial<PatchWatchInput> & Pick<PatchWatchInput, "tags">) {
  return planPatchWatch({
    supported: "3.0.0.24268",
    vendored: [],
    reported: [],
    ...input,
  });
}

/** The reason each ignored tag carries, by tag. */
function reasons(result: ReturnType<typeof planPatchWatch>) {
  return Object.fromEntries(
    result.ignored.map(({ tag, reason }) => [tag, reason]),
  );
}

describe("parseTag", () => {
  it("reads the prefix, the Build and the qualifiers", () => {
    expect(parseTag(LIVE_24268)).toEqual({
      prefix: "Reforged",
      build: "3.0.0.24268",
      qualifiers: ["w3", "3a9d8f2"],
    });
    expect(parseTag("TFT-v1.31.1.12173")).toEqual({
      prefix: "TFT",
      build: "1.31.1.12173",
      qualifiers: [],
    });
  });

  it("returns null for a name without four numbers", () => {
    for (const name of [
      "baseline",
      "TFT-v1.27b-ru",
      "Beta-TFT-v315",
      "ROC-v1.02a-ru",
      "",
      "Reforged-v3.0.0",
      "Reforged-v3.0.0.24268-",
      "Reforged-v3.0.0.24268--w3",
      "Reforged-v3.0.0.24268 w3",
      "-v3.0.0.24268",
    ]) {
      expect(parseTag(name)).toBeNull();
    }
  });
});

describe("planPatchWatch", () => {
  it("plans nothing on today's tag list at the supported Patch", () => {
    const result = plan({ tags: TODAY, vendored: ["3.0.0.24268"] });

    expect(result.patch).toBeNull();
    expect(result.superseded).toEqual([]);
    expect(result.ignored).toHaveLength(TODAY.length);
  });

  it("plans 3.0.0.24268 from today's tag list below it with nothing vendored", () => {
    const result = plan({ tags: TODAY, supported: "3.0.0.24267" });

    expect(result.patch).toEqual({
      build: "3.0.0.24268",
      gameVersion: "3.0.0",
      tag: LIVE_24268,
      commit: "a392fc3d5e6c37980accbfc560b28387fc7d01bc",
      links: {
        tag: `https://github.com/Luashine/jass-history/tree/${LIVE_24268}`,
        commit:
          "https://github.com/Luashine/jass-history/commit/a392fc3d5e6c37980accbfc560b28387fc7d01bc",
        scripts:
          "https://github.com/Luashine/jass-history/tree/a392fc3d5e6c37980accbfc560b28387fc7d01bc/timeline/scripts",
      },
    });
    expect(result.superseded).toEqual([]);
  });

  it("ignores a test client tag above the supported Patch, naming its marker", () => {
    const result = plan({ tags: tags(TEST_24277, LIVE_24268) });

    expect(result.patch).toBeNull();
    expect(result.ignored).toContainEqual({
      tag: TEST_24277,
      reason: "test-client",
      message: expect.stringContaining("w3t") as unknown,
    });
  });

  it("ignores the beta client like the test client", () => {
    const result = plan({
      tags: tags("Reforged-v1.32.0.13369-w3b-ab0c8ee"),
      supported: "1.31.0.1",
    });

    expect(result.patch).toBeNull();
    expect(reasons(result)).toEqual({
      "Reforged-v1.32.0.13369-w3b-ab0c8ee": "test-client",
    });
  });

  it("plans the newest of two new live Builds and supersedes the other", () => {
    const result = plan({
      tags: tags(LIVE_24268, TEST_24277, LIVE_23745, TEST_23727, LIVE_23175),
      supported: "2.0.3.23175",
    });

    expect(result.patch).toMatchObject({
      build: "3.0.0.24268",
      tag: LIVE_24268,
    });
    expect(result.superseded).toEqual([
      expect.objectContaining({
        build: "2.0.4.23745",
        gameVersion: "2.0.4",
        tag: LIVE_23745,
        commit: "6bd66bd45987cea6842d86d16a26e10c9e85065b",
      }),
    ]);
    expect(reasons(result)).toEqual({
      [TEST_24277]: "test-client",
      [TEST_23727]: "test-client",
      [LIVE_23175]: "not-newer",
    });
  });

  it("does not report a vendored Build, even when the supported Patch lags behind", () => {
    const result = plan({
      tags: tags(LIVE_24268, LIVE_23745),
      supported: "2.0.3.23175",
      vendored: ["2.0.3.23175", "3.0.0.24268"],
    });

    expect(result.patch).toMatchObject({ build: "2.0.4.23745" });
    expect(result.superseded).toEqual([]);
    expect(reasons(result)).toEqual({ [LIVE_24268]: "vendored" });
  });

  it("plans nothing when the newest new Build is already reported", () => {
    const result = plan({
      tags: tags(LIVE_24268, LIVE_23745),
      supported: "2.0.3.23175",
      reported: ["3.0.0.24268"],
    });

    expect(result.patch).toBeNull();
    expect(result.superseded).toEqual([]);
    expect(reasons(result)).toEqual({
      [LIVE_24268]: "reported",
      [LIVE_23745]: "superseded-by-reported",
    });
  });

  it("ignores locale-only tags and baseline, saying they have no Build", () => {
    const result = plan({
      tags: tags("baseline", "TFT-v1.27b-ru", "ROC-v1.00-ru", "Beta-TFT-v315"),
    });

    expect(result.patch).toBeNull();
    expect(result.ignored).toEqual([
      {
        tag: "Beta-TFT-v315",
        reason: "no-build",
        message: expect.stringContaining("four-number Build") as unknown,
      },
      expect.objectContaining({ tag: "ROC-v1.00-ru", reason: "no-build" }),
      expect.objectContaining({ tag: "TFT-v1.27b-ru", reason: "no-build" }),
      expect.objectContaining({ tag: "baseline", reason: "no-build" }),
    ]);
  });

  it("compares Builds as numbers", () => {
    const above = plan({
      tags: [
        { name: "Reforged-v3.0.0.24277-w3", commit: "1".repeat(40) },
        { name: "Reforged-v3.0.0.24268-w3", commit: "2".repeat(40) },
      ],
      supported: "3.0.0.9999",
    });
    expect(above.patch).toMatchObject({ build: "3.0.0.24277" });
    expect(above.superseded).toMatchObject([{ build: "3.0.0.24268" }]);

    const wider = plan({
      tags: [
        { name: "TFT-v1.30.0.9900", commit: "3".repeat(40) },
        { name: "Reforged-v1.30.0.10000-w3", commit: "4".repeat(40) },
      ],
      supported: "1.30.0.9900",
    });
    expect(wider.patch).toMatchObject({ build: "1.30.0.10000" });
    expect(reasons(wider)).toEqual({ "TFT-v1.30.0.9900": "not-newer" });
  });

  it("plans only Reforged tags: a TFT tag above the supported Patch is ignored", () => {
    const result = plan({
      tags: tags("TFT-v1.31.1.12173"),
      supported: "1.30.0.9900",
    });

    expect(result.patch).toBeNull();
    expect(reasons(result)).toEqual({ "TFT-v1.31.1.12173": "not-reforged" });
  });

  it("takes a tag without a client marker for a live one", () => {
    const result = plan({
      tags: tags("Reforged-v1.36.1.20613", "Reforged-v1.36.0.20257"),
      supported: "1.35.0.20093",
    });

    expect(result.patch).toMatchObject({ tag: "Reforged-v1.36.1.20613" });
    expect(result.superseded).toMatchObject([
      { tag: "Reforged-v1.36.0.20257" },
    ]);
  });

  it("keeps one tag per Build, the one marked live, and ignores the others", () => {
    const result = plan({
      tags: tags(
        "Reforged-v1.32.10.18820",
        "Reforged-v1.32.10.18820-w3-aa2b20f",
      ),
      supported: "1.32.9.16589",
    });

    expect(result.patch).toMatchObject({
      tag: "Reforged-v1.32.10.18820-w3-aa2b20f",
    });
    expect(result.ignored).toEqual([
      {
        tag: "Reforged-v1.32.10.18820",
        reason: "duplicate",
        message: expect.stringContaining(
          "Reforged-v1.32.10.18820-w3-aa2b20f",
        ) as unknown,
      },
    ]);
  });

  it("takes a tag with a qualifier it does not know for a live one", () => {
    const result = plan({
      tags: [
        { name: "Reforged-v3.1.0.25000-w3-1a2b3c4-eu", commit: "5".repeat(40) },
        { name: "Reforged-v3.1.0.25001-ptr", commit: "6".repeat(40) },
        { name: "Reforged-v3.1.0.25002-eu-w3t", commit: "7".repeat(40) },
      ],
    });

    expect(result.patch).toMatchObject({ tag: "Reforged-v3.1.0.25001-ptr" });
    expect(result.superseded).toMatchObject([
      { tag: "Reforged-v3.1.0.25000-w3-1a2b3c4-eu" },
    ]);
    expect(reasons(result)).toEqual({
      "Reforged-v3.1.0.25002-eu-w3t": "test-client",
    });
  });

  it("never throws on a malformed tag, and ignores it", () => {
    const names = [
      "",
      "v3.0.0.24300",
      "Reforged-v3.0.0.24300-",
      "Reforged-v3.0.0.24300-w3-",
      "Reforged-v3.0.0.24300-w3--abc",
      "Reforged-v3.0.0.-1-w3",
      "Reforged-v3.0.0.24300-w3-3a9d8f2\n",
      "Reforged-v３.0.0.24300-w3",
      "Reforged-v3.0.0.24300-w3/../x",
    ];
    const result = plan({
      tags: names.map((name) => ({ name, commit: "7".repeat(40) })),
    });

    expect(result.patch).toBeNull();
    expect(result.ignored).toHaveLength(names.length);
  });

  it("lists the ignored tags in code-point order, whatever the input order", () => {
    const forward = plan({ tags: TODAY });
    const backward = plan({ tags: [...TODAY].reverse() });

    expect(backward).toEqual(forward);
    const names = forward.ignored.map(({ tag }) => tag);
    expect(names).toEqual(
      [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    );
  });
});
