import { describe, expect, it } from "vitest";
import { closingReferences } from "../src/closing-keywords.js";

const REPOSITORY = "phmilk/reforged-ts";
const ours = (...numbers: number[]) =>
  numbers.map((number) => ({ repository: REPOSITORY, number }));

describe("closingReferences", () => {
  it("reads each keyword GitHub documents, in any case, with or without a colon", () => {
    const body = [
      "close #1",
      "Closes #2",
      "CLOSED #3",
      "fix #4",
      "Fixes: #5",
      "FIXED: #6",
      "resolve #7",
      "Resolves #8",
      "resolved #9",
    ].join("\n");
    expect(closingReferences(body, REPOSITORY)).toEqual(
      ours(1, 2, 3, 4, 5, 6, 7, 8, 9),
    );
  });

  it("reads an issue of another repository by owner/name, and this one's in its own spelling", () => {
    expect(
      closingReferences(
        "Closes phmilk/reforged-ts-template#162 and closes PHMILK/Reforged-TS#7.",
        REPOSITORY,
      ),
    ).toEqual([
      { repository: "phmilk/reforged-ts-template", number: 162 },
      { repository: REPOSITORY, number: 7 },
    ]);
  });

  it("reads one issue per keyword, as GitHub does: a bare number after a comma closes nothing", () => {
    expect(
      closingReferences("Resolves #10, #11, resolves #12", REPOSITORY),
    ).toEqual(ours(10, 12));
  });

  it("names each issue once, in the order it first appears", () => {
    expect(
      closingReferences("Fixes #3. Closes #1. Closes #3.", REPOSITORY),
    ).toEqual(ours(3, 1));
  });

  it("reads no keyword inside a word, no mention without a keyword, and nothing in code", () => {
    const body = [
      "Prefixes #1 and unfixed #2, see #3.",
      "`Closes #4` is the line to write.",
      "```sh",
      "gh pr create --body 'Closes #5'",
      "```",
      "~~~",
      "Fixes #6",
      "~~~",
      "Closes #7",
    ].join("\n");
    expect(closingReferences(body, REPOSITORY)).toEqual(ours(7));
  });

  it("reads nothing from an empty or missing description", () => {
    expect(closingReferences("", REPOSITORY)).toEqual([]);
  });
});
