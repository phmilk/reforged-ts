/**
 * Rawcodes typed by Object kind (ADR 0012): which `integer` of a Patch is a
 * Rawcode, of which kind, and how its type reads in a signature. The
 * generator only uses the types `rawcode.d.ts` declares (`Rawcode<K>`); it
 * never declares them.
 *
 * A parameter takes its kind from its Overlay `kind`, else from the
 * parameter-name table below; a return or a global takes it from its Overlay
 * `kind` only, since it has no name to look up. The Rawcode-name pattern only
 * decides what must be classified: an `integer` parameter or return it
 * matches with no kind is an `unclassified-rawcode` error, and so is an
 * `integer` global whose value is a four-character literal or names such a
 * global.
 */
import type { Parameter } from "./model.js";

/** The Object kinds, in the order `rawcode.d.ts` declares `ObjectKind`. */
export const OBJECT_KINDS = [
  "unit",
  "item",
  "ability",
  "buff",
  "destructable",
  "doodad",
  "upgrade",
] as const;

export type ObjectKind = (typeof OBJECT_KINDS)[number];

/** What an Overlay `kind` field holds: one Object kind, or any kind. */
export type OverlayKind = ObjectKind | "any";

/** The values an Overlay `kind` field accepts, in order. */
export const OVERLAY_KINDS: readonly OverlayKind[] = [...OBJECT_KINDS, "any"];

/** Whether `value` is a valid Overlay `kind`. */
export function isOverlayKind(value: unknown): value is OverlayKind {
  return (
    typeof value === "string" &&
    (OVERLAY_KINDS as readonly string[]).includes(value)
  );
}

/**
 * The kind of a Rawcode as a declaration item takes it: one or more Object
 * kinds (a union, `techid`), or any kind. A union comes from the table only.
 */
export type RawcodeKind = "any" | readonly [ObjectKind, ...ObjectKind[]];

/** The table's mark for a name that looks like a Rawcode and is not one. */
const NOT_A_RAWCODE = "not a Rawcode";

/**
 * The parameter-name table: each unambiguous `integer` parameter name of the
 * Patch files, matched exactly (case included), with its kind, or
 * `NOT_A_RAWCODE` for a name that stays `number` on purpose. A name whose
 * kind depends on the function (`objectid`, `id`, `skinId`, `inID`, `a`)
 * is not here: each use carries an Overlay `kind`.
 */
const PARAMETER_NAMES: Readonly<
  Record<string, RawcodeKind | typeof NOT_A_RAWCODE>
> = {
  // Units, heroes included.
  unitId: ["unit"],
  unitid: ["unit"],
  unitType: ["unit"],
  newUnitId: ["unit"],
  portraitUnitId: ["unit"],
  speakerType: ["unit"],
  baseid: ["unit"],
  newid: ["unit"],
  uid: ["unit"],
  hall: ["unit"],
  id1: ["unit"],
  id2: ["unit"],
  id3: ["unit"],
  id4: ["unit"],
  u1: ["unit"],
  u2: ["unit"],
  u3: ["unit"],
  u4: ["unit"],
  u5: ["unit"],
  u6: ["unit"],
  u7: ["unit"],
  u8: ["unit"],
  u9: ["unit"],
  uA: ["unit"],
  // Items.
  itemId: ["item"],
  itemid: ["item"],
  inItemID: ["item"],
  // Abilities.
  abilCode: ["ability"],
  abilcode: ["ability"],
  abilId: ["ability"],
  abilid: ["ability"],
  abilityId: ["ability"],
  whichAbility: ["ability"],
  // Buffs.
  buffId: ["buff"],
  buffcode: ["buff"],
  // Doodads.
  doodadID: ["doodad"],
  // Upgrades; `whichUprgade` is the Patch's spelling.
  upgid: ["upgrade"],
  whichUpgrade: ["upgrade"],
  whichUprgade: ["upgrade"],
  // A unit or an upgrade: the tech of the player's tech tree.
  techid: ["unit", "upgrade"],
  techId: ["unit", "upgrade"],
  // Any kind.
  objectId: "any",
  // Codes that look like Rawcodes and are not: orders, weather effects,
  // terrain types, players, towns and the enums of blizzard.j.
  order: NOT_A_RAWCODE,
  orderId: NOT_A_RAWCODE,
  effectID: NOT_A_RAWCODE,
  terrainType: NOT_A_RAWCODE,
  imageType: NOT_A_RAWCODE,
  cameraType: NOT_A_RAWCODE,
  playerid: NOT_A_RAWCODE,
  pid: NOT_A_RAWCODE,
  convertedPlayerId: NOT_A_RAWCODE,
  townid: NOT_A_RAWCODE,
  buffType: NOT_A_RAWCODE,
  fadetype: NOT_A_RAWCODE,
  keType: NOT_A_RAWCODE,
  meType: NOT_A_RAWCODE,
  messageType: NOT_A_RAWCODE,
  questType: NOT_A_RAWCODE,
  sortType: NOT_A_RAWCODE,
  timeType: NOT_A_RAWCODE,
  valueType: NOT_A_RAWCODE,
};

/**
 * The Rawcode-name pattern: the names ending in `id`, `code` or `type`, in
 * any case, and the Rawcode names of the Patch files that do not end so
 * (`u1` of common.ai, `whichAbility`); the table classifies every one of the
 * latter.
 */
const RAWCODE_NAME = /(id|code|type)$/i;

