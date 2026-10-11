// The names the game gives to the Built-in objects whose names files
// disagree (#564), which reforged-builtins' generator settles by rule: the
// objects named twice, within a section or across the names files
// (`nameFileOrder`), and those whose section is cased unlike their Rawcode
// (`Profile`'s section matching). One `name` record per object and Native:
// GetObjectName for every object, BlzGetAbilityTooltip at level 0 for the
// abilities, GetUnitName of a unit created for the units. `hfoo`, `AHhb`,
// `BHbd` and `BHab`, named once, are the controls; `hfoo`'s name shows the
// client's locale.
//
// GetObjectName gives every buff "Default string", so a buff is also read
// as an ability: the tooltip Natives on its Rawcode, then the buff added to
// a unit with UnitAddAbility, read through BlzGetUnitAbility, and last the
// buff of an aura, BOac of Command Aura (AOac) and BHab of Brilliance Aura
// (AHab), read the same way once the aura has had 3 seconds to apply it.

import type { ProbeContext } from "../game/probe";

/** The objects, by kind, as the generator names them. */
const OBJECTS: Readonly<Record<"unit" | "ability" | "buff", string[]>> = {
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

/** A name record's fields for `value`, which may be nothing. */
function named(value: string | undefined): Record<string, string> {
  return value === undefined ? { outcome: "nil" } : { outcome: "name", value };
}

/** A unit of Player 0 at the centre, or undefined when the game makes none. */
function createUnit(rawcode: string): unit | undefined {
  const owner = Player(0);
  return owner === undefined
    ? undefined
    : CreateUnit(owner, FourCC(rawcode), 0, 0, 0);
}

/**
 * Records the name and the level-0 tooltip of the ability `rawcode` of
 * `whichUnit`, as `how` came to hold it.
 */
function recordUnitAbility(
  p: ProbeContext,
  whichUnit: unit,
  rawcode: string,
  kind: string,
  how: string,
): void {
  const ability = BlzGetUnitAbility(whichUnit, FourCC(rawcode));
  if (ability === undefined) {
    p.record("name", {
      rawcode,
      kind,
      how,
      native: "BlzGetUnitAbility",
      outcome: "nil",
    });
    return;
  }
  p.record("name", {
    rawcode,
    kind,
    how,
    native: "BlzGetAbilityStringField ABILITY_SF_NAME",
    ...named(BlzGetAbilityStringField(ability, ABILITY_SF_NAME)),
  });
  p.record("name", {
    rawcode,
    kind,
    how,
    native: "BlzGetAbilityStringLevelField ABILITY_SLF_TOOLTIP_NORMAL",
    ...named(
      BlzGetAbilityStringLevelField(ability, ABILITY_SLF_TOOLTIP_NORMAL, 0),
    ),
  });
}

export function run(p: ProbeContext): void {
  for (const [kind, rawcodes] of Object.entries(OBJECTS)) {
    for (const rawcode of rawcodes) {
      const id = FourCC(rawcode);
      p.pending(`${rawcode} GetObjectName`);
      p.record("name", {
        rawcode,
        kind,
        native: "GetObjectName",
        ...named(GetObjectName(id)),
      });
      if (kind === "ability" || kind === "buff") {
        p.pending(`${rawcode} BlzGetAbilityTooltip`);
        p.record("name", {
          rawcode,
          kind,
          native: "BlzGetAbilityTooltip",
          ...named(BlzGetAbilityTooltip(id, 0)),
        });
      }
      if (kind === "buff") {
        p.pending(`${rawcode} BlzGetAbilityExtendedTooltip`);
        p.record("name", {
          rawcode,
          kind,
          native: "BlzGetAbilityExtendedTooltip",
          ...named(BlzGetAbilityExtendedTooltip(id, 0)),
        });
        p.pending(`${rawcode} UnitAddAbility`);
        const holder = createUnit("hfoo");
        if (holder !== undefined) {
          p.record("added", {
            rawcode,
            result: tostring(UnitAddAbility(holder, id)),
          });
          recordUnitAbility(p, holder, rawcode, kind, "UnitAddAbility");
          RemoveUnit(holder);
        }
      }
      if (kind === "unit") {
        p.pending(`${rawcode} GetUnitName`);
        const created = createUnit(rawcode);
        p.record("name", {
          rawcode,
          kind,
          native: "GetUnitName",
          ...(created === undefined
            ? { outcome: "no-unit" }
            : named(GetUnitName(created))),
        });
        if (created !== undefined) RemoveUnit(created);
      }
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
      recordUnitAbility(p, bearer, buff, "buff", "aura");
    }
    p.finish();
  });
}
