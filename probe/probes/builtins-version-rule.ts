// Whether a map's Game Data Version leaves out the buffs and the upgrades of
// a later version, as it leaves out units, items and abilities (#622). Run
// once per combination, as builtins-layers, each staged with
// `--game-data-set` and `--game-data-version`. The results:
// docs/research/builtins-layers.md.
//
// No Native creates a buff, so a buff is looked for on a unit an ability
// gives it to, with `GetUnitAbilityLevel` of the buff's Rawcode, which #581
// read for Command Aura's `BOac`. The pairs, from the install's data on
// 3.0.0.24268, are the only ones whose ability a set holds and whose buff
// is of a later version than the set's:
//
// - Sacred Aura `AHpa` (version 1) gives `BHas` (version 2), in the base
//   layer only: Melee of The Frozen Throne reads it.
// - Rain of Fire `ANrf` (version 0) gives `BNrf` and `BNrd` (version 1) in
//   every layer: the sets of Reign of Chaos read them.
// - Command Aura `ACac` (version 0) gives `BOac` (version 0): the control.
//
// The upgrades of version 1 are in neither `Custom_V0` nor `Melee_V0`, and
// none is of version 2, so no set reads an upgrade of a later version: the
// Probe only checks that `GetPlayerTechCount` tells an upgrade the map's
// data holds from one it does not, `Rzzz` being no upgrade at all.
//
// It records, after a `PENDING` line naming the step:
//
// - `upgrade rawcode=<rawcode> count=<GetPlayerTechCount> max=<GetPlayerTechMaxAllowed>`
//   after `SetPlayerTechResearched` of level 1 for Player 0, for `Rhme`
//   (version 0), `Rhpm` (version 1) and `Rzzz`.
// - `aura ability=<rawcode> added=<boolean>`: `UnitAddAbility` of the aura
//   to a new `hfoo` of Player 0.
// - `cast ability=ANrf added=<boolean> ordered=<boolean>`: the Rain of Fire
//   of a Sorceress `hsor` of Player 0, with the mana it costs, at a Footman
//   of Neutral Hostile 300 away.
// - 2 seconds later, `buff rawcode=<rawcode> on=<unit> level=<level>`: the
//   auras' buffs on their bearers, the Rain of Fire's on its target and its
//   caster, with `target life=<GetWidgetLife>` and `caster mana=<mana>`, so
//   a buff missing is told from a spell never cast.

import type { ProbeContext } from "../game/probe";

const UPGRADES = ["Rhme", "Rhpm", "Rzzz"];
/** The auras and their buffs. */
const AURAS: readonly (readonly [string, string])[] = [
  ["ACac", "BOac"],
  ["AHpa", "BHas"],
];
const RAIN_BUFFS = ["BNrf", "BNrd"];

/** Names the step about to run and puts it on disk, so a crash in it names it. */
function risky(p: ProbeContext, label: string): void {
  p.pending(label);
  p.checkpoint();
}

function buffLevel(
  p: ProbeContext,
  unit: unit,
  on: string,
  buff: string,
): void {
  p.record("buff", {
    rawcode: buff,
    on,
    level: String(GetUnitAbilityLevel(unit, FourCC(buff))),
  });
}

export function run(p: ProbeContext): void {
  const owner = Player(0);
  const hostile = Player(PLAYER_NEUTRAL_AGGRESSIVE);
  if (owner === undefined || hostile === undefined) {
    throw new Error("No Player 0 or Neutral Hostile.");
  }

  for (const rawcode of UPGRADES) {
    const id = FourCC(rawcode);
    risky(p, `${rawcode} SetPlayerTechResearched`);
    SetPlayerTechResearched(owner, id, 1);
    p.record("upgrade", {
      rawcode,
      count: String(GetPlayerTechCount(owner, id, true)),
      max: String(GetPlayerTechMaxAllowed(owner, id)),
    });
  }

  const bearers: [unit, string][] = [];
  AURAS.forEach(([ability, buff], i) => {
    risky(p, `${ability} UnitAddAbility`);
    const bearer = CreateUnit(owner, FourCC("hfoo"), -2000 + i * 2000, 0, 0);
    if (bearer === undefined) throw new Error("No hfoo created.");
    p.record("aura", {
      ability,
      added: tostring(UnitAddAbility(bearer, FourCC(ability))),
    });
    bearers.push([bearer, buff]);
  });

  risky(p, "ANrf cast");
  const caster = CreateUnit(owner, FourCC("hsor"), 0, 2000, 0);
  const target = CreateUnit(hostile, FourCC("hfoo"), 300, 2000, 0);
  if (caster === undefined || target === undefined) {
    throw new Error("No hsor or hfoo created.");
  }
  const added = UnitAddAbility(caster, FourCC("ANrf"));
  BlzSetUnitMaxMana(caster, 1000);
  SetUnitState(caster, UNIT_STATE_MANA, 1000);
  const ordered = IssuePointOrder(
    caster,
    "rainoffire",
    GetUnitX(target),
    GetUnitY(target),
  );
  p.record("cast", {
    ability: "ANrf",
    added: tostring(added),
    ordered: tostring(ordered),
  });

  p.hold();
  risky(p, "wait");
  p.after(2, () => {
    risky(p, "buffs");
    for (const [bearer, buff] of bearers) buffLevel(p, bearer, "bearer", buff);
    for (const buff of RAIN_BUFFS) {
      buffLevel(p, target, "target", buff);
      buffLevel(p, caster, "caster", buff);
    }
    p.record("target", { life: String(GetWidgetLife(target)) });
    p.record("caster", {
      mana: String(GetUnitState(caster, UNIT_STATE_MANA)),
    });
    p.finish();
  });
}
