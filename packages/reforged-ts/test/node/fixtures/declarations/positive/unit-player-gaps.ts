// The creation statics closed by #173 are non-null Wrappers, the player event
// lookups are the Wrapper or undefined, and the neutral orders answer a
// boolean.
import { FogModifier, MapPlayer, Point, Unit } from "reforged-ts";

declare const owner: MapPlayer;
declare const shop: Unit;
declare const where: Point;
declare const masked: fogstate;

const corpse: Unit = Unit.createCorpse(owner, FourCC("hfoo"), 0, 0);
const byName: Unit = Unit.createAtPointByName(owner, "footman", where);
const mine: Unit = Unit.createBlightedGoldmine(owner, 0, 0);
const modifier: FogModifier = FogModifier.createAtPoint(
  owner,
  masked,
  where,
  512,
  true,
  false,
);
const winner: MapPlayer | undefined = MapPlayer.fromWinning();
const sold: boolean = shop.issueNeutralImmediateOrder(owner, "footman");

export { byName, corpse, mine, modifier, sold, winner };
