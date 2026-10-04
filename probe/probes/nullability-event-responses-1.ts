// The Nullability sweep's Slice `nullability-event-responses-1` (#386): the
// first 37 event responses in `common.j` order, `GetTriggeringTrigger` to
// `GetChangingUnitPrevOwner`, `GetExpiredTimer` excepted (it runs in
// `nullability-risky`), each called once outside its event
// (./nullability/nullable.ts), and what each call returned recorded
// (./nullability/case-runner.ts).
// `pnpm probe:nullability-report nullability-event-responses-1` turns its
// Result file into this Slice's section of the sweep report. An event
// response takes no argument and its cheap case needs no event, so the Slice
// needs no Fixture and every case is of group a.

import type { ProbeContext } from "../game/probe";
import { runCases } from "./nullability/case-runner";
import { inGroupOrder } from "./nullability/expand";
import { eventResponseCase } from "./nullability/nullable";

/** The Slice's event responses, in `common.j` order, each with its call. */
const EVENT_RESPONSES: readonly [string, () => unknown][] = [
  ["GetTriggeringTrigger", () => GetTriggeringTrigger()],
  ["GetTriggerEventId", () => GetTriggerEventId()],
  ["GetEventGameState", () => GetEventGameState()],
  ["GetWinningPlayer", () => GetWinningPlayer()],
  ["GetTriggeringRegion", () => GetTriggeringRegion()],
  ["GetEnteringUnit", () => GetEnteringUnit()],
  ["GetLeavingUnit", () => GetLeavingUnit()],
  ["GetTriggeringTrackable", () => GetTriggeringTrackable()],
  ["GetClickedButton", () => GetClickedButton()],
  ["GetClickedDialog", () => GetClickedDialog()],
  ["GetTournamentFinishNowPlayer", () => GetTournamentFinishNowPlayer()],
  ["GetTriggerPlayer", () => GetTriggerPlayer()],
  ["GetLevelingUnit", () => GetLevelingUnit()],
  ["GetLearningUnit", () => GetLearningUnit()],
  ["GetRevivableUnit", () => GetRevivableUnit()],
  ["GetRevivingUnit", () => GetRevivingUnit()],
  ["GetAttacker", () => GetAttacker()],
  ["GetRescuer", () => GetRescuer()],
  ["GetDyingUnit", () => GetDyingUnit()],
  ["GetKillingUnit", () => GetKillingUnit()],
  ["GetDecayingUnit", () => GetDecayingUnit()],
  ["GetConstructingStructure", () => GetConstructingStructure()],
  ["GetCancelledStructure", () => GetCancelledStructure()],
  ["GetConstructedStructure", () => GetConstructedStructure()],
  ["GetResearchingUnit", () => GetResearchingUnit()],
  ["GetTrainedUnit", () => GetTrainedUnit()],
  ["GetDetectedUnit", () => GetDetectedUnit()],
  ["GetSummoningUnit", () => GetSummoningUnit()],
  ["GetSummonedUnit", () => GetSummonedUnit()],
  ["GetTransportUnit", () => GetTransportUnit()],
  ["GetLoadedUnit", () => GetLoadedUnit()],
  ["GetSellingUnit", () => GetSellingUnit()],
  ["GetSoldUnit", () => GetSoldUnit()],
  ["GetBuyingUnit", () => GetBuyingUnit()],
  ["GetSoldItem", () => GetSoldItem()],
  ["GetChangingUnit", () => GetChangingUnit()],
  ["GetChangingUnitPrevOwner", () => GetChangingUnitPrevOwner()],
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
