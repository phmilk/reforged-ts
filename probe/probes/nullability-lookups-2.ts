// The Nullability sweep's Slice `nullability-lookups-2` (#389): the other 28
// lookups in `common.j` order, `LoadUnitPoolHandle` to `BlzGetItemAbility`,
// each called once where it should find nothing (./nullability/nullable.ts),
// and what each call returned recorded (./nullability/case-runner.ts).
// `pnpm probe:nullability-report nullability-lookups-2` turns its Result
// file into this Slice's section of the sweep report. `BlzFrameGetChild`
// runs in `nullability-risky`, and the equipment lookups ran in
// `nullability-lookups-1`. The arguments come from the Fixtures
// (./nullability/fixtures.ts), built before the cases run; every case is of
// group a.

import type { ProbeContext } from "../game/probe";
import { runCases } from "./nullability/case-runner";
import { UNKNOWN_NAME } from "./nullability/constructor";
import { CONVERTER_CONSTANTS } from "./nullability/converter-constants";
import { inGroupOrder } from "./nullability/expand";
import {
  emptyHashtable,
  liveItem,
  liveUnit,
  oneCellMultiboard,
} from "./nullability/fixtures";
import { lookupCase } from "./nullability/nullable";

/** The keys every `Load*Handle` case reads, never saved in the hashtable. */
const UNSAVED_PARENT_KEY = 0;
const UNSAVED_CHILD_KEY = 0;

/** An index past every ability a footman or a `'ratf'` has. */
const ABILITY_INDEX_OUT_OF_RANGE = 100;

/** Holy Light, an ability neither a footman nor a `'ratf'` has. */
const LACKED_ABILITY = "AHhb";

/**
 * The first integer past the greatest `originframetype` constant of the
 * Patch (`ORIGIN_FRAME_UNIT_PANEL_BUFF_BAR_LABEL`, 22, on 3.0.0.24268), so a
 * Patch that adds an origin frame keeps the case out of range.
 */
const ORIGIN_FRAME_TYPE_OUT_OF_RANGE =
  CONVERTER_CONSTANTS.ConvertOriginFrameType.reduce(
    (greatest, [, value]) => (value > greatest ? value : greatest),
    0,
  ) + 1;

/**
 * The Slice's lookups, in `common.j` order, each with its case's label and
 * call, over the Fixtures built here before any case runs: an empty
 * hashtable, a multiboard of one cell, a footman and a `'ratf'`.
 */
function lookups(): readonly [string, string, () => unknown][] {
  const table = emptyHashtable();
  const board = oneCellMultiboard();
  const footman = liveUnit();
  const item = liveItem();
  const frameType = ConvertOriginFrameType(ORIGIN_FRAME_TYPE_OUT_OF_RANGE);
  const load = (
    native: string,
    call: (table: hashtable, parentKey: number, childKey: number) => unknown,
  ): [string, string, () => unknown] => [
    native,
    "unsaved key",
    () => call(table, UNSAVED_PARENT_KEY, UNSAVED_CHILD_KEY),
  ];
  return [
    load("LoadUnitPoolHandle", LoadUnitPoolHandle),
    load("LoadItemPoolHandle", LoadItemPoolHandle),
    load("LoadQuestHandle", LoadQuestHandle),
    load("LoadQuestItemHandle", LoadQuestItemHandle),
    load("LoadDefeatConditionHandle", LoadDefeatConditionHandle),
    load("LoadTimerDialogHandle", LoadTimerDialogHandle),
    load("LoadLeaderboardHandle", LoadLeaderboardHandle),
    load("LoadMultiboardHandle", LoadMultiboardHandle),
    load("LoadMultiboardItemHandle", LoadMultiboardItemHandle),
    load("LoadTrackableHandle", LoadTrackableHandle),
    load("LoadDialogHandle", LoadDialogHandle),
    load("LoadButtonHandle", LoadButtonHandle),
    load("LoadTextTagHandle", LoadTextTagHandle),
    load("LoadLightningHandle", LoadLightningHandle),
    load("LoadImageHandle", LoadImageHandle),
    load("LoadUbersplatHandle", LoadUbersplatHandle),
    load("LoadRegionHandle", LoadRegionHandle),
    load("LoadFogStateHandle", LoadFogStateHandle),
    load("LoadFogModifierHandle", LoadFogModifierHandle),
    load("LoadHashtableHandle", LoadHashtableHandle),
    load("LoadFrameHandle", LoadFrameHandle),
    // Row 1 and column 1 of a board whose only cell is (0, 0).
    [
      "MultiboardGetItem",
      "index out of range",
      () => MultiboardGetItem(board, 1, 1),
    ],
    [
      "BlzGetOriginFrame",
      "frame type out of range",
      () => BlzGetOriginFrame(frameType, 0),
    ],
    [
      "BlzGetFrameByName",
      "unknown name",
      () => BlzGetFrameByName(UNKNOWN_NAME, 0),
    ],
    [
      "BlzGetUnitAbility",
      "ability it lacks",
      () => BlzGetUnitAbility(footman, FourCC(LACKED_ABILITY)),
    ],
    [
      "BlzGetUnitAbilityByIndex",
      "index out of range",
      () => BlzGetUnitAbilityByIndex(footman, ABILITY_INDEX_OUT_OF_RANGE),
    ],
    [
      "BlzGetItemAbilityByIndex",
      "index out of range",
      () => BlzGetItemAbilityByIndex(item, ABILITY_INDEX_OUT_OF_RANGE),
    ],
    [
      "BlzGetItemAbility",
      "ability it lacks",
      () => BlzGetItemAbility(item, FourCC(LACKED_ABILITY)),
    ],
  ];
}

/**
 * The cases not to call, each as `<native> <case>`: a case that crashed the
 * game in an earlier run, named by the pending step `probe:read` printed.
 */
const SKIP: readonly string[] = [];

export function run(p: ProbeContext): void {
  const cases = inGroupOrder(
    ...lookups().map(([native, label, call]) =>
      lookupCase(native, label, call),
    ),
  );
  runCases(p, cases, { skip: SKIP });
}
