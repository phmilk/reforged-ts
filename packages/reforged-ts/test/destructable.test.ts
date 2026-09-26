/** @noSelfInFile */

// Destructable on the Handle base: `create(options)` picks one of the 32
// creation Natives from five independent axes (dead, z, pitch-roll, skin,
// colour), passes the arguments in the Native's order and throws naming the
// rawcode; `skin` is set at creation; `setColor` and `setVertexColor` reach
// their Natives; `fromEvent` returns undefined when the game has nothing to
// give.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Destructable, type DestructableOptions } from "../src/index";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

const tree = FourCC("LTlt");
const skin = FourCC("ATtr");

/** The creation Native lines written while `body` runs. */
function creationsDuring(body: () => void): string[] {
  const before = stubCalls().length;
  body();
  return stubCalls()
    .slice(before)
    .filter((line) => line.includes("Destructable"));
}

/** One of the 32 combinations of the five axes. */
interface Combination {
  readonly dead: boolean;
  readonly z: boolean;
  readonly pitchRoll: boolean;
  readonly skin: boolean;
  readonly color: boolean;
}

/** Every combination of the five axes, the plain one first. */
function combinations(): Combination[] {
  const all: Combination[] = [];
  for (let bits = 0; bits < 32; bits++) {
    all.push({
      dead: (bits & 1) !== 0,
      z: (bits & 2) !== 0,
      pitchRoll: (bits & 4) !== 0,
      skin: (bits & 8) !== 0,
      color: (bits & 16) !== 0,
    });
  }
  return all;
}

/**
 * The Native a combination names, spelt as the Patch spells it: the order of
 * the suffix words differs between the families (`PitchRollWithColor`,
 * `WithSkinPitchRollColor`).
 */
function nativeOf(combination: Combination): string {
  const { dead, z, pitchRoll, skin, color } = combination;
  let suffix = "";
  if (skin && pitchRoll && color) suffix = "WithSkinPitchRollColor";
  else if (skin && pitchRoll) suffix = "WithSkinPitchRoll";
  else if (skin && color) suffix = "WithSkinColor";
  else if (pitchRoll && color) suffix = "PitchRollWithColor";
  else if (skin) suffix = "WithSkin";
  else if (pitchRoll) suffix = "PitchRoll";
  else if (color) suffix = "WithColor";
  const prefix = pitchRoll || skin || color ? "Blz" : "";
  return `${prefix}Create${dead ? "Dead" : ""}Destructable${z ? "Z" : ""}${suffix}`;
}

/** The options of a combination: each present axis with a distinct value. */
function optionsOf(combination: Combination): DestructableOptions {
  return {
    typeId: tree,
    x: 1,
    y: 2,
    face: 90,
    scale: 2,
    variation: 4,
    ...(combination.dead ? { dead: true } : {}),
    ...(combination.z ? { z: 3 } : {}),
    ...(combination.pitchRoll ? { pitch: 30, roll: 15 } : {}),
    ...(combination.skin ? { skin } : {}),
    ...(combination.color ? { color: PLAYER_COLOR_RED } : {}),
  };
}

/** The call-log line of a combination: its arguments in the Native's order. */
function lineOf(combination: Combination): string {
  const args = [
    String(tree),
    "1",
    "2",
    ...(combination.z ? ["3"] : []),
    "90",
    ...(combination.pitchRoll ? ["15", "30"] : []),
    "2",
    "4",
    ...(combination.skin ? [String(skin)] : []),
    ...(combination.color ? ["PLAYER_COLOR_RED"] : []),
  ];
  return `${nativeOf(combination)}(${args.join(", ")})`;
}

describe("Destructable.create", () => {
  for (const combination of combinations()) {
    const native = nativeOf(combination);

    it(`creates with ${native}, the arguments in its order`, () => {
      let destructable: Destructable | undefined;
      const lines = creationsDuring(() => {
        destructable = Destructable.create(optionsOf(combination));
      });
      expect(lines).toEqual([lineOf(combination)]);
      expect(destructable?.skin).toEqual(combination.skin ? skin : undefined);
      expect(Destructable.fromHandle(destructable?.handle)).toBe(destructable);
    });

    it(`throws naming the rawcode when ${native} returns nil`, () => {
      const message = withNative(
        native as Parameters<typeof withNative>[0],
        () => undefined,
        () =>
          raisedIn(() => {
            Destructable.create(optionsOf(combination));
          }),
      );
      expect(message).toEqual(
        "reforged-ts: failed to create Destructable (LTlt)",
      );
    });
  }

  it("defaults the facing to 0, the scale to 1 and the variation to 0", () => {
    const lines = creationsDuring(() => {
      Destructable.create({ typeId: tree, x: 1, y: 2 });
    });
    expect(lines).toEqual([
      `CreateDestructable(${String(tree)}, 1, 2, 0, 1, 0)`,
    ]);
  });

  it("creates a living destructable when dead is false", () => {
    const lines = creationsDuring(() => {
      Destructable.create({ typeId: tree, x: 1, y: 2, dead: false });
    });
    expect(lines).toEqual([
      `CreateDestructable(${String(tree)}, 1, 2, 0, 1, 0)`,
    ]);
  });

  it("passes a roll of 0 when only the pitch is given", () => {
    const lines = creationsDuring(() => {
      Destructable.create({ typeId: tree, x: 1, y: 2, pitch: 30 });
    });
    expect(lines).toEqual([
      `BlzCreateDestructablePitchRoll(${String(tree)}, 1, 2, 0, 0, 30, 1, 0)`,
    ]);
  });

  it("passes a pitch of 0 when only the roll is given", () => {
    const lines = creationsDuring(() => {
      Destructable.create({ typeId: tree, x: 1, y: 2, roll: 15 });
    });
    expect(lines).toEqual([
      `BlzCreateDestructablePitchRoll(${String(tree)}, 1, 2, 0, 15, 0, 1, 0)`,
    ]);
  });
});

describe("Destructable colours", () => {
  it("setColor calls SetDestructableColor with the player colour", () => {
    const destructable = Destructable.create({ typeId: tree, x: 0, y: 0 });
    withNative(
      "SetDestructableColor",
      () => undefined,
      () => {
        destructable.setColor(PLAYER_COLOR_BLUE);
      },
    );
    expect(stubCalls()).toContainCall(
      `SetDestructableColor(${handleRef("destructable", destructable.handle)}, PLAYER_COLOR_BLUE)`,
    );
  });

  it("setVertexColor calls SetDestructableVertexColor with the red, green, blue and alpha", () => {
    const destructable = Destructable.create({ typeId: tree, x: 0, y: 0 });
    withNative(
      "SetDestructableVertexColor",
      () => undefined,
      () => {
        destructable.setVertexColor(255, 128, 0, 64);
      },
    );
    expect(stubCalls()).toContainCall(
      `SetDestructableVertexColor(${handleRef("destructable", destructable.handle)}, 255, 128, 0, 64)`,
    );
  });
});

describe("Destructable.fromEvent", () => {
  it("is undefined when GetTriggerDestructable returns nil", () => {
    expect(
      withNative(
        "GetTriggerDestructable",
        () => undefined,
        () => Destructable.fromEvent(),
      ),
    ).toBeUndefined();
  });

  it("is the Wrapper of the destructable GetTriggerDestructable returns", () => {
    const destructable = Destructable.create({ typeId: tree, x: 0, y: 0 });
    expect(
      withNative(
        "GetTriggerDestructable",
        () => destructable.handle,
        () => Destructable.fromEvent(),
      ),
    ).toBe(destructable);
  });
});
