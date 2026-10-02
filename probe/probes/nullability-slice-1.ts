// The Nullability sweep's first Slice: calls the handle-returning Natives
// whose Overlay entry says they never return nothing (`returns.nullable:
// false`), each directly through the Typings, in hand-listed cases, and
// records what each call returned (./nullability/case-runner.ts).
// `pnpm probe:nullability-report nullability-slice-1` turns its Result file
// into this Slice's section of the sweep report. Every case is listed here,
// to be read and reviewed without running anything; the arguments come from
// the Fixtures (./nullability/fixtures.ts), built before the cases run.
//
// Every (a) case runs before any (b) case, so a crash on a stale handle
// cannot hide the live results, and the (a) group goes on disk before the
// first (b) case. The (b) cases run from least to most risky, the destroyed
// boolexprs and frame last, each risky one after a checkpoint, so a crash
// keeps every result before it.

import type { ProbeContext } from "../game/probe";
import { runCases, type Case } from "./nullability/case-runner";
import {
  childFrame,
  deadUnit,
  destroyedBoolExpr,
  destroyedCondition,
  destroyedFrame,
  destroyedTrigger,
  freshCameraSetup,
  gameUiFrame,
  liveCondition,
  liveFilter,
  liveTrigger,
  liveUnit,
  neutralPassiveUnit,
  positionedCameraSetup,
  removedUnit,
  worldFrame,
} from "./nullability/fixtures";

/** The action `TriggerAddAction` adds: the trigger never fires, so it never runs. */
function noAction(): void {
  return;
}

/**
 * The cases, in the order they run, with the Fixtures they use, built
 * before any case runs: the (a) cases, live arguments, odd but well-typed
 * ones included; then the (b) cases, stale handles, from least to most
 * risky, a dead unit (still in the game) first, the destroyed boolexprs and
 * frame last.
 */