const RAWCODE_NAMES_OTHERWISE: ReadonlySet<string> = new Set(
  Object.entries(PARAMETER_NAMES)
    .filter(
      ([name, kind]) => kind !== NOT_A_RAWCODE && !RAWCODE_NAME.test(name),
    )
    .map(([name]) => name),
);

/** Whether a name must be classified when it names an `integer`. */
function looksLikeRawcode(name: string): boolean {
  return RAWCODE_NAME.test(name) || RAWCODE_NAMES_OTHERWISE.has(name);
}

/** The kind an Overlay `kind` field gives. */
export function overlayKind(kind: OverlayKind): RawcodeKind {
  return kind === "any" ? "any" : [kind];
}

/**
 * A parameter's kind: its Overlay `kind`, else the table's; `undefined`
 * when it is not a Rawcode; `"unclassified"` when it looks like one and
 * neither classifies it. Only an `integer` is a Rawcode.
 */
export function parameterKind(
  param: Parameter,
  kind: OverlayKind | undefined,
): RawcodeKind | "unclassified" | undefined {
  if (kind !== undefined) return overlayKind(kind);
  if (param.type !== "integer") return undefined;
  const listed = Object.hasOwn(PARAMETER_NAMES, param.name)
    ? PARAMETER_NAMES[param.name]
    : undefined;
  if (listed === NOT_A_RAWCODE) return undefined;
  if (listed !== undefined) return listed;
  return looksLikeRawcode(param.name) ? "unclassified" : undefined;
}

/**
 * The functions whose name the pattern matches and whose `integer` return is
 * not a Rawcode: order ids, handle ids, players, point values, counts, and
 * camera and terrain types. They stay `number` on purpose.
 */
const NOT_A_RAWCODE_RETURNS: ReadonlySet<string> = new Set([
  "OrderId",
  "GetIssuedOrderId",
  "GetHandleId",
  "GetPlayerId",
  "GetConvertedPlayerId",
  "GetUnitPointValueByType",
  "CountLivingPlayerUnitsOfTypeId",
  "BlzCameraGetCameraType",
  "BlzCameraSetupGetCameraType",
  "GetTerrainType",
]);

/**
 * The functions of the Patch files whose name the pattern does not match and
 * whose `integer` return is a Rawcode: the learnt skill, the researched
 * upgrade, the random picks, the skins, and common.ai's hero picks. Their
 * Overlay gives the kind; listing them here makes it required.
 */
const RAWCODE_RETURNS_OTHERWISE: ReadonlySet<string> = new Set([
  "GetLearnedSkill",
  "GetLearnedSkillBJ",
  "GetResearched",
  "ChooseRandomCreep",
  "ChooseRandomCreepBJ",
  "ChooseRandomNPBuilding",
  "ChooseRandomNPBuildingBJ",
  "ChooseRandomItem",
  "ChooseRandomItemBJ",
  "ChooseRandomItemEx",
  "ChooseRandomItemExBJ",
  "ChooseRandomItemExWithFilter",
  "ChooseRandomItemExWithFilterBJ",
  "BlzGetUnitSkin",
  "BlzGetItemSkin",
  "String2UnitIdBJ",
  "RandomDistChoose",
  "PickMeleeHero",
  "SkillArrays",
]);

/**
 * A function's return kind: its Overlay `returns.kind`; `undefined` when it
 * is not a Rawcode; `"unclassified"` when it is an `integer` of a function
 * whose name looks like a Rawcode's (the parameter pattern, or the list
 * above) that is neither classified nor known not to be one.
 */
export function returnKind(
  fn: { name: string; returns: string },
  kind: OverlayKind | undefined,
): RawcodeKind | "unclassified" | undefined {
  if (kind !== undefined) return overlayKind(kind);
  if (fn.returns !== "integer" || NOT_A_RAWCODE_RETURNS.has(fn.name)) {
    return undefined;
  }
  return RAWCODE_NAME.test(fn.name) || RAWCODE_RETURNS_OTHERWISE.has(fn.name)
    ? "unclassified"
    : undefined;
}

/** A four-character literal, `'hfoo'`, as a Patch file writes a Rawcode. */
const FOUR_CHARACTERS = /^'[^']{4}'$/;

/**
 * The `integer` globals of `globals` that look like Rawcodes: those whose
 * value is a four-character literal (`FOOTMAN = 'hfoo'`), and those whose
 * value names another one (`FOOTMEN = FOOTMAN`). An array has no value.
 */
export function rawcodeGlobals(
  globals: readonly {
    name: string;
    type: string;
    array: boolean;
    initializer?: string;
  }[],
): ReadonlySet<string> {
  const integers = globals.filter((g) => g.type === "integer" && !g.array);
  const found = new Set(
    integers
      .filter((g) => FOUR_CHARACTERS.test(g.initializer?.trim() ?? ""))
      .map((g) => g.name),
  );
  // An alias may name an alias: follow until nothing is added.
  for (let size = -1; size !== found.size;) {
    size = found.size;
    for (const g of integers) {
      if (found.has(g.initializer?.trim() ?? "")) found.add(g.name);
    }
  }
  return found;
}

/**
 * The TypeScript type of a Rawcode of `kind`: `Rawcode<"unit">`,
 * `Rawcode<"unit" | "upgrade">`, or `Rawcode` for any kind.
 */
export function rawcodeType(kind: RawcodeKind): string {
  if (kind === "any") return "Rawcode";
  return `Rawcode<${kind.map((k) => JSON.stringify(k)).join(" | ")}>`;
}
