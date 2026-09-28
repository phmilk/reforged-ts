// Handles made for one computation. A Point, a Rectangle, a Group and a
// Force each live only as long as the code that reads them: destroy each
// once read, on every client (never inside runLocal), and keep no reference
// to it. In Dev mode any later use of a destroyed Wrapper raises
// `reforged-ts: used after destroy: <Class>#<id>`; without Dev mode it
// reaches a Handle the game has freed.
import {
  Force,
  Group,
  Init,
  MapPlayer,
  Point,
  Rectangle,
  tsGlobals,
  Unit,
} from "reforged-ts";

/** Tells `player`'s allies how many enemies and items are near (x, y). */
export function scoutReport(player: MapPlayer, x: number, y: number): void {
  const spot = Point.create(x, y);
  const enemies = Group.create();
  enemies.enumUnitsInRangeOfPoint(
    spot,
    512,
    () => Unit.fromFilter()?.isEnemy(player) === true,
  );
  spot.destroy();
  const enemyCount = enemies.size;
  enemies.destroy();

  let itemCount = 0;
  const area = Rectangle.create(x - 512, y - 512, x + 512, y + 512);
  area.enumItems(
    () => true,
    () => {
      itemCount++;
    },
  );
  area.destroy();

  const allies = Force.create();
  allies.enumAllies(player, () => true);
  const recipients = allies.getPlayers();
  allies.destroy();
  for (const ally of recipients) {
    ally.displayText(
      0,
      0,
      `${String(enemyCount)} enemies and ${String(itemCount)} items near the scout`,
    );
  }
}

Init.onGameStart(() => {
  scoutReport(tsGlobals.Players[0], 0, 0);
});
