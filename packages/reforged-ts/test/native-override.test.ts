/** @noSelfInFile */

// The per-test Native override: one Native replaced for one callback, and the
// stub back in place afterwards, also when the callback throws.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";

describe("withNative", () => {
  const stub = GetHandleId;

  it("replaces the Native for the callback and returns what it returns", () => {
    const id = withNative(
      "GetHandleId",
      () => 7,
      () => GetHandleId(CreateTimer()),
    );
    expect(id).toEqual(7);
  });

  it("records the replacement's calls in the call log", () => {
    const timer = CreateTimer();
    withNative(
      "PauseTimer",
      () => undefined,
      () => {
        PauseTimer(timer);
      },
    );
    expect(stubCalls()).toContainCall(
      `PauseTimer(${handleRef("timer", timer)})`,
    );
  });

  it("restores the Native after the callback", () => {
    withNative(
      "GetHandleId",
      () => 7,
      () => undefined,
    );
    expect(GetHandleId).toBe(stub);
  });

  it("restores the Native when the callback throws", () => {
    expect(() =>
      withNative(
        "GetHandleId",
        () => 7,
        () => {
          throw new Error("callback failed");
        },
      ),
    ).toThrow("callback failed");
    expect(GetHandleId).toBe(stub);
  });

  it("leaves a Native no stub defines undefined again", () => {
    withNative(
      "PauseTimer",
      () => undefined,
      () => undefined,
    );
    expect(PauseTimer).toBeUndefined();
  });
});
