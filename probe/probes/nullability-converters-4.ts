// The Nullability sweep's Slice `nullability-converters-4` (#385): the last
// 24 converters in `common.j` order, `ConvertUnitIntegerField` to
// `ConvertLoadoutSlot`,
// each called with the integer of every `common.j` constant of its type and
// the boundary integers (./nullability/converter.ts), and what each call
// returned recorded (./nullability/case-runner.ts).
// `pnpm probe:nullability-report nullability-converters-4` turns its Result
// file into this Slice's section of the sweep report. Converters take one
// integer, so the Slice needs no Fixture and every case is of group a.

import type { ProbeContext } from "../game/probe";
import { runCases } from "./nullability/case-runner";
import { converterCases } from "./nullability/converter";
import type { ConverterName } from "./nullability/converter-constants";
import { inGroupOrder } from "./nullability/expand";

/** The Slice's converters, in `common.j` order. */
const CONVERTERS: readonly ConverterName[] = [
  "ConvertUnitIntegerField",
  "ConvertUnitRealField",
  "ConvertUnitBooleanField",
  "ConvertUnitStringField",
  "ConvertUnitWeaponIntegerField",
  "ConvertUnitWeaponRealField",
  "ConvertUnitWeaponBooleanField",
  "ConvertUnitWeaponStringField",
  "ConvertItemIntegerField",
  "ConvertItemRealField",
  "ConvertItemBooleanField",
  "ConvertItemStringField",
  "ConvertMoveType",
  "ConvertTargetFlag",
  "ConvertArmorType",
  "ConvertHeroAttribute",
  "ConvertDefenseType",
  "ConvertRegenType",
  "ConvertUnitCategory",
  "ConvertPathingFlag",
  "ConvertFogStyle",
  "ConvertEquipmentType",
  "ConvertItemTag",
  "ConvertLoadoutSlot",
];

/**
 * The cases not to call, each as `<native> <case>`: a case that crashed the
 * game in an earlier run, named by the pending step `probe:read` printed.
 */
const SKIP: readonly string[] = [];

export function run(p: ProbeContext): void {
  const cases = inGroupOrder(
    ...CONVERTERS.map((native) => converterCases(native)),
  );
  runCases(p, cases, { skip: SKIP });
}
