// Two rations on the ground near the map's centre, the second in the skin of
// another item type: given a skin, `Item.create` calls BlzCreateItemWithSkin.
import { Init, Item } from "reforged-ts";

Init.onTriggers(() => {
  Item.create(FourCC("ratf"), 256, -128);
  Item.create(FourCC("ratf"), 320, -128, FourCC("rat9"));
});
