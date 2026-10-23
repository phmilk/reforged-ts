// Positive: the fields' declarations type each field's value by its
// category: a number, a boolean, a text, an enumeration's raw values, a
// Rawcode of a kind and a list of them, a list of an enumeration's values.
import type { Fields } from "reforged-builtins/fields";
import { Abilities } from "reforged-builtins/abilities";

type Value<
  Kind extends keyof Fields,
  Id extends keyof Fields[Kind],
> = Fields[Kind][Id] extends { readonly value: infer V } ? V : never;

export const speed: Value<"unit", "umvs"> = 270;
export const perishable: Value<"item", "iper"> = true;
export const name: Value<"unit", "unam"> = "Captain";
export const attackType: Value<"unit", "ua1t"> = "pierce";
export const teamColor: Value<"unit", "utco"> = -1;
export const morph: Value<"ability", "Eme1"> = FourCC("hfoo");
export const abilities: Value<"unit", "uabi"> = [
  FourCC("Aloc"),
  Abilities.Avatar_AHav,
];
export const targets: Value<"unit", "ua1g"> = ["ground", "air"];
export const levelled: Fields["ability"]["amcs"]["levels"] = true;
