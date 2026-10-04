// The Nullability sweep's Slice `nullability-risky` (#397): the three
// Natives jassdoc reports as able to crash the game, in `common.j` order,
// run last of the sweep (#371): `GetExpiredTimer` outside its timer and in
// the callback of a destroyed timer (./nullability/nullable.ts),
// `BlzCreateFrameByType` through the constructors' case generator
// (./nullability/constructor.ts), the frame types it may crash on without
// their FDF fields among its catalogue cases, and `BlzFrameGetChild` at an
// index past its frame's last child; what each call returned recorded
// (./nullability/case-runner.ts).
// `pnpm probe:nullability-report nullability-risky` turns its Result file
// into this Slice's section of the sweep report. The arguments come from the
// Fixtures (./nullability/fixtures.ts), built before the cases run; the
// destroyed owner is of group b, so it runs last.

import type { ProbeContext } from "../game/probe";
import { type ReturnCase, runCases } from "./nullability/case-runner";
import { catalogueCase, constructorCases } from "./nullability/constructor";
import { inGroupOrder } from "./nullability/expand";
import {
  damageEventTrigger,
  destroyedFrame,
  gameUiFrame,
  liveUnit,
} from "./nullability/fixtures";
import {
  eventResponseCase,
  lookupCase,
  nullableCatalogueCase,
} from "./nullability/nullable";
import { handle, numeric, text } from "./nullability/parameters";

/**
 * The frame types jassdoc says `BlzCreateFrameByType` can crash the game on
 * when created without their FDF fields or other setup, each created as
 * the typical call does, inheriting nothing.
 */
const FRAME_TYPES_WITHOUT_FDF_FIELDS = [
  "BACKDROP",
  "TEXTAREA",
  "SIMPLEMESSAGEFRAME",
  "DIALOG",
  "CONTROL",
] as const;

/**
 * `GetExpiredTimer`'s cases. Outside its event: called in a thread no
 * timer started, the action of a trigger on a footman's damage event, which
 * `UnitDamageTarget` fires before it returns. The Probe itself runs in a
 * timer's callback, so a call there would not be outside its timer. The
 * action calls the Native under `pcall`, since an error in its own thread
 * would not reach the case runner's, and the case raises it again: the
 * case is an `error` for review when the call raised or the event did not
 * fire, never a `nil` it did not see. In the callback of a destroyed
 * timer, the catalogue's case (#362, from jassdoc): called in the Probe's
 * own thread, the callback of the runner's timer, which the runner destroys
 * before it starts the Probe (game/runner.ts).
 */
function expiredTimerCase(): ReturnCase[] {
  const target = liveUnit();
  const trigger = damageEventTrigger(target);
  let fired = false;
  let ok = true;
  let expired: unknown;
  TriggerAddAction(trigger, () => {
    fired = true;
    [ok, expired] = pcall(GetExpiredTimer);
  });
  const outsideItsEvent = eventResponseCase("GetExpiredTimer", () => {
    UnitDamageTarget(
      target,
      target,
      1,
      true,
      false,
      ATTACK_TYPE_NORMAL,
      DAMAGE_TYPE_NORMAL,
      WEAPON_TYPE_WHOKNOWS,
    );
    if (!fired) error("The footman's damage event did not fire.", 0);
    if (!ok) error(tostring(expired), 0);
    return expired;
  });
  return [
    ...outsideItsEvent,
    ...nullableCatalogueCase(
      "GetExpiredTimer",
      "callback of a destroyed timer",
      () => GetExpiredTimer(),
    ),
  ];
}

/**
 * The Slice's cases, every (a) case before any (b) case, over the Fixtures
 * built here before any case runs: a footman and the trigger on its damage
 * event, the game UI frame and a destroyed frame.
 *
 * `BlzCreateFrameByType` makes a `"FRAME"` on the game UI, inheriting
 * nothing, as the `childFrame` Fixture does; its owner's stale state is a
 * destroyed frame. `BlzFrameGetChild` reads the game UI frame at the index
 * `BlzFrameGetChildrenCount` gives it at the call, one past its last child:
 * the frames the cases before it create are children of the game UI too, so
 * a count read before them is a live index (run 392e5847 returned the
 * `BACKDROP` case's frame).
 */
function sliceCases(): ReturnCase[] {
  const gameUi = gameUiFrame();
  return inGroupOrder(
    expiredTimerCase(),
    constructorCases(
      "BlzCreateFrameByType",
      [
        text("typeName", "FRAME"),
        text("name", "NullabilityRisky"),
        handle("owner", gameUi, [["destroyed frame", destroyedFrame()]]),
        text("inherits", ""),
        numeric("createContext", 0),
      ],
      ([typeName, name, owner, inherits, context]) =>
        BlzCreateFrameByType(typeName, name, owner, inherits, context),
    ),
    ...FRAME_TYPES_WITHOUT_FDF_FIELDS.map((typeName) =>
      catalogueCase(
        "BlzCreateFrameByType",
        "typeName",
        `${typeName} without its FDF fields`,
        () => BlzCreateFrameByType(typeName, "NullabilityRisky", gameUi, "", 0),
      ),
    ),
    lookupCase("BlzFrameGetChild", "index out of range", () =>
      BlzFrameGetChild(gameUi, BlzFrameGetChildrenCount(gameUi)),
    ),
  );
}

/**
 * The cases not to call, each as `<native> <case>`: a case that crashed the
 * game in an earlier run, named by the pending step `probe:read` printed.
 *
 * This Slice may hold more than the crash loop's 3 skipped cases (#364): it
 * holds exactly the Natives known to crash, so the maintainer lifted the
 * 3-skip stop for it alone (#397, 2026-10-04). Every skip is still a crash
 * the loop confirmed, and its other stops still hold.
 */
const SKIP: readonly string[] = [
  // Crashed on 3.0.0.24268, runs 9a0105e1-328b-4b5f-9709-448a5e5c1146 and
  // ae17989e-ec9d-46e2-8c0f-973cd81ad002 (the confirming run). The same
  // damage event with `GetTriggerUnit` in its action returned the footman
  // in a scratch run, a2012572-550e-415a-99af-91c709bad7b3, so the crash is
  // `GetExpiredTimer`'s.
  "GetExpiredTimer outside its event",
  // Crashed on 3.0.0.24268, runs d1f7a293-605b-4f0b-be3d-f8f1b90e1b01 and
  // 6bd7987f-af96-47aa-bf73-5e8e28946438 (the confirming run).
  "BlzCreateFrameByType typeName: SIMPLEMESSAGEFRAME without its FDF fields",
  // Crashed on 3.0.0.24268, runs 19034b34-6dc7-4287-9629-53c8e012a11c and
  // a3691b0d-d823-441b-a935-1115fac601fa (the confirming run).
  "BlzCreateFrameByType typeName: CONTROL without its FDF fields",
];

export function run(p: ProbeContext): void {
  runCases(p, sliceCases(), { skip: SKIP });
}
