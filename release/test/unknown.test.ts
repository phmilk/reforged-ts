import { describe, expect, it } from "vitest";
import { errorMessage } from "../src/unknown.js";

describe("errorMessage", () => {
  it("gives the message of an error without a cause", () => {
    expect(errorMessage(new Error("broken"))).toBe("broken");
  });

  it("gives a thrown value that is not an error as text", () => {
    expect(errorMessage(42)).toBe("42");
  });

  it("names the cause of a failed fetch, with its code", () => {
    const reset = Object.assign(new Error("read ECONNRESET"), {
      code: "ECONNRESET",
    });
    const certificate = Object.assign(
      new Error("unable to get local issuer certificate"),
      { code: "UNABLE_TO_GET_ISSUER_CERT_LOCALLY" },
    );
    expect(errorMessage(new TypeError("fetch failed", { cause: reset }))).toBe(
      "fetch failed (read ECONNRESET)",
    );
    expect(
      errorMessage(new TypeError("fetch failed", { cause: certificate })),
    ).toBe(
      "fetch failed (UNABLE_TO_GET_ISSUER_CERT_LOCALLY: unable to get local issuer certificate)",
    );
  });

  it("follows a chain of causes", () => {
    const inner = new Error("inner");
    const outer = new Error("outer", { cause: inner });
    expect(errorMessage(new Error("top", { cause: outer }))).toBe(
      "top (outer; inner)",
    );
  });
});
