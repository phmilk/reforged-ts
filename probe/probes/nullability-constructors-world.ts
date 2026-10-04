// The Nullability sweep's Slice `nullability-constructors-world` (#393):
// the 41 constructors of world objects, in `common.j` order, each declared
// for the constructors' case generator (./nullability/constructor.ts), and
// what each call returned recorded (./nullability/case-runner.ts).
// `pnpm probe:nullability-report nullability-constructors-world` turns its
// Result file into this Slice's section of the sweep report. The arguments
// come from the Fixtures (./nullability/fixtures.ts), built before the
// cases run; the stale handles are of group b, so they run last.

import type { ProbeContext } from "../game/probe";
import { type ReturnCase, runCases } from "./nullability/case-runner";
import { constructorCases } from "./nullability/constructor";
import { inGroupOrder } from "./nullability/expand";
import {
  deadDestructable,
  deadHero,
  deadItem,
  deadUnit,
  destroyedItemPool,
  destroyedUnitPool,
  emptyItemPool,
  emptyUnitPool,
  liveHero,
  liveItemPool,
  liveLocation,
  liveRect,
  liveUnit,
  liveUnitPool,
  removedDestructable,
  removedHero,
  removedItem,
  removedLocation,
  removedRect,
  removedUnit,
  userSlotPlayer,
} from "./nullability/fixtures";
import {
  fixed,
  handle,
  numeric,
  player,
  rawcode,
  text,
} from "./nullability/parameters";

/**
 * A case beyond the generator's, of live arguments (group a): one the
 * handle-type catalogue (#362) names for `native` and the constructors'
 * rule cannot reach, since it varies no boolean and runs no other live
 * object, such as a unit with no inventory. Labelled `<param>: <phrase>`
 * as a generated case.
 */
function catalogueCase(
  native: string,
  label: string,
  call: () => unknown,
): ReturnCase[] {
  return [{ native, label, group: "a", call }];
}

/**
 * The Slice's cases, every (a) case before any (b) case, over the Fixtures
 * built here before any case runs. A unit, an item and a destructable each
 * run dead and removed, and a `widget` parameter runs all six, its typical
 * value a footman; a location and a rect removed, a unit pool and an item
 * pool destroyed. A player parameter is `Player(0)` only, by the
 * constructors' rule. Booleans, the `effecttype` and the `fogstate` are
 * fixed.
 *
 * The catalogue's cases (`catalogueCase`): an empty unit pool and item
 * pool, a unit with no inventory, and lightning that checks visibility,
 * which jassdoc gives as returning nothing when the local player does not
 * see its points.
 */
