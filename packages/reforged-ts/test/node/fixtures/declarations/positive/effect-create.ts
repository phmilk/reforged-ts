// Effect's four creation members return the Wrapper itself: they throw when
// the Native fails.
import { Effect, type Widget } from "reforged-ts";

declare const target: Widget;
declare const casterArt: effecttype;

const effect: Effect = Effect.create("model.mdx", 0, 0);
const attached: Effect = Effect.createAttachment("model.mdx", target, "origin");
const spell: Effect = Effect.createSpell(FourCC("AHtc"), casterArt, 0, 0);
const spellAttached: Effect = Effect.createSpellAttachment(
  FourCC("AHtc"),
  casterArt,
  target,
  "origin",
);

export { attached, effect, spell, spellAttached };
