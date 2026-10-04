// The Nullability sweep's Slice `nullability-constructors-destructables`
// (#394): the 32 destructable creators, in `common.j` order, each declared
// for the constructors' case generator (./nullability/constructor.ts), and
// what each call returned recorded (./nullability/case-runner.ts).
// `pnpm probe:nullability-report nullability-constructors-destructables`
// turns its Result file into this Slice's section of the sweep report. The
// creators take no handle but a `playercolor`, which no Native destroys, so
// every case is of group a and needs no Fixture.

import type { ProbeContext } from "../game/probe";
import { type ReturnCase, runCases } from "./nullability/case-runner";
import { constructorCases } from "./nullability/constructor";
import { inGroupOrder } from "./nullability/expand";
import { fixed, numeric, rawcode } from "./nullability/parameters";

/**
 * The Slice's cases. Every creator takes the same parameters, by name, in
 * one order: `objectid`, `x`, `y`, then `z` for a `Z` creator, `face`, then
 * `roll` and `pitch` for a `PitchRoll` one, `scale`, `variation`, then
 * `skinId` for a `Skin` one and `color` for a `Color` one; so each is
 * declared once and shared. The typical call is a `'LTlt'` (a Lordaeron
 * tree, the destructable Fixture's) at (256, 256) on the ground, facing
 * 270, upright, scale 1, variation 0, its own skin, and the colour fixed to
 * red: a `playercolor` is an enum constant, never varied.
 */
