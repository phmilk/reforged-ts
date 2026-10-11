// The names the game gives to the Built-in objects whose names files
// disagree (#564), which reforged-builtins' generator settles by rule: the
// objects named twice, within a section or across the names files
// (`nameFileOrder`), and those whose section is cased unlike their Rawcode
// (`Profile`'s section matching). `hfoo`, `AHhb`, `BHbd` and `BHab`, named
// once, are the controls; `hfoo`'s name shows the client's locale. The
// results: docs/research/builtins-names.md.
//
// It records, per object, after a `PENDING` line naming the object and the
// Native:
//
// - `name kind=<kind> native=<Native> outcome=name|nil rawcode=<rawcode>
//   value=<name>`: what one Native gives, `nil` when it gives nothing.
//   GetObjectName for every object; GetUnitName of a unit created for each
//   unit (`outcome=no-unit` when the game creates none);
//   BlzGetAbilityTooltip at level 0 for each ability and buff;
//   BlzGetAbilityExtendedTooltip at level 0 for each buff.
// - for each buff, GetObjectName giving every buff "Default string":
//   `added rawcode=<rawcode> result=<boolean>`, what UnitAddAbility of the
//   buff's Rawcode on a new unit returns, then the buff read as that unit's
//   ability, `name … how=UnitAddAbility`: `native=BlzGetUnitAbility
//   outcome=nil` when the unit has no such ability, else
//   BlzGetAbilityStringField with ABILITY_SF_NAME and
//   BlzGetAbilityStringLevelField with ABILITY_SLF_TOOLTIP_NORMAL at level 0.
// - last, the buff of an aura, BOac of Command Aura (AOac) and BHab of
//   Brilliance Aura (AHab), 3 seconds after the aura is added to a unit:
//   `aura level=<GetUnitAbilityLevel> rawcode=<buff>`, then the buff read
//   the same way, `name … how=aura`.

import type { ProbeContext } from "../game/probe";

/** An Object kind the Probe reads, as the generator names it. */
type Kind = "unit" | "ability" | "buff";

/** The objects, by kind. */
const OBJECTS: Readonly<Record<Kind, string[]>> = {
  unit: ["Ubtr", "hfoo"],
  ability: [
    "AIfd",
    "AIff",
    "Abdf",
    "AIee",
    "Almf",
    "Aesq",
    "Atkj",
    "Atff",
    "Apoa",
    "Auic",
    "Asic",
    "AFRw",
    "Ansp",
    "Aisy",
    "AEqu",
    "AHhb",
  ],
  buff: ["Bdet", "BOac", "Xesn", "BHbd", "BHab"],
};

/** Each aura's buff, by the aura that applies it. */
const AURAS: Readonly<Record<string, string>> = { AOac: "BOac", AHab: "BHab" };

/** The object a `name` record is about, and how a buff came to a unit. */
interface Subject {
  rawcode: string;
  kind: Kind;
  how?: string;
}

/** A `name` record's outcome for `value`, which may be nothing. */
function named(value: string | undefined): Record<string, string> {
  return value === undefined ? { outcome: "nil" } : { outcome: "name", value };
}

/** Records what `native` gave for `subject`: `outcome`, from `named` or its own. */
function recordName(
  p: ProbeContext,
  subject: Subject,
  native: string,
  outcome: Record<string, string>,
): void {
  p.record("name", {
    rawcode: subject.rawcode,
    kind: subject.kind,
    ...(subject.how !== undefined && { how: subject.how }),
    native,
    ...outcome,
  });
}

/** Adds the `PENDING` line of `native` on `subject`, then records what it gives. */
function readName(
  p: ProbeContext,
  subject: Subject,
  native: string,
  read: () => string | undefined,
): void {
  p.pending(`${subject.rawcode} ${native}`);
  recordName(p, subject, native, named(read()));
}

/** A unit of Player 0 at the centre, or undefined when the game makes none. */
function createUnit(rawcode: string): unit | undefined {
  const owner = Player(0);
  return owner === undefined
    ? undefined
    : CreateUnit(owner, FourCC(rawcode), 0, 0, 0);
}

/** Records the name and the level-0 tooltip of `subject` as an ability of `whichUnit`. */
function recordUnitAbility(
  p: ProbeContext,
  whichUnit: unit,
  subject: Subject,
): void {
  const ability = BlzGetUnitAbility(whichUnit, FourCC(subject.rawcode));
  if (ability === undefined) {
    recordName(p, subject, "BlzGetUnitAbility", { outcome: "nil" });
    return;
  }
  readName(p, subject, "BlzGetAbilityStringField ABILITY_SF_NAME", () =>
    BlzGetAbilityStringField(ability, ABILITY_SF_NAME),
  );
  readName(
    p,
    subject,
    "BlzGetAbilityStringLevelField ABILITY_SLF_TOOLTIP_NORMAL",
    () => BlzGetAbilityStringLevelField(ability, ABILITY_SLF_TOOLTIP_NORMAL, 0),
  );
}

/** Reads `subject`, a buff, as an ability added to a new unit. */
function recordAddedBuff(p: ProbeContext, subject: Subject): void {
  p.pending(`${subject.rawcode} UnitAddAbility`);
  const holder = createUnit("hfoo");
  if (holder === undefined) return;
  p.record("added", {
    rawcode: subject.rawcode,
    result: tostring(UnitAddAbility(holder, FourCC(subject.rawcode))),
  });
  recordUnitAbility(p, holder, { ...subject, how: "UnitAddAbility" });
  RemoveUnit(holder);
}

/** Records `subject`'s name as GetUnitName gives it for a unit created of it. */
function recordUnitName(p: ProbeContext, subject: Subject): void {
  p.pending(`${subject.rawcode} GetUnitName`);
  const created = createUnit(subject.rawcode);
  recordName(
    p,
    subject,
    "GetUnitName",
    created === undefined
      ? { outcome: "no-unit" }
      : named(GetUnitName(created)),
  );
  if (created !== undefined) RemoveUnit(created);
}

export function run(p: ProbeContext): void {
  for (const [kind, rawcodes] of Object.entries(OBJECTS) as [
    Kind,
    string[],
  ][]) {
    for (const rawcode of rawcodes) {
      const subject: Subject = { rawcode, kind };
      const id = FourCC(rawcode);
      readName(p, subject, "GetObjectName", () => GetObjectName(id));
      if (kind !== "unit") {
        readName(p, subject, "BlzGetAbilityTooltip", () =>
          BlzGetAbilityTooltip(id, 0),
        );
      }
      if (kind === "buff") {
        readName(p, subject, "BlzGetAbilityExtendedTooltip", () =>
          BlzGetAbilityExtendedTooltip(id, 0),
        );
        recordAddedBuff(p, subject);
      }
      if (kind === "unit") recordUnitName(p, subject);
      p.checkpoint();
    }
  }

  p.pending("auras");
  const bearers: [unit, string][] = [];
  for (const [aura, buff] of Object.entries(AURAS)) {
    const bearer = createUnit("hfoo");
    if (bearer === undefined) continue;
    UnitAddAbility(bearer, FourCC(aura));
    bearers.push([bearer, buff]);
  }
  p.checkpoint();
  p.hold();
  p.after(3, () => {
    for (const [bearer, buff] of bearers) {
      p.record("aura", {
        rawcode: buff,
        level: String(GetUnitAbilityLevel(bearer, FourCC(buff))),
      });
      recordUnitAbility(p, bearer, {
        rawcode: buff,
        kind: "buff",
        how: "aura",
      });
    }
    p.finish();
  });
}
