// The committed report is the one a fresh run on the real inputs writes: the
// library sources, the manifest of the library's Patch, and the committed
// configuration and exclusions. Regenerate it with `pnpm coverage:report`.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  realInput,
  repositoryRoot,
  REPORT_JSON_FILE,
  REPORT_MARKDOWN_FILE,
} from "../src/real-inputs.js";
import { coverageReport, type CoverageReport } from "../src/report.js";

const committed = (path: string) =>
  readFile(join(repositoryRoot, path), "utf8");

async function freshRun() {
  const result = await coverageReport(await realInput());
  if (!result.ok) throw new Error(result.message);
  return result;
}

describe("the committed report", () => {
  it("is what coverage:report writes today, as JSON and as Markdown", async () => {
    const fresh = await freshRun();

    expect(await committed(REPORT_JSON_FILE)).toBe(fresh.json);
    expect(await committed(REPORT_MARKDOWN_FILE)).toBe(fresh.markdown);
  });

  it("has no configuration or exclusion problem", async () => {
    const { report } = await freshRun();

    expect(report.problems).toEqual([]);
  });

  it("counts the common.j Natives of Patch 3.0.0.24268 against the 31 Wrappers", async () => {
    const { report } = await freshRun();

    expect(report.patch).toBe("3.0.0.24268");
    expect(report.totals.natives).toBe(1681);
    expect(report.wrappers).toHaveLength(31);
  });

  const covered = (report: CoverageReport, wrapper: string, name: string) =>
    report.wrappers
      .find((entry) => entry.wrapper === wrapper)
      ?.covered.find((native) => native.name === name);

  it("reports CreateUnit under MapPlayer, covered by Unit", async () => {
    const { report } = await freshRun();

    expect(covered(report, "MapPlayer", "CreateUnit")?.coveredBy).toEqual([
      "Unit",
    ]);
  });

  it("reports the hashtable Natives as unowned", async () => {
    const { report } = await freshRun();

    const hashtable = report.unowned.handleFirst.find(
      (group) => group.type === "hashtable",
    );
    expect(hashtable?.natives).toContain("LoadUnitHandle");
  });
});
