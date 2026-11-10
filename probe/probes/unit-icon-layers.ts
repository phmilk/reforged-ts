// Which icon the game gives a unit in each graphics mode (#874): run once
// per mode, `[Misc] hd` of `War3Preferences.txt` set to 0 (Classic), 1
// (Reforged) and 2 (Definitive Edition) before the run, on a map whose
// Supported Modes allow all three. It settles whether DE reads HD's
// `Art:hd` where a unit has no `Art:de`, as the Studio's game data model
// does (`packages/reforged-studio/src/game-data.ts`).
//
// | Unit   | Art:sd | Art:hd | Art:de | plain Art |
// | ------ | ------ | ------ | ------ | --------- |
// | `hmpr` | yes    | yes    | no     | no        |
// | `hsor` | yes    | yes    | no     | no        |
// | `hdhw` | yes    | yes    | yes    | no        |
// | `hfoo` | -      | -      | -      | yes       |
//
// The result (3.0.1.24371, Supported Modes set by hand to 7): every icon
// is the path the table's keys give, DE reading `Art:hd` where there is no
// `Art:de`. See the comment of `LAYER_KEYS`, packages/reforged-studio/src/
// game-data.ts.
//
// It records, after a `PENDING` line naming the unit, `icon rawcode=<rawcode>
// path=<BlzGetAbilityIcon>`, the icon the game gives the unit's rawcode.

import type { ProbeContext } from "../game/probe";

/** The units of the table above. */
const UNITS = ["hmpr", "hsor", "hdhw", "hfoo"];

export function run(p: ProbeContext): void {
  for (const rawcode of UNITS) {
    p.pending(rawcode);
    p.record("icon", {
      rawcode,
      path: tostring(BlzGetAbilityIcon(FourCC(rawcode))),
    });
    p.checkpoint();
  }
}
