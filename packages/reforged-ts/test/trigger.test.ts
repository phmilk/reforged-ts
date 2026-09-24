/** @noSelfInFile */

// Trigger on the Handle base: creation throws, lookup returns undefined.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Trigger } from "../src/index";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

describe("Trigger.create", () => {
  it("wraps the handle CreateTrigger returns, and a lookup finds it", () => {
    const trigger = Trigger.create();
    expect(stubCalls()).toContainCall("CreateTrigger()");
    expect(Trigger.fromHandle(trigger.handle)).toBe(trigger);
  });

  it("throws when CreateTrigger returns nil", () => {
    const message = withNative(
      "CreateTrigger",
      () => undefined,
      () =>
        raisedIn(() => {
          Trigger.create();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Trigger");
  });
});

describe("Trigger.fromEvent", () => {
  it("is undefined when GetTriggeringTrigger returns nil", () => {
    const trigger = withNative(
      "GetTriggeringTrigger",
      () => undefined,
      () => Trigger.fromEvent(),
    );
    expect(trigger).toBeUndefined();
  });

  it("wraps the triggering trigger, the same object a lookup finds", () => {
    const handle = CreateTrigger();
    const trigger = withNative(
      "GetTriggeringTrigger",
      () => handle,
      () => Trigger.fromEvent(),
    );
    expect(trigger?.handle).toBe(handle);
    expect(Trigger.fromHandle(handle)).toBe(trigger);
  });
});
