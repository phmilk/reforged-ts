// The Natives Patch 3.0.1.24370 added to units and effects, measured for the
// Wrapper members that call them (#642): what `BlzUnitIsAlive` answers for a
// live, a dead and a removed unit beside `UnitAlive`, what `BlzUnitHeal`
// returns and does to the unit's life, that `BlzResetUnitTalents` runs on a
// unit without talents, and what an effect answers after `BlzRemoveEffect`.
// Each step runs under `pcall` after its PENDING line, so an error is a
// record and a crash names the step.

import type { ProbeContext } from "../game/probe";
import { deadUnit, liveUnit, removedUnit } from "./nullability/fixtures";

/** A model every install has, for an effect that plays at once. */
const MODEL = "Abilities\\Spells\\Human\\ThunderClap\\ThunderClapCaster.mdl";

/** Runs `step` under `pcall` and records what it returned or raised. */
function measure(
  p: ProbeContext,
  label: string,
  step: () => Record<string, string>,
): void {
  p.pending(label);
  const [ok, result] = pcall(step);
  if (ok) {
    p.record("step", { label, ...result });
  } else {
    p.record("step", { label, error: tostring(result) });
  }
  p.checkpoint();
}

function alive(p: ProbeContext, state: string, u: unit): void {
  measure(p, `alive ${state}`, () => ({
    UnitAlive: tostring(UnitAlive(u)),
    BlzUnitIsAlive: tostring(BlzUnitIsAlive(u)),
  }));
}

/**
 * Heals `u`, at `life` first, by `amount` from `source`, and records the
 * return and the life before and after.
 */
function heal(
  p: ProbeContext,
  label: string,
  u: unit,
  life: number,
  source: unit,
  amount: number,
  isItem: boolean,
  applyStatBonuses: boolean,
): void {
  measure(p, `heal ${label}`, () => {
    SetWidgetLife(u, life);
    const before = GetWidgetLife(u);
    const returned = BlzUnitHeal(u, source, amount, isItem, applyStatBonuses);
    return {
      before: tostring(before),
      returned: tostring(returned),
      after: tostring(GetWidgetLife(u)),
      max: tostring(BlzGetUnitMaxHP(u)),
    };
  });
}

export function run(p: ProbeContext): void {
  // Footmen of Player(0): 420 life, no talents, no hero attributes.
  const live = liveUnit();
  alive(p, "live", live);
  const dead = deadUnit();
  alive(p, "dead", dead);
  alive(p, "removed", removedUnit());

  const target = liveUnit();
  const other = liveUnit();
  heal(p, "self 50 from 100", target, 100, target, 50, false, true);
  heal(p, "other 50 from 100", target, 100, other, 50, false, true);
  heal(p, "item 50 from 100", target, 100, target, 50, true, true);
  heal(p, "no bonuses 50 from 100", target, 100, target, 50, false, false);
  heal(p, "past max 50 from 400", target, 400, target, 50, false, true);
  heal(p, "negative -50 from 300", target, 300, target, -50, false, true);
  measure(p, "heal dead", () => {
    const returned = BlzUnitHeal(dead, dead, 50, false, true);
    return {
      returned: tostring(returned),
      after: tostring(GetWidgetLife(dead)),
      alive: tostring(UnitAlive(dead)),
    };
  });

  measure(p, "reset talents", () => {
    BlzResetUnitTalents(live);
    return { done: "true" };
  });

  const effect = AddSpecialEffect(MODEL, 128, 256);
  measure(p, "remove effect", () => {
    BlzRemoveEffect(effect);
    return { done: "true" };
  });
  measure(p, "effect after remove", () => ({
    x: tostring(BlzGetLocalSpecialEffectX(effect)),
    handleId: tostring(GetHandleId(effect)),
  }));
  measure(p, "destroy after remove", () => {
    DestroyEffect(effect);
    return { done: "true" };
  });
}
