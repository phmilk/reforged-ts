// A halo over a flying unit and a shadow on the ground below it, placed from
// heights and positions as each client sees them. The terrain height, a
// unit's height and where an effect is drawn can differ between clients, so
// they place visuals only: game logic reads positions every client shares,
// such as the unit's x and y.
import { Effect, Init, Point, Timer, tsGlobals, Unit } from "reforged-ts";

Init.onGameStart(() => {
  const gryphon = Unit.create(tsGlobals.Players[0], FourCC("hgry"), 0, 0);
  const halo = Effect.create(
    "Abilities\\Spells\\Human\\InnerFire\\InnerFireTarget.mdl",
    0,
    0,
  );
  const shadow = Effect.create(
    "Abilities\\Spells\\Undead\\RegenerationAura\\ObsidianRegenAura.mdl",
    0,
    0,
  );
  const ground = Point.create(0, 0);

  Timer.every(0.03, () => {
    ground.setPosition(gryphon.x, gryphon.y);
    // `localZ` reads the same height as `z` today.
    halo.setPosition(gryphon.x, gryphon.y, gryphon.localZ + 100);
    halo.setAlpha(gryphon.z - ground.z < 50 ? 0 : 255);
    // The shadow lies on the terrain under the halo and shrinks as it rises.
    shadow.setPosition(halo.x, halo.y, ground.z);
    shadow.scale = Math.max(0.2, 1 - (halo.z - ground.z) / 1000);
  });
});
