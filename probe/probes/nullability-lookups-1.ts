// The Nullability sweep's Slice `nullability-lookups-1` (#388): the first 28
// lookups in `common.j` order, `GetStartLocationLoc` to `LoadEffectHandle`,
// each called once where it should find nothing (./nullability/nullable.ts),
// and what each call returned recorded (./nullability/case-runner.ts).
// `pnpm probe:nullability-report nullability-lookups-1` turns its Result
// file into this Slice's section of the sweep report. `BlzFrameGetChild`
// runs in `nullability-risky`. The arguments come from the Fixtures
// (./nullability/fixtures.ts), built before the cases run; every case is of
// group a.

import type { ProbeContext } from "../game/probe";
import { runCases } from "./nullability/case-runner";
import { inGroupOrder } from "./nullability/expand";
import {
  emptyGameCache,
  emptyGroup,
  emptyHashtable,
  liveHero,
  userSlotPlayer,
} from "./nullability/fixtures";
import { lookupCase } from "./nullability/nullable";

/** The keys every `Load*Handle` case reads, never saved in the hashtable. */
const UNSAVED_PARENT_KEY = 0;
const UNSAVED_CHILD_KEY = 0;

/**
 * The Slice's lookups, in `common.j` order, each with its case's label and
 * call, over the Fixtures built here before any case runs: an empty group, a
 * hero with an empty inventory, an empty hashtable and an empty game cache.
 */
function lookups(): readonly [string, string, () => unknown][] {
  const group = emptyGroup();
  const hero = liveHero();
  const table = emptyHashtable();
  const cache = emptyGameCache();
  const owner = userSlotPlayer();
  const load = (
    native: string,
    call: (table: hashtable, parentKey: number, childKey: number) => unknown,
  ): [string, string, () => unknown] => [
    native,
    "unsaved key",
    () => call(table, UNSAVED_PARENT_KEY, UNSAVED_CHILD_KEY),
  ];
  return [
    // One past the last player slot, so no start location.
    [
      "GetStartLocationLoc",
      "index out of range",
      () => GetStartLocationLoc(GetBJMaxPlayerSlots()),
    ],
    ["BlzGroupUnitAt", "index out of range", () => BlzGroupUnitAt(group, 0)],
    ["FirstOfGroup", "empty group", () => FirstOfGroup(group)],
    [
      "UnitRemoveItemFromSlot",
      "empty slot",
      () => UnitRemoveItemFromSlot(hero, 0),
    ],
    [
      "UnitUnequipItemFromSlot",
      "empty slot",
      () => UnitUnequipItemFromSlot(hero, EQUIPMENT_LOADOUT_SLOT_HEAD),
    ],
    ["UnitItemInSlot", "empty slot", () => UnitItemInSlot(hero, 0)],
    ["UnitItemInBagSlot", "empty slot", () => UnitItemInBagSlot(hero, 0)],
    [
      "UnitItemInEquipmentSlot",
      "empty slot",
      () => UnitItemInEquipmentSlot(hero, EQUIPMENT_LOADOUT_SLOT_HEAD),
    ],
    // One past the last player slot.
    ["Player", "index out of range", () => Player(GetBJMaxPlayerSlots())],
    [
      "RestoreUnit",
      "unsaved key",
      () => RestoreUnit(cache, "nullability", "unsaved", owner, 0, 0, 0),
    ],
    load("LoadPlayerHandle", LoadPlayerHandle),
    load("LoadWidgetHandle", LoadWidgetHandle),
    load("LoadDestructableHandle", LoadDestructableHandle),
    load("LoadItemHandle", LoadItemHandle),
    load("LoadUnitHandle", LoadUnitHandle),
    load("LoadAbilityHandle", LoadAbilityHandle),
    load("LoadTimerHandle", LoadTimerHandle),
    load("LoadTriggerHandle", LoadTriggerHandle),
    load("LoadTriggerConditionHandle", LoadTriggerConditionHandle),
    load("LoadTriggerActionHandle", LoadTriggerActionHandle),
    load("LoadTriggerEventHandle", LoadTriggerEventHandle),
    load("LoadForceHandle", LoadForceHandle),
    load("LoadGroupHandle", LoadGroupHandle),
    load("LoadLocationHandle", LoadLocationHandle),
    load("LoadRectHandle", LoadRectHandle),
    load("LoadBooleanExprHandle", LoadBooleanExprHandle),
    load("LoadSoundHandle", LoadSoundHandle),
    load("LoadEffectHandle", LoadEffectHandle),
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
