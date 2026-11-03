/**
 * The page's edit of a list of models (#839): the model the picker adds to
 * a `modelList` field's value.
 */
import { describe, expect, it } from "vitest";
import { addModel } from "../page/model-list.js";

describe("addModel", () => {
  it("adds the model at the end of the list", () => {
    expect(addModel("A.mdl,B.mdl", "C.mdx")).toBe("A.mdl,B.mdl,C.mdx");
  });

  it("gives the model alone to an empty list", () => {
    expect(addModel("", "C.mdx")).toBe("C.mdx");
  });

  it("trims the entries and drops the empty ones", () => {
    expect(addModel(" A.mdl, ,B.mdl, ", "C.mdx")).toBe("A.mdl,B.mdl,C.mdx");
  });

  it("leaves out a model the list holds, without regard to case", () => {
    expect(addModel("A.mdl,b.MDL", "B.mdl")).toBe("A.mdl,b.MDL");
  });
});
