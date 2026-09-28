// A footman placed on walkable ground. `Terrain.isPathable` passes on the
// game's inverted answer: `true` where the pathing type is NOT set, so a
// point ground units can walk on is one where it returns `false`.
import { Init, MapPlayer, Terrain, Unit } from "reforged-ts";

/** Tells whether ground units can walk at (x, y). */
export function isWalkable(x: number, y: number): boolean {
  return !Terrain.isPathable(x, y, PATHING_TYPE_WALKABILITY);
}

Init.onGameStart(() => {
  const owner = MapPlayer.fromIndex(0);
  let x = 0;
  while (x < 2048 && !isWalkable(x, 0)) {
    x += 64;
  }
  if (owner) {
    Unit.create(owner, FourCC("hfoo"), x, 0);
  }
});
