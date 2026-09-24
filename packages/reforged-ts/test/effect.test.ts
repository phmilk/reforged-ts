/** @noSelfInFile */

// Effect on the Handle base: its four creation members throw naming the
// model path (or the ability id of a spell effect), lookups return undefined.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Effect, Widget } from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

const target = defined(
  Widget.fromHandle(
    CreateUnit(defined(Player(0), "player 0"), FourCC("hfoo"), 0, 0, 0),
  ),
  "the target widget",
);
const caster = defined(ConvertEffectType(1), "the caster effect type");
const thunderClap = FourCC("AHtc");

describe("Effect", () => {
  it("is the same object for its handle", () => {
    const effect = Effect.create("model.mdx", 0, 0);
    expect(Effect.fromHandle(effect.handle)).toBe(effect);
    const byEffect = new Map<Effect, string>([[effect, "found"]]);
    expect(
      byEffect.get(defined(Effect.fromHandle(effect.handle), "the lookup")),
    ).toEqual("found");
  });

  it("is undefined for an undefined handle", () => {
    expect(Effect.fromHandle(undefined)).toBeUndefined();
  });

  it("wraps a handle it did not create", () => {
    const handle = AddSpecialEffect("model.mdx", 0, 0);
    const effect = Effect.fromHandle(handle);
    expect(effect?.handle).toBe(handle);
    expect(Effect.fromHandle(handle)).toBe(effect);
  });
});

describe("Effect.create", () => {
  it("wraps the handle AddSpecialEffect returns, and a lookup finds it", () => {
    const effect = Effect.create("model.mdx", 16, 32);
    expect(stubCalls()).toContainCall('AddSpecialEffect("model.mdx", 16, 32)');
    expect(Effect.fromHandle(effect.handle)).toBe(effect);
  });

  it("throws naming the model path when AddSpecialEffect returns nil", () => {
    const message = withNative(
      "AddSpecialEffect",
      () => undefined,
      () =>
        raisedIn(() => {
          Effect.create("missing.mdx", 16, 32);
        }),
    );
    expect(message).toEqual(
      "reforged-ts: failed to create Effect (missing.mdx)",
    );
  });
});

describe("Effect.createAttachment", () => {
  it("wraps the handle AddSpecialEffectTarget returns and keeps its target", () => {
    const effect = Effect.createAttachment("model.mdx", target, "origin");
    expect(stubCalls()).toContainCall(
      `AddSpecialEffectTarget("model.mdx", ${handleRef("unit", target.handle)}, "origin")`,
    );
    expect(effect.attachWidget).toBe(target);
    expect(effect.attachPointName).toEqual("origin");
    expect(Effect.fromHandle(effect.handle)).toBe(effect);
  });

  it("throws naming the model path when AddSpecialEffectTarget returns nil", () => {
    const message = withNative(
      "AddSpecialEffectTarget",
      () => undefined,
      () =>
        raisedIn(() => {
          Effect.createAttachment("missing.mdx", target, "origin");
        }),
    );
    expect(message).toEqual(
      "reforged-ts: failed to create Effect (missing.mdx)",
    );
  });
});

describe("Effect.createSpell", () => {
  it("wraps the handle AddSpellEffectById returns, and a lookup finds it", () => {
    const effect = Effect.createSpell(thunderClap, caster, 16, 32);
    expect(stubCalls()).toContainCall(
      `AddSpellEffectById(${tostring(thunderClap)}, ${handleRef("effecttype", caster)}, 16, 32)`,
    );
    expect(Effect.fromHandle(effect.handle)).toBe(effect);
  });

  it("throws naming the ability when AddSpellEffectById returns nil", () => {
    const message = withNative(
      "AddSpellEffectById",
      () => undefined,
      () =>
        raisedIn(() => {
          Effect.createSpell(thunderClap, caster, 16, 32);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Effect (AHtc)");
  });
});

describe("Effect.createSpellAttachment", () => {
  it("wraps the handle AddSpellEffectTargetById returns and keeps its target", () => {
    const effect = Effect.createSpellAttachment(
      thunderClap,
      caster,
      target,
      "origin",
    );
    expect(stubCalls()).toContainCall(
      `AddSpellEffectTargetById(${tostring(thunderClap)}, ${handleRef("effecttype", caster)}, ${handleRef("unit", target.handle)}, "origin")`,
    );
    expect(effect.attachWidget).toBe(target);
    expect(effect.attachPointName).toEqual("origin");
    expect(Effect.fromHandle(effect.handle)).toBe(effect);
  });

  it("throws naming the ability when AddSpellEffectTargetById returns nil", () => {
    const message = withNative(
      "AddSpellEffectTargetById",
      () => undefined,
      () =>
        raisedIn(() => {
          Effect.createSpellAttachment(thunderClap, caster, target, "origin");
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Effect (AHtc)");
  });
});
