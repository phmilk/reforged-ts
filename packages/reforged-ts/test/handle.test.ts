/** @noSelfInFile */

// The Handle base: one Wrapper object per Handle (identity), a more specific
// class replacing a less specific cached Wrapper (upgrade), and the creation
// error pointing at the line that called the creation member. Timer stands
// in for every Wrapper on the base.

import { describe, expect, it } from "reforged-test/lua";
import { Timer } from "../src/index";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

/** A Map project's own Wrapper class, extending a library Wrapper. */
class CountdownTimer extends Timer {
  public readonly label = "countdown";
}

/**
 * A Wrapper that keeps a creation argument in a field, as `QuestItem.quest`
 * does: the creation helper's detail and its init route.
 */
class NamedTimer extends Timer {
  public readonly purpose?: string;

  public static createNamed(purpose: string): NamedTimer {
    return this.expect(CreateTimer(), purpose, (timer) => {
      timer.purpose = purpose;
    });
  }
}

describe("Handle identity", () => {
  it("gives the same object for two lookups of one Handle", () => {
    const handle = CreateTimer();
    const first = Timer.fromHandle(handle);
    const second = Timer.fromHandle(handle);
    expect(first).toBeTruthy();
    expect(second).toBe(first);
    expect(first === second).toEqual(true);
  });

  it("finds a Wrapper used as a Map key again through a lookup", () => {
    const timer = Timer.create();
    const names = new Map<Timer, string>();
    names.set(timer, "respawn");
    const found = Timer.fromHandle(timer.handle);
    expect(found).toBe(timer);
    expect(found === undefined ? undefined : names.get(found)).toEqual(
      "respawn",
    );
  });

  it("gives undefined for an undefined Handle", () => {
    expect(Timer.fromHandle(undefined)).toBeUndefined();
  });
});

describe("Handle upgrade", () => {
  it("replaces a cached Wrapper with the more specific class requested", () => {
    const handle = CreateTimer();
    const plain = Timer.fromHandle(handle);
    const countdown = CountdownTimer.fromHandle(handle);
    expect(countdown === plain).toEqual(false);
    expect(countdown instanceof CountdownTimer).toEqual(true);
    expect(countdown?.label).toEqual("countdown");
    expect(Timer.fromHandle(handle)).toBe(countdown);
    expect(CountdownTimer.fromHandle(handle)).toBe(countdown);
  });

  it("keeps the replaced Wrapper usable", () => {
    const handle = CreateTimer();
    const plain = Timer.fromHandle(handle);
    CountdownTimer.fromHandle(handle);
    expect(plain?.handle).toBe(handle);
  });

  it("wraps a subclass creation in the subclass", () => {
    const countdown = CountdownTimer.create();
    expect(countdown instanceof CountdownTimer).toEqual(true);
    expect<Timer | undefined>(CountdownTimer.fromHandle(countdown.handle)).toBe(
      countdown,
    );
  });
});

describe("a failed creation", () => {
  it("points the error at the line that called the creation member", () => {
    const message = withNative(
      "CreateTimer",
      () => undefined,
      () =>
        raisedIn(() => {
          Timer.create();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Timer");
  });

  it("names the subclass a Map project created", () => {
    const message = withNative(
      "CreateTimer",
      () => undefined,
      () =>
        raisedIn(() => {
          CountdownTimer.create();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create CountdownTimer");
  });

  it("puts the detail in parentheses after the Wrapper's name", () => {
    const message = withNative(
      "CreateTimer",
      () => undefined,
      () =>
        raisedIn(() => {
          NamedTimer.createNamed("respawn");
        }),
    );
    expect(message).toEqual(
      "reforged-ts: failed to create NamedTimer (respawn)",
    );
  });
});

describe("the creation helper's init", () => {
  it("sets the fields of the new Wrapper before it is returned", () => {
    const timer = NamedTimer.createNamed("respawn");
    expect(timer.purpose).toEqual("respawn");
    expect(NamedTimer.fromHandle(timer.handle)).toBe(timer);
  });
});