function sliceCases(): ReturnCase[] {
  const tree = FourCC("LTlt");
  const objectid = rawcode("objectid", tree);
  const x = numeric("x", 256);
  const y = numeric("y", 256);
  const z = numeric("z", 0);
  const face = numeric("face", 270);
  const roll = numeric("roll", 0);
  const pitch = numeric("pitch", 0);
  const scale = numeric("scale", 1);
  const variation = numeric("variation", 0);
  const skinId = rawcode("skinId", tree);
  const color = fixed("color", PLAYER_COLOR_RED);
  return inGroupOrder(
    constructorCases(
      "CreateDestructable",
      [objectid, x, y, face, scale, variation],
      ([id, px, py, f, s, v]) => CreateDestructable(id, px, py, f, s, v),
    ),
    constructorCases(
      "CreateDestructableZ",
      [objectid, x, y, z, face, scale, variation],
      ([id, px, py, pz, f, s, v]) =>
        CreateDestructableZ(id, px, py, pz, f, s, v),
    ),
    constructorCases(
      "CreateDeadDestructable",
      [objectid, x, y, face, scale, variation],
      ([id, px, py, f, s, v]) => CreateDeadDestructable(id, px, py, f, s, v),
    ),
    constructorCases(
      "CreateDeadDestructableZ",
      [objectid, x, y, z, face, scale, variation],
      ([id, px, py, pz, f, s, v]) =>
        CreateDeadDestructableZ(id, px, py, pz, f, s, v),
    ),
    constructorCases(
      "BlzCreateDestructableWithSkin",
      [objectid, x, y, face, scale, variation, skinId],
      ([id, px, py, f, s, v, skin]) =>
        BlzCreateDestructableWithSkin(id, px, py, f, s, v, skin),
    ),
    constructorCases(
      "BlzCreateDestructableZWithSkin",
      [objectid, x, y, z, face, scale, variation, skinId],
      ([id, px, py, pz, f, s, v, skin]) =>
        BlzCreateDestructableZWithSkin(id, px, py, pz, f, s, v, skin),
    ),
    constructorCases(
      "BlzCreateDeadDestructableWithSkin",
      [objectid, x, y, face, scale, variation, skinId],
      ([id, px, py, f, s, v, skin]) =>
        BlzCreateDeadDestructableWithSkin(id, px, py, f, s, v, skin),
    ),
    constructorCases(
      "BlzCreateDeadDestructableZWithSkin",
      [objectid, x, y, z, face, scale, variation, skinId],
      ([id, px, py, pz, f, s, v, skin]) =>
        BlzCreateDeadDestructableZWithSkin(id, px, py, pz, f, s, v, skin),
    ),
    constructorCases(
      "BlzCreateDestructablePitchRoll",
      [objectid, x, y, face, roll, pitch, scale, variation],
      ([id, px, py, f, r, p, s, v]) =>
        BlzCreateDestructablePitchRoll(id, px, py, f, r, p, s, v),
    ),
    constructorCases(
      "BlzCreateDestructableZPitchRoll",
      [objectid, x, y, z, face, roll, pitch, scale, variation],
      ([id, px, py, pz, f, r, p, s, v]) =>
        BlzCreateDestructableZPitchRoll(id, px, py, pz, f, r, p, s, v),
    ),
    constructorCases(
      "BlzCreateDeadDestructablePitchRoll",
      [objectid, x, y, face, roll, pitch, scale, variation],
      ([id, px, py, f, r, p, s, v]) =>
        BlzCreateDeadDestructablePitchRoll(id, px, py, f, r, p, s, v),
    ),
    constructorCases(
      "BlzCreateDeadDestructableZPitchRoll",
      [objectid, x, y, z, face, roll, pitch, scale, variation],
      ([id, px, py, pz, f, r, p, s, v]) =>
        BlzCreateDeadDestructableZPitchRoll(id, px, py, pz, f, r, p, s, v),
    ),
    constructorCases(
      "BlzCreateDestructableWithSkinPitchRoll",
      [objectid, x, y, face, roll, pitch, scale, variation, skinId],
      ([id, px, py, f, r, p, s, v, skin]) =>
        BlzCreateDestructableWithSkinPitchRoll(id, px, py, f, r, p, s, v, skin),
    ),
    constructorCases(
      "BlzCreateDestructableZWithSkinPitchRoll",
      [objectid, x, y, z, face, roll, pitch, scale, variation, skinId],
      ([id, px, py, pz, f, r, p, s, v, skin]) =>
        BlzCreateDestructableZWithSkinPitchRoll(
          id,
          px,
          py,
          pz,
          f,
          r,
          p,
          s,
          v,
          skin,
        ),
    ),
    constructorCases(
      "BlzCreateDeadDestructableWithSkinPitchRoll",
      [objectid, x, y, face, roll, pitch, scale, variation, skinId],
      ([id, px, py, f, r, p, s, v, skin]) =>
        BlzCreateDeadDestructableWithSkinPitchRoll(
          id,
          px,
          py,
          f,
          r,
          p,
          s,
          v,
          skin,
        ),
    ),
    constructorCases(
      "BlzCreateDeadDestructableZWithSkinPitchRoll",
      [objectid, x, y, z, face, roll, pitch, scale, variation, skinId],
      ([id, px, py, pz, f, r, p, s, v, skin]) =>
        BlzCreateDeadDestructableZWithSkinPitchRoll(
          id,
          px,
          py,
          pz,
          f,
          r,
          p,
          s,
          v,
          skin,
        ),
    ),
    constructorCases(
      "BlzCreateDestructableWithColor",
      [objectid, x, y, face, scale, variation, color],
      ([id, px, py, f, s, v, c]) =>
        BlzCreateDestructableWithColor(id, px, py, f, s, v, c),
    ),
    constructorCases(
      "BlzCreateDestructableZWithColor",
      [objectid, x, y, z, face, scale, variation, color],
      ([id, px, py, pz, f, s, v, c]) =>
        BlzCreateDestructableZWithColor(id, px, py, pz, f, s, v, c),
    ),
    constructorCases(
      "BlzCreateDeadDestructableWithColor",
      [objectid, x, y, face, scale, variation, color],
      ([id, px, py, f, s, v, c]) =>
        BlzCreateDeadDestructableWithColor(id, px, py, f, s, v, c),
    ),
    constructorCases(
      "BlzCreateDeadDestructableZWithColor",
      [objectid, x, y, z, face, scale, variation, color],
      ([id, px, py, pz, f, s, v, c]) =>
        BlzCreateDeadDestructableZWithColor(id, px, py, pz, f, s, v, c),
    ),
    constructorCases(
      "BlzCreateDestructableWithSkinColor",
      [objectid, x, y, face, scale, variation, skinId, color],
      ([id, px, py, f, s, v, skin, c]) =>
        BlzCreateDestructableWithSkinColor(id, px, py, f, s, v, skin, c),
    ),
    constructorCases(
      "BlzCreateDestructableZWithSkinColor",
      [objectid, x, y, z, face, scale, variation, skinId, color],
      ([id, px, py, pz, f, s, v, skin, c]) =>
        BlzCreateDestructableZWithSkinColor(id, px, py, pz, f, s, v, skin, c),
    ),
    constructorCases(
      "BlzCreateDeadDestructableWithSkinColor",
      [objectid, x, y, face, scale, variation, skinId, color],
      ([id, px, py, f, s, v, skin, c]) =>
        BlzCreateDeadDestructableWithSkinColor(id, px, py, f, s, v, skin, c),
    ),
    constructorCases(
      "BlzCreateDeadDestructableZWithSkinColor",
      [objectid, x, y, z, face, scale, variation, skinId, color],
      ([id, px, py, pz, f, s, v, skin, c]) =>
        BlzCreateDeadDestructableZWithSkinColor(
          id,
          px,
          py,
          pz,
          f,
          s,
          v,
          skin,
          c,
        ),
    ),
    constructorCases(
      "BlzCreateDestructablePitchRollWithColor",
      [objectid, x, y, face, roll, pitch, scale, variation, color],
      ([id, px, py, f, r, p, s, v, c]) =>
        BlzCreateDestructablePitchRollWithColor(id, px, py, f, r, p, s, v, c),
    ),
    constructorCases(
      "BlzCreateDestructableZPitchRollWithColor",
      [objectid, x, y, z, face, roll, pitch, scale, variation, color],
      ([id, px, py, pz, f, r, p, s, v, c]) =>
        BlzCreateDestructableZPitchRollWithColor(
          id,
          px,
          py,
          pz,
          f,
          r,
          p,
          s,
          v,
          c,
        ),
    ),
    constructorCases(
      "BlzCreateDeadDestructablePitchRollWithColor",
      [objectid, x, y, face, roll, pitch, scale, variation, color],
      ([id, px, py, f, r, p, s, v, c]) =>
        BlzCreateDeadDestructablePitchRollWithColor(
          id,
          px,
          py,
          f,
          r,
          p,
          s,
          v,
          c,
        ),
    ),
    constructorCases(
      "BlzCreateDeadDestructableZPitchRollWithColor",
      [objectid, x, y, z, face, roll, pitch, scale, variation, color],
      ([id, px, py, pz, f, r, p, s, v, c]) =>
        BlzCreateDeadDestructableZPitchRollWithColor(
          id,
          px,
          py,
          pz,
          f,
          r,
          p,
          s,
          v,
          c,
        ),
    ),
    constructorCases(
      "BlzCreateDestructableWithSkinPitchRollColor",
      [objectid, x, y, face, roll, pitch, scale, variation, skinId, color],
      ([id, px, py, f, r, p, s, v, skin, c]) =>
        BlzCreateDestructableWithSkinPitchRollColor(
          id,
          px,
          py,
          f,
          r,
          p,
          s,
          v,
          skin,
          c,
        ),
    ),
    constructorCases(
      "BlzCreateDestructableZWithSkinPitchRollColor",
      [objectid, x, y, z, face, roll, pitch, scale, variation, skinId, color],
      ([id, px, py, pz, f, r, p, s, v, skin, c]) =>
        BlzCreateDestructableZWithSkinPitchRollColor(
          id,
          px,
          py,
          pz,
          f,
          r,
          p,
          s,
          v,
          skin,
          c,
        ),
    ),
    constructorCases(
      "BlzCreateDeadDestructableWithSkinPitchRollColor",
      [objectid, x, y, face, roll, pitch, scale, variation, skinId, color],
      ([id, px, py, f, r, p, s, v, skin, c]) =>
        BlzCreateDeadDestructableWithSkinPitchRollColor(
          id,
          px,
          py,
          f,
          r,
          p,
          s,
          v,
          skin,
          c,
        ),
    ),
    constructorCases(
      "BlzCreateDeadDestructableZWithSkinPitchRollColor",
      [objectid, x, y, z, face, roll, pitch, scale, variation, skinId, color],
      ([id, px, py, pz, f, r, p, s, v, skin, c]) =>
        BlzCreateDeadDestructableZWithSkinPitchRollColor(
          id,
          px,
          py,
          pz,
          f,
          r,
          p,
          s,
          v,
          skin,
          c,
        ),
    ),
  );
}

/**
 * The cases not to call, each as `<native> <case>`: a case that crashed the
 * game in an earlier run, named by the pending step `probe:read` printed.
 */
const SKIP: readonly string[] = [];

export function run(p: ProbeContext): void {
  runCases(p, sliceCases(), { skip: SKIP });
}
