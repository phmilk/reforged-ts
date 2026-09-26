// The creation variants closed by #174 are non-null Wrappers, the event
// lookups are the Wrapper or undefined, and a minimap icon is the game's
// raw handle.
import {
  Destructable,
  Effect,
  Item,
  Point,
  Sound,
  type Widget,
} from "reforged-ts";

declare const where: Point;
declare const target: Widget;
declare const masked: fogstate;
declare const caster: effecttype;

const byString: Effect = Effect.createSpell("AHtc", caster, 0, 0);
const byId: Effect = Effect.createSpellAtPoint(FourCC("AHtc"), caster, where);
const attached: Effect = Effect.createSpellAttachment(
  "AHtc",
  caster,
  target,
  "origin",
);
const atPoint: Effect = Effect.createAtPoint("model.mdx", where);
const midi: Sound = Sound.createMIDI("QuestCompleted", 12, 12);
const enumerated: Item | undefined = Item.fromEnum();
const ordered: Destructable | undefined = Destructable.fromOrderTarget();
const spellTarget: Point | undefined = Point.fromSpellTarget();
const icon: minimapicon | undefined = where.createMinimapIcon(
  255,
  0,
  0,
  "UI/Minimap/Ping.mdx",
  masked,
);

export {
  atPoint,
  attached,
  byId,
  byString,
  enumerated,
  icon,
  midi,
  ordered,
  spellTarget,
};