function sliceCases(): ReturnCase[] {
  const footman = FourCC("hfoo");
  const claws = FourCC("ratf");
  const location = (name: string) =>
    handle(name, liveLocation(256, 256), [
      ["removed location", removedLocation()],
    ]);
  const widgetStale = [
    ["dead unit", deadUnit()],
    ["removed unit", removedUnit()],
    ["dead item", deadItem()],
    ["removed item", removedItem()],
    ["dead destructable", deadDestructable()],
    ["removed destructable", removedDestructable()],
  ] as const;
  const targetWidget = handle<widget>("targetWidget", liveUnit(), widgetStale);
  const whichUnit = handle("whichUnit", liveUnit(), [
    ["dead unit", deadUnit()],
    ["removed unit", removedUnit()],
  ]);
  const holyLight = FourCC("AHhb");
  const model = "Abilities\\Spells\\Human\\HolyBolt\\HolyBoltSpecialArt.mdl";
  const pingPath = "UI\\Minimap\\MiniMap-ControlPoint.mdl";
  const noInventory = liveUnit();
  const emptyPool = emptyUnitPool();
  const emptyItems = emptyItemPool();
  const user = userSlotPlayer();
  return inGroupOrder(
    constructorCases(
      "CreateItem",
      [rawcode("itemid", claws), numeric("x", 256), numeric("y", 256)],
      ([itemid, x, y]) => CreateItem(itemid, x, y),
    ),
    constructorCases(
      "CreateUnit",
      [
        player("id"),
        rawcode("unitid", footman),
        numeric("x", 256),
        numeric("y", 256),
        numeric("face", 270),
      ],
      ([p, unitid, x, y, face]) => CreateUnit(p, unitid, x, y, face),
    ),
    constructorCases(
      "CreateUnitByName",
      [
        player("whichPlayer"),
        text("unitname", "footman"),
        numeric("x", 256),
        numeric("y", 256),
        numeric("face", 270),
      ],
      ([p, unitname, x, y, face]) => CreateUnitByName(p, unitname, x, y, face),
    ),
    constructorCases(
      "CreateUnitAtLoc",
      [
        player("id"),
        rawcode("unitid", footman),
        location("whichLocation"),
        numeric("face", 270),
      ],
      ([p, unitid, where, face]) => CreateUnitAtLoc(p, unitid, where, face),
    ),
    constructorCases(
      "CreateUnitAtLocByName",
      [
        player("id"),
        text("unitname", "footman"),
        location("whichLocation"),
        numeric("face", 270),
      ],
      ([p, unitname, where, face]) =>
        CreateUnitAtLocByName(p, unitname, where, face),
    ),
    constructorCases(
      "CreateCorpse",
      [
        player("whichPlayer"),
        rawcode("unitid", footman),
        numeric("x", 256),
        numeric("y", 256),
        numeric("face", 270),
      ],
      ([p, unitid, x, y, face]) => CreateCorpse(p, unitid, x, y, face),
    ),
    constructorCases(
      "UnitAddItemById",
      [
        handle("whichUnit", liveHero(), [
          ["dead hero", deadHero()],
          ["removed hero", removedHero()],
        ]),
        rawcode("itemId", claws),
      ],
      ([hero, itemId]) => UnitAddItemById(hero, itemId),
    ),
    // A footman has no inventory: jassdoc gives nothing, the item left on
    // the ground.
    catalogueCase("UnitAddItemById", "whichUnit: unit with no inventory", () =>
      UnitAddItemById(noInventory, claws),
    ),
    constructorCases("CreateUnitPool", [], () => CreateUnitPool()),
    constructorCases(
      "PlaceRandomUnit",
      [
        handle("whichPool", liveUnitPool(), [
          ["destroyed unit pool", destroyedUnitPool()],
        ]),
        player("forWhichPlayer"),
        numeric("x", 256),
        numeric("y", 256),
        numeric("facing", 270),
      ],
      ([pool, p, x, y, facing]) => PlaceRandomUnit(pool, p, x, y, facing),
    ),
    catalogueCase("PlaceRandomUnit", "whichPool: empty unit pool", () =>
      PlaceRandomUnit(emptyPool, user, 256, 256, 270),
    ),
    constructorCases("CreateItemPool", [], () => CreateItemPool()),
    constructorCases(
      "PlaceRandomItem",
      [
        handle("whichItemPool", liveItemPool(), [
          ["destroyed item pool", destroyedItemPool()],
        ]),
        numeric("x", 256),
        numeric("y", 256),
      ],
      ([pool, x, y]) => PlaceRandomItem(pool, x, y),
    ),
    catalogueCase("PlaceRandomItem", "whichItemPool: empty item pool", () =>
      PlaceRandomItem(emptyItems, 256, 256),
    ),
    constructorCases(
      "CreateMinimapIconOnUnit",
      [
        whichUnit,
        numeric("red", 255),
        numeric("green", 255),
        numeric("blue", 255),
        text("pingPath", pingPath),
        fixed("fogVisibility", FOG_OF_WAR_VISIBLE),
      ],
      ([u, red, green, blue, path, fog]) =>
        CreateMinimapIconOnUnit(u, red, green, blue, path, fog),
    ),
    constructorCases(
      "CreateMinimapIconAtLoc",
      [
        location("where"),
        numeric("red", 255),
        numeric("green", 255),
        numeric("blue", 255),
        text("pingPath", pingPath),
        fixed("fogVisibility", FOG_OF_WAR_VISIBLE),
      ],
      ([where, red, green, blue, path, fog]) =>
        CreateMinimapIconAtLoc(where, red, green, blue, path, fog),
    ),
    constructorCases(
      "CreateMinimapIcon",
      [
        numeric("x", 256),
        numeric("y", 256),
        numeric("red", 255),
        numeric("green", 255),
        numeric("blue", 255),
        text("pingPath", pingPath),
        fixed("fogVisibility", FOG_OF_WAR_VISIBLE),
      ],
      ([x, y, red, green, blue, path, fog]) =>
        CreateMinimapIcon(x, y, red, green, blue, path, fog),
    ),
    constructorCases("CreateTextTag", [], () => CreateTextTag()),
    constructorCases(
      "CreateTrackable",
      [
        text("trackableModelPath", model),
        numeric("x", 256),
        numeric("y", 256),
        numeric("facing", 270),
      ],
      ([path, x, y, facing]) => CreateTrackable(path, x, y, facing),
    ),
    // The fade rates and the labels of blizzard.j's own sounds.
    constructorCases(
      "CreateSound",
      [
        text("fileName", "Sound\\Interface\\QuestNew.flac"),
        fixed("looping", false),
        fixed("is3D", false),
        fixed("stopwhenoutofrange", false),
        numeric("fadeInRate", 10000),
        numeric("fadeOutRate", 10000),
        text("eaxSetting", "DefaultEAXON"),
      ],
      ([file, looping, is3D, stop, fadeIn, fadeOut, eax]) =>
        CreateSound(file, looping, is3D, stop, fadeIn, fadeOut, eax),
    ),
    constructorCases(
      "CreateSoundFilenameWithLabel",
      [
        text("fileName", "Sound\\Interface\\QuestNew.flac"),
        fixed("looping", false),
        fixed("is3D", false),
        fixed("stopwhenoutofrange", false),
        numeric("fadeInRate", 10000),
        numeric("fadeOutRate", 10000),
        text("SLKEntryName", "QuestNew"),
      ],
      ([file, looping, is3D, stop, fadeIn, fadeOut, label]) =>
        CreateSoundFilenameWithLabel(
          file,
          looping,
          is3D,
          stop,
          fadeIn,
          fadeOut,
          label,
        ),
    ),
    constructorCases(
      "CreateSoundFromLabel",
      [
        text("soundLabel", "QuestNew"),
        fixed("looping", false),
        fixed("is3D", false),
        fixed("stopwhenoutofrange", false),
        numeric("fadeInRate", 10000),
        numeric("fadeOutRate", 10000),
      ],
      ([label, looping, is3D, stop, fadeIn, fadeOut]) =>
        CreateSoundFromLabel(label, looping, is3D, stop, fadeIn, fadeOut),
    ),
    // The Probe map's own day ambience (war3map.lua).
    constructorCases(
      "CreateMIDISound",
      [
        text("soundLabel", "LordaeronSummerDay"),
        numeric("fadeInRate", 20),
        numeric("fadeOutRate", 20),
      ],
      ([label, fadeIn, fadeOut]) => CreateMIDISound(label, fadeIn, fadeOut),
    ),
    // Ashenvale heavy rain.
    constructorCases(
      "AddWeatherEffect",
      [
        handle("where", liveRect(), [["removed rect", removedRect()]]),
        rawcode("effectID", FourCC("RAhr")),
      ],
      ([where, effectID]) => AddWeatherEffect(where, effectID),
    ),
    constructorCases(
      "TerrainDeformCrater",
      [
        numeric("x", 256),
        numeric("y", 256),
        numeric("radius", 256),
        numeric("depth", 64),
        numeric("duration", 1000),
        fixed("permanent", false),
      ],
      ([x, y, radius, depth, duration, permanent]) =>
        TerrainDeformCrater(x, y, radius, depth, duration, permanent),
    ),
    constructorCases(
      "TerrainDeformRipple",
      [
        numeric("x", 256),
        numeric("y", 256),
        numeric("radius", 512),
        numeric("depth", 64),
        numeric("duration", 1000),
        numeric("count", 1),
        numeric("spaceWaves", 128),
        numeric("timeWaves", 0.5),
        numeric("radiusStartPct", 0.25),
        fixed("limitNeg", false),
      ],
      ([x, y, radius, depth, duration, count, space, time, start, limitNeg]) =>
        TerrainDeformRipple(
          x,
          y,
          radius,
          depth,
          duration,
          count,
          space,
          time,
          start,
          limitNeg,
        ),
    ),
    constructorCases(
      "TerrainDeformWave",
      [
        numeric("x", 256),
        numeric("y", 256),
        numeric("dirX", 1),
        numeric("dirY", 1),
        numeric("distance", 512),
        numeric("speed", 512),
        numeric("radius", 128),
        numeric("depth", 64),
        numeric("trailTime", 500),
        numeric("count", 1),
      ],
      ([x, y, dirX, dirY, distance, speed, radius, depth, trail, count]) =>
        TerrainDeformWave(
          x,
          y,
          dirX,
          dirY,
          distance,
          speed,
          radius,
          depth,
          trail,
          count,
        ),
    ),
    constructorCases(
      "TerrainDeformRandom",
      [
        numeric("x", 256),
        numeric("y", 256),
        numeric("radius", 256),
        numeric("minDelta", -16),
        numeric("maxDelta", 16),
        numeric("duration", 1000),
        numeric("updateInterval", 100),
      ],
      ([x, y, radius, minDelta, maxDelta, duration, interval]) =>
        TerrainDeformRandom(
          x,
          y,
          radius,
          minDelta,
          maxDelta,
          duration,
          interval,
        ),
    ),
    constructorCases(
      "AddSpecialEffect",
      [text("modelName", model), numeric("x", 256), numeric("y", 256)],
      ([modelName, x, y]) => AddSpecialEffect(modelName, x, y),
    ),
    constructorCases(
      "AddSpecialEffectLoc",
      [text("modelName", model), location("where")],
      ([modelName, where]) => AddSpecialEffectLoc(modelName, where),
    ),
    constructorCases(
      "AddSpecialEffectTarget",
      [
        text("modelName", model),
        targetWidget,
        text("attachPointName", "origin"),
      ],
      ([modelName, target, attach]) =>
        AddSpecialEffectTarget(modelName, target, attach),
    ),
    // Holy Light, whose target art the effect type names.
    constructorCases(
      "AddSpellEffect",
      [
        text("abilityString", "AHhb"),
        fixed("t", EFFECT_TYPE_TARGET),
        numeric("x", 256),
        numeric("y", 256),
      ],
      ([ability, t, x, y]) => AddSpellEffect(ability, t, x, y),
    ),
    constructorCases(
      "AddSpellEffectLoc",
      [
        text("abilityString", "AHhb"),
        fixed("t", EFFECT_TYPE_TARGET),
        location("where"),
      ],
      ([ability, t, where]) => AddSpellEffectLoc(ability, t, where),
    ),
    constructorCases(
      "AddSpellEffectById",
      [
        rawcode("abilityId", holyLight),
        fixed("t", EFFECT_TYPE_TARGET),
        numeric("x", 256),
        numeric("y", 256),
      ],
      ([abilityId, t, x, y]) => AddSpellEffectById(abilityId, t, x, y),
    ),
    constructorCases(
      "AddSpellEffectByIdLoc",
      [
        rawcode("abilityId", holyLight),
        fixed("t", EFFECT_TYPE_TARGET),
        location("where"),
      ],
      ([abilityId, t, where]) => AddSpellEffectByIdLoc(abilityId, t, where),
    ),
    constructorCases(
      "AddSpellEffectTarget",
      [
        text("modelName", "AHhb"),
        fixed("t", EFFECT_TYPE_TARGET),
        targetWidget,
        text("attachPoint", "origin"),
      ],
      ([modelName, t, target, attach]) =>
        AddSpellEffectTarget(modelName, t, target, attach),
    ),
    constructorCases(
      "AddSpellEffectTargetById",
      [
        rawcode("abilityId", holyLight),
        fixed("t", EFFECT_TYPE_TARGET),
        targetWidget,
        text("attachPoint", "origin"),
      ],
      ([abilityId, t, target, attach]) =>
        AddSpellEffectTargetById(abilityId, t, target, attach),
    ),
    // Chain Lightning's primary bolt; checkVisibility false, so the fog
    // cannot drop it.
    constructorCases(
      "AddLightning",
      [
        text("codeName", "CLPB"),
        fixed("checkVisibility", false),
        numeric("x1", 256),
        numeric("y1", 256),
        numeric("x2", 512),
        numeric("y2", 512),
      ],
      ([codeName, check, x1, y1, x2, y2]) =>
        AddLightning(codeName, check, x1, y1, x2, y2),
    ),
    catalogueCase("AddLightning", "checkVisibility: true", () =>
      AddLightning("CLPB", true, 256, 256, 512, 512),
    ),
    constructorCases(
      "AddLightningEx",
      [
        text("codeName", "CLPB"),
        fixed("checkVisibility", false),
        numeric("x1", 256),
        numeric("y1", 256),
        numeric("z1", 64),
        numeric("x2", 512),
        numeric("y2", 512),
        numeric("z2", 64),
      ],
      ([codeName, check, x1, y1, z1, x2, y2, z2]) =>
        AddLightningEx(codeName, check, x1, y1, z1, x2, y2, z2),
    ),
    catalogueCase("AddLightningEx", "checkVisibility: true", () =>
      AddLightningEx("CLPB", true, 256, 256, 64, 512, 512, 64),
    ),
    // An image type of 1, a selection image, as the library's Image.
    constructorCases(
      "CreateImage",
      [
        text("file", "ReplaceableTextures\\Selection\\SpellAreaOfEffect.blp"),
        numeric("sizeX", 128),
        numeric("sizeY", 128),
        numeric("sizeZ", 128),
        numeric("posX", 256),
        numeric("posY", 256),
        numeric("posZ", 16),
        numeric("originX", 64),
        numeric("originY", 64),
        numeric("originZ", 0),
        numeric("imageType", 1),
      ],
      ([file, sx, sy, sz, px, py, pz, ox, oy, oz, imageType]) =>
        CreateImage(file, sx, sy, sz, px, py, pz, ox, oy, oz, imageType),
    ),
    // The splat of the library's Ubersplat example.
    constructorCases(
      "CreateUbersplat",
      [
        numeric("x", 256),
        numeric("y", 256),
        text("name", "HMED"),
        numeric("red", 255),
        numeric("green", 255),
        numeric("blue", 255),
        numeric("alpha", 255),
        fixed("forcePaused", false),
        fixed("noBirthTime", false),
      ],
      ([x, y, name, red, green, blue, alpha, paused, noBirth]) =>
        CreateUbersplat(x, y, name, red, green, blue, alpha, paused, noBirth),
    ),
    constructorCases(
      "CreateBlightedGoldmine",
      [
        player("id"),
        numeric("x", 256),
        numeric("y", 256),
        numeric("face", 270),
      ],
      ([p, x, y, face]) => CreateBlightedGoldmine(p, x, y, face),
    ),
    constructorCases(
      "BlzCreateItemWithSkin",
      [
        rawcode("itemid", claws),
        numeric("x", 256),
        numeric("y", 256),
        rawcode("skinId", claws),
      ],
      ([itemid, x, y, skinId]) => BlzCreateItemWithSkin(itemid, x, y, skinId),
    ),
    constructorCases(
      "BlzCreateUnitWithSkin",
      [
        player("id"),
        rawcode("unitid", footman),
        numeric("x", 256),
        numeric("y", 256),
        numeric("face", 270),
        rawcode("skinId", footman),
      ],
      ([p, unitid, x, y, face, skinId]) =>
        BlzCreateUnitWithSkin(p, unitid, x, y, face, skinId),
    ),
  );
}

/**
 * The cases not to call, each as `<native> <case>`: a case that crashed the
 * game in an earlier run, named by the pending step `probe:read` printed.
 */
const SKIP: readonly string[] = [
  // Crashed on 3.0.0.24268, runs edd3cf5c-1bcc-450f-933e-dab31799bc3d and
  // f4fca8e0-391b-4e99-8aeb-af80c425acfb (the confirming run).
  "CreateImage imageType: 2147483647",
];

export function run(p: ProbeContext): void {
  runCases(p, sliceCases(), { skip: SKIP });
}
