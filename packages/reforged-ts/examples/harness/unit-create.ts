// A footman and a Paladin for the first player. Creating a unit throws on an
// unknown rawcode; reading an inventory slot is a lookup, undefined when the
// slot is empty; the owner is never undefined.
import { Init, tsGlobals, Unit } from "reforged-ts";

Init.onTriggers(() => {
  const owner = tsGlobals.Players[0];
  const footman = Unit.create(owner, FourCC("hfoo"), -128, 0);
  const paladin = Unit.create(owner, FourCC("Hpal"), 128, 0, 90);

  paladin.setHeroLevel(3, false);
  paladin.addItemById(FourCC("rde1"));
  const ring = paladin.getItemInSlot(0);
  const secondSlot = paladin.getItemInSlot(1);
  print(`level ${String(paladin.getHeroLevel())}`);
  print(`ring carried: ${String(ring !== undefined)}`);
  print(`second slot empty: ${String(secondSlot === undefined)}`);
  print(`owned by the first player: ${String(paladin.getOwner() === owner)}`);

  footman.destroy();
});
