// The Nullability sweep's Slice `nullability-event-responses-2` (#387): the
// other 36 event responses in `common.j` order, `GetManipulatingUnit` to
// `BlzGetTriggerPlayerKey`, each called once outside its event
// (./nullability/nullable.ts), and what each call returned recorded
// (./nullability/case-runner.ts).
// `pnpm probe:nullability-report nullability-event-responses-2` turns its
// Result file into this Slice's section of the sweep report. An event
// response takes no argument and its cheap case needs no event, no input and
// no equipment item, so the Slice needs no Fixture and every case is of
// group a.

import type { ProbeContext } from "../game/probe";
import { runCases } from "./nullability/case-runner";
import { inGroupOrder } from "./nullability/expand";
import { eventResponseCase } from "./nullability/nullable";

/** The Slice's event responses, in `common.j` order, each with its call. */
const EVENT_RESPONSES: readonly [string, () => unknown][] = [
  ["GetManipulatingUnit", () => GetManipulatingUnit()],
  ["GetManipulatedItem", () => GetManipulatedItem()],
  ["GetEquippedItem", () => GetEquippedItem()],
  ["GetUnequippedItem", () => GetUnequippedItem()],
  ["BlzGetAbsorbingItem", () => BlzGetAbsorbingItem()],
  ["BlzGetStackingItemSource", () => BlzGetStackingItemSource()],
  ["BlzGetStackingItemTarget", () => BlzGetStackingItemTarget()],
  ["GetOrderedUnit", () => GetOrderedUnit()],
  ["GetOrderPointLoc", () => GetOrderPointLoc()],
  ["GetOrderTarget", () => GetOrderTarget()],
  ["GetOrderTargetDestructable", () => GetOrderTargetDestructable()],
  ["GetOrderTargetItem", () => GetOrderTargetItem()],
  ["GetOrderTargetUnit", () => GetOrderTargetUnit()],
  ["GetSpellAbilityUnit", () => GetSpellAbilityUnit()],
  ["GetSpellAbility", () => GetSpellAbility()],
  ["GetSpellTargetLoc", () => GetSpellTargetLoc()],
  ["GetSpellTargetDestructable", () => GetSpellTargetDestructable()],
  ["GetSpellTargetItem", () => GetSpellTargetItem()],
  ["GetSpellTargetUnit", () => GetSpellTargetUnit()],
  ["GetEventPlayerState", () => GetEventPlayerState()],
  ["GetTriggerUnit", () => GetTriggerUnit()],
  ["GetEventUnitState", () => GetEventUnitState()],
  ["GetEventDamageSource", () => GetEventDamageSource()],
  ["GetEventDetectingPlayer", () => GetEventDetectingPlayer()],
  ["GetEventTargetUnit", () => GetEventTargetUnit()],
  ["GetTriggerWidget", () => GetTriggerWidget()],
  ["GetTriggerDestructable", () => GetTriggerDestructable()],
  [
    "BlzGetTriggerPlayerMousePosition",
    () => BlzGetTriggerPlayerMousePosition(),
  ],
  ["BlzGetTriggerPlayerMouseButton", () => BlzGetTriggerPlayerMouseButton()],
  ["BlzGetEventDamageTarget", () => BlzGetEventDamageTarget()],
  ["BlzGetEventAttackType", () => BlzGetEventAttackType()],
  ["BlzGetEventDamageType", () => BlzGetEventDamageType()],
  ["BlzGetEventWeaponType", () => BlzGetEventWeaponType()],
  ["BlzGetTriggerFrame", () => BlzGetTriggerFrame()],
  ["BlzGetTriggerFrameEvent", () => BlzGetTriggerFrameEvent()],
  ["BlzGetTriggerPlayerKey", () => BlzGetTriggerPlayerKey()],
];

/**
 * The cases not to call, each as `<native> <case>`: a case that crashed the
 * game in an earlier run, named by the pending step `probe:read` printed.
 */
const SKIP: readonly string[] = [];

export function run(p: ProbeContext): void {
  const cases = inGroupOrder(
    ...EVENT_RESPONSES.map(([native, call]) => eventResponseCase(native, call)),
  );
  runCases(p, cases, { skip: SKIP });
}
