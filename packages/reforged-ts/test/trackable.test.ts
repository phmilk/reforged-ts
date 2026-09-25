/** @noSelfInFile */

// Trackable on the Handle base: creation throws at the caller's line,
// lookups return undefined. `fromEvent` is observed by firing a Trigger
// registered for the trackable's hit event with a stubbed trigger context.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Trackable, Trigger } from "../src/index";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

const model = "Doodads/Cinematic/GlowingRunes/GlowingRunes0.mdl";

describe("Trackable.create", () => {
  it("records CreateTrackable, and a lookup finds the same object", () => {
    const trackable = Trackable.create(model, 128, -64, 270);
    expect(stubCalls()).toContainCall(
      `CreateTrackable("${model}", 128, -64, 270)`,
    );
    expect(Trackable.fromHandle(trackable.handle)).toBe(trackable);
  });

  it("throws at the caller's line when CreateTrackable returns nil", () => {
    const message = withNative(
      "CreateTrackable",
      () => undefined,
      () =>
        raisedIn(() => {
          Trackable.create("x.mdl", 0, 0, 0);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Trackable (x.mdl)");
  });
});

describe("Trackable.fromEvent", () => {
  it("is undefined outside a firing", () => {
    expect(Trackable.fromEvent()).toBeUndefined();
  });

  it("is the registry's object inside a trackable event", () => {
    const trackable = Trackable.create(model, 0, 0, 0);
    let seen: Trackable | undefined;
    const trigger = Trigger.create()
      .registerTrackableHit(trackable)
      .addAction(() => {
        seen = Trackable.fromEvent();
      });
    const ran = __stub_fire_trigger(trigger.handle, {
      GetTriggeringTrackable: trackable.handle,
    });
    expect(ran).toEqual(true);
    expect(seen).toBe(trackable);
  });
});
