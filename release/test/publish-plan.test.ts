import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  publishEntries,
  PublishPlanError,
  readPublishPlan,
} from "../src/publish-plan.js";
import { tempDir, writeText } from "./support/workspace.js";

const publish = (name: string) => ({
  kind: "publish",
  name,
  version: "1.0.0-alpha.1",
  access: "public",
  tag: "alpha",
});

describe("publishEntries", () => {
  it("lists the publish entries of every chunk in order, as the plan's own objects", () => {
    const first = publish("reforged-types");
    const second = publish("reforged-ts");
    const tagOnly = { kind: "tag-only", name: "private", version: "1.0.0" };
    const plan = { version: 1, plan: [[first, tagOnly], [second]] };

    const entries = publishEntries(plan);

    expect(entries).toEqual([first, second]);
    expect(entries[0]).toBe(first);
  });

  it("refuses what is not a Changesets 3 plan, naming its source", () => {
    expect(() => publishEntries({ version: 2, plan: [] })).toThrow(
      "The publish plan is not a version 1 Changesets plan.",
    );
    expect(() => publishEntries({ version: 1, plan: [{}] }, "p.json")).toThrow(
      "p.json is not a version 1 Changesets plan.",
    );
    expect(() =>
      publishEntries({ version: 1, plan: [[{ kind: "publish" }]] }),
    ).toThrow(PublishPlanError);
    expect(() =>
      publishEntries({ version: 1, plan: [[{ kind: "publish" }]] }),
    ).toThrow("neither a publish nor a tag-only one");
  });
});

describe("readPublishPlan", () => {
  it("reads the plan of a pack output, and names the file it cannot read", async () => {
    const dir = await tempDir("pack");
    await expect(readPublishPlan(dir)).rejects.toThrow(
      `Cannot read the publish plan ${join(dir, "publish-plan.json")}`,
    );

    await writeText(dir, "publish-plan.json", '{"version":1,"plan":[]}');
    expect(await readPublishPlan(dir)).toEqual({
      file: join(dir, "publish-plan.json"),
      plan: { version: 1, plan: [] },
    });
  });
});