function sliceCases(): readonly Case[] {
  const footman = liveUnit();
  const neutral = neutralPassiveUnit();
  const child = childFrame();
  const gameUi = gameUiFrame();
  const world = worldFrame();
  const fresh = freshCameraSetup();
  const positioned = positionedCameraSetup();
  const trigger = liveTrigger();
  const condition = liveCondition();
  const otherCondition = liveCondition();
  const filter = liveFilter();
  const dead = deadUnit();
  const removed = removedUnit();
  const destroyed = destroyedTrigger();
  const frame = destroyedFrame();
  const live = liveCondition();
  const destroyedAndOperand = destroyedCondition();
  const destroyedOrOperand = destroyedBoolExpr();
  const destroyedNotOperand = destroyedCondition();
  return [
    // (a): live and odd values.
    {
      native: "CreateTimer",
      label: "one call",
      group: "a",
      call: () => CreateTimer(),
    },
    {
      native: "CreateTrigger",
      label: "one call",
      group: "a",
      call: () => CreateTrigger(),
    },
    {
      native: "CreateRegion",
      label: "one call",
      group: "a",
      call: () => CreateRegion(),
    },
    {
      native: "CreateCameraSetup",
      label: "one call",
      group: "a",
      call: () => CreateCameraSetup(),
    },
    {
      native: "GetLocalPlayer",
      label: "one call",
      group: "a",
      call: () => GetLocalPlayer(),
    },
    {
      native: "Location",
      label: "origin",
      group: "a",
      call: () => Location(0, 0),
    },
    // Far outside GetWorldBounds() of any map.
    {
      native: "Location",
      label: "outside the world",
      group: "a",
      call: () => Location(1e6, 1e6),
    },
    {
      native: "Rect",
      label: "normal rect",
      group: "a",
      call: () => Rect(0, 0, 512, 512),
    },
    {
      native: "Rect",
      label: "inverted rect",
      group: "a",
      call: () => Rect(512, 512, 0, 0),
    },
    {
      native: "Rect",
      label: "zero area rect",
      group: "a",
      call: () => Rect(256, 256, 256, 256),
    },
    {
      native: "Rect",
      label: "rect outside the world",
      group: "a",
      call: () => Rect(1e6, 1e6, 1e6 + 512, 1e6 + 512),
    },
    {
      native: "Condition",
      label: "TypeScript function",
      group: "a",
      call: () => Condition(() => true),
    },
    {
      native: "Filter",
      label: "TypeScript function",
      group: "a",
      call: () => Filter(() => true),
    },
    {
      native: "And",
      label: "two live operands",
      group: "a",
      call: () => And(condition, otherCondition),
    },
    {
      native: "And",
      label: "condition and filter",
      group: "a",
      call: () => And(condition, filter),
    },
    {
      native: "Or",
      label: "two live operands",
      group: "a",
      call: () => Or(condition, otherCondition),
    },
    {
      native: "Or",
      label: "condition and filter",
      group: "a",
      call: () => Or(condition, filter),
    },
    {
      native: "Not",
      label: "live operand",
      group: "a",
      call: () => Not(condition),
    },
    {
      native: "GetOwningPlayer",
      label: "unit of player 0",
      group: "a",
      call: () => GetOwningPlayer(footman),
    },
    {
      native: "GetOwningPlayer",
      label: "Neutral Passive unit",
      group: "a",
      call: () => GetOwningPlayer(neutral),
    },
    {
      native: "GetUnitLoc",
      label: "live unit",
      group: "a",
      call: () => GetUnitLoc(footman),
    },
    {
      native: "BlzFrameGetParent",
      label: "created child frame",
      group: "a",
      call: () => BlzFrameGetParent(child),
    },
    {
      native: "BlzFrameGetParent",
      label: "game UI frame",
      group: "a",
      call: () => BlzFrameGetParent(gameUi),
    },
    {
      native: "BlzFrameGetParent",
      label: "world frame",
      group: "a",
      call: () => BlzFrameGetParent(world),
    },
    {
      native: "CameraSetupGetDestPositionLoc",
      label: "fresh setup",
      group: "a",
      call: () => CameraSetupGetDestPositionLoc(fresh),
    },
    {
      native: "CameraSetupGetDestPositionLoc",
      label: "positioned setup",
      group: "a",
      call: () => CameraSetupGetDestPositionLoc(positioned),
    },
    {
      native: "TriggerAddAction",
      label: "live trigger",
      group: "a",
      call: () => TriggerAddAction(trigger, noAction),
    },
    // (b): stale handles.
    {
      native: "GetOwningPlayer",
      label: "dead unit",
      group: "b",
      checkpoint: true,
      call: () => GetOwningPlayer(dead),
    },
    {
      native: "GetUnitLoc",
      label: "dead unit",
      group: "b",
      call: () => GetUnitLoc(dead),
    },
    {
      native: "GetOwningPlayer",
      label: "removed unit",
      group: "b",
      checkpoint: true,
      call: () => GetOwningPlayer(removed),
    },
    {
      native: "GetUnitLoc",
      label: "removed unit",
      group: "b",
      checkpoint: true,
      call: () => GetUnitLoc(removed),
    },
    {
      native: "TriggerAddAction",
      label: "destroyed trigger",
      group: "b",
      checkpoint: true,
      call: () => TriggerAddAction(destroyed, noAction),
    },
    {
      native: "And",
      label: "destroyed condition operand",
      group: "b",
      checkpoint: true,
      call: () => And(destroyedAndOperand, live),
    },
    {
      native: "Or",
      label: "destroyed boolexpr operand",
      group: "b",
      checkpoint: true,
      call: () => Or(live, destroyedOrOperand),
    },
    {
      native: "Not",
      label: "destroyed operand",
      group: "b",
      checkpoint: true,
      call: () => Not(destroyedNotOperand),
    },
    {
      native: "BlzFrameGetParent",
      label: "destroyed frame",
      group: "b",
      checkpoint: true,
      call: () => BlzFrameGetParent(frame),
    },
  ];
}

/**
 * The cases not to call, each as `<native> <case>`: a case that crashed the
 * game in an earlier run, named by the pending step `probe:read` printed.
 */
const SKIP: readonly string[] = [];

export function run(p: ProbeContext): void {
  runCases(p, sliceCases(), { skip: SKIP });
}
