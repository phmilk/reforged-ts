// Removing a unit, an item or a destructable from the game at once with
// destroy(), where kill() would let it die. A destroyed unit fires no death
// event, leaves no corpse and gives no bounty, so call destroy() for what
// must vanish without a trace, such as a dummy unit or a used token.
// Every reference to it is dead afterwards: remove it from the maps and
// groups that hold it, since in Dev mode any use of a destroyed Wrapper
// raises `reforged-ts: used after destroy: <Class>#<id>`.
import {
  Destructable,
  HandleMap,
  Init,
  Item,
  tsGlobals,
  Unit,
} from "reforged-ts";

/** The token each hero carries, while it carries one. */
const tokens = new HandleMap<Unit, Item>();

/** Spends `hero`'s token: the item vanishes and the entry goes with it. */
export function spendToken(hero: Unit): void {
  const token = tokens.get(hero);
  if (token === undefined) {
    return;
  }
  tokens.delete(hero);
  token.destroy();
}

Init.onTriggers(() => {
  const owner = tsGlobals.Players[0];
  const hero = Unit.create(owner, FourCC("Hpal"), 0, 0);
  const token = Item.create(FourCC("ratf"), 64, 0);
  hero.addItem(token);
  tokens.set(hero, token);
  spendToken(hero);

  // A dummy unit, removed once its work is done: no death, no corpse.
  const dummy = Unit.create(owner, FourCC("hfoo"), 128, 0);
  dummy.destroy();

  // A gate removed when opened, rather than left as a broken one.
  const gate = Destructable.create({ typeId: FourCC("LTg1"), x: 256, y: 0 });
  gate.destroy();
});
