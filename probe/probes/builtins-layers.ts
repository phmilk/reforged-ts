// Which `_Balance` layer of the install the game reads for a map's Game
// Data Set and Game Data Version (#575). Run once per combination, each
// staged with `--game-data-set` and `--game-data-version`. The results:
// docs/research/builtins-layers.md. Unit stats are the `HP` and `goldcost`
// columns of each layer's `UnitBalance.slk`.
//
// The objects are those whose data tells the four layers of 3.0.0.24268
// apart: the base layer `War3.w3mod:`, and `_Balance/Custom_V0`,
// `Custom_V1` and `Melee_V0`, each of whose files replaces the base
// layer's whole.
//
// | Object            | base | Custom_V0 | Custom_V1 | Melee_V0 |
// | ----------------- | ---- | --------- | --------- | -------- |
// | unit Hct1 exists  | yes  | no        | no        | no       |
// | unit Haah exists  | yes  | no        | yes       | no       |
// | unit nzof exists  | yes  | yes       | yes       | no       |
// | hfoo's gold cost  | 135  | 160       | 135       | 160      |
// | hsor's hit points | 325  | 250       | 325       | 325      |
// | hpea's hit points | 240  | 220       | 220       | 220      |
// | earc's hit points | 275  | 260       | 310       | 260      |
// | item arsc exists  | yes  | no        | yes       | no       |
// | item spur exists  | no   | yes       | no        | yes      |
// | ability Asa2      | no   | no        | yes       | no       |
//
// Then the rule that leaves out an object of a later Game Data Version than
// the map's, for the kinds a Native creates beyond units: the base layer's
// item `ecss` is of Forsaken Kingdom (version 2), its destructable `LTbr` of
// The Frozen Throne (1), `LTcr` of Reign of Chaos (0) and `Yts1` of none;
// the ability `AHfs` of The Frozen Throne (1), in every layer, and `AIhs`
// of Forsaken Kingdom (2), in the base layer alone.
//
// It records, after a `PENDING` line naming the object:
//
// - `unit rawcode=<rawcode> created=<boolean> gold=<GetUnitGoldCost>
//   hp=<BlzGetUnitMaxHP>`: CreateUnit of the unit for Player 0 at the
//   centre; `gold` and `hp` only when a unit was created, and `gold` only
//   for a unit that is not a hero, since GetUnitGoldCost of a hero crashes
//   the game. `hfoo`, in every layer, comes first.
// - `item rawcode=<rawcode> created=<boolean>`: CreateItem of the item.
// - `ability rawcode=<rawcode> added=<boolean>`: UnitAddAbility of the
//   ability to a new `hfoo`.
// - `destructable rawcode=<rawcode> created=<boolean>`: CreateDestructable
//   of the destructable.

import type { ProbeContext } from "../game/probe";

/** The units, the items and the abilities the table above names. */
const UNITS = ["hfoo", "Hct1", "Haah", "nzof", "hsor", "hpea", "earc"];
const ITEMS = ["arsc", "spur", "ecss"];
const DESTRUCTABLES = ["LTcr", "LTbr", "Yts1"];
const ABILITIES = ["Asa2", "AHfs", "AIhs"];

/** Names the step about to run and puts it on disk, so a crash in it names it. */
function risky(p: ProbeContext, label: string): void {
  p.pending(label);
  p.checkpoint();
}

export function run(p: ProbeContext): void {
  const owner = Player(0);
  if (owner === undefined) throw new Error("No Player 0.");

  for (const rawcode of UNITS) {
    const id = FourCC(rawcode);
    risky(p, `${rawcode} CreateUnit`);
    const created = CreateUnit(owner, id, 0, 0, 0);
    if (created === undefined) {
      p.record("unit", { rawcode, created: "false" });
      continue;
    }
    risky(p, `${rawcode} BlzGetUnitMaxHP`);
    const hp = String(BlzGetUnitMaxHP(created));
    // GetUnitGoldCost of a hero crashes the game (Hct1, run eb5ea727).
    const hero = IsHeroUnitId(id);
    if (!hero) risky(p, `${rawcode} GetUnitGoldCost`);
    p.record("unit", {
      rawcode,
      created: "true",
      ...(!hero && { gold: String(GetUnitGoldCost(id)) }),
      hp,
    });
    RemoveUnit(created);
  }

  for (const rawcode of ITEMS) {
    risky(p, `${rawcode} CreateItem`);
    const created = CreateItem(FourCC(rawcode), 0, 0);
    p.record("item", { rawcode, created: tostring(created !== undefined) });
    if (created !== undefined) RemoveItem(created);
  }

  for (const rawcode of ABILITIES) {
    risky(p, `${rawcode} UnitAddAbility`);
    const holder = CreateUnit(owner, FourCC("hfoo"), 0, 0, 0);
    if (holder === undefined) throw new Error("No hfoo created.");
    p.record("ability", {
      rawcode,
      added: tostring(UnitAddAbility(holder, FourCC(rawcode))),
    });
    RemoveUnit(holder);
  }

  for (const rawcode of DESTRUCTABLES) {
    risky(p, `${rawcode} CreateDestructable`);
    const created = CreateDestructable(FourCC(rawcode), 0, 0, 0, 1, 0);
    p.record("destructable", {
      rawcode,
      created: tostring(created !== undefined),
    });
    if (created !== undefined) RemoveDestructable(created);
  }
}
