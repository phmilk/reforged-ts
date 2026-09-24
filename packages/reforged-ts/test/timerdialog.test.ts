/** @noSelfInFile */

// TimerDialog on the Handle base: `create` throws, `fromHandle` returns
// undefined for nothing.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Timer, TimerDialog } from "../src/index";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

describe("TimerDialog.create", () => {
  const timer = Timer.create();

  it("wraps the handle CreateTimerDialog returns, and a lookup finds it", () => {
    const dialog = TimerDialog.create(timer);
    expect(stubCalls()).toContainCall(
      `CreateTimerDialog(${handleRef("timer", timer.handle)})`,
    );
    expect(TimerDialog.fromHandle(dialog.handle)).toBe(dialog);
  });

  it("throws when CreateTimerDialog returns nil", () => {
    const message = withNative(
      "CreateTimerDialog",
      () => undefined,
      () =>
        raisedIn(() => {
          TimerDialog.create(timer);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create TimerDialog");
  });
});

describe("TimerDialog.fromHandle", () => {
  it("is undefined for an undefined Handle", () => {
    expect(TimerDialog.fromHandle(undefined)).toBeUndefined();
  });

  it("gives the same TimerDialog for two lookups of one Handle", () => {
    const handle = CreateTimerDialog(CreateTimer());
    const dialog = TimerDialog.fromHandle(handle);
    expect(dialog?.handle).toBe(handle);
    expect(TimerDialog.fromHandle(handle)).toBe(dialog);
  });
});
