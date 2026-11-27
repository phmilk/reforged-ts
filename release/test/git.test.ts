import { describe, expect, it } from "vitest";
import { baseBranch } from "../src/git.js";

describe("baseBranch", () => {
  it.each([
    ["origin/next", "next"],
    ["refs/remotes/origin/master", "master"],
    ["refs/heads/next", "next"],
    ["master", "master"],
    ["origin/feat/1067-x", "feat/1067-x"],
  ])("reads %s as the branch %s", (ref, branch) => {
    expect(baseBranch(ref)).toBe(branch);
  });

  it("returns a ref that names no branch as given", () => {
    expect(baseBranch("HEAD")).toBe("HEAD");
    expect(baseBranch("upstream/next")).toBe("upstream/next");
  });
});
