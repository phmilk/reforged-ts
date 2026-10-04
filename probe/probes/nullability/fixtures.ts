// The Nullability sweep's Fixtures, shared by every Slice: one factory per
// handle type and state, each returning a new Handle in that state. A
// factory calls Natives only, never the library, so building an argument
// never goes through a Wrapper. A Probe builds its Fixtures before the
// cases that use them, outside their calls, so a factory that fails fails
// the run instead of reading as the Native's outcome. The catalogue grows
// per type and state with the Slices.
//
// A stale handle is one whose object is dead, removed or destroyed: the
// factories named `dead…`, `removed…` and `destroyed…` return one.

import { CONVERTER_CONSTANTS } from "./converter-constants";

/** `value`, or an error naming the Fixture when a Native returned nothing for it. */
function built<T>(value: T | undefined, fixture: string): T {
  if (value === undefined) {
    error(`Fixture ${fixture}: the Native returned nothing`, 0);
  }
  return value;
}

// Players: a player is never stale.

/** A player, a user slot: `Player(0)`, the slot the Probe run plays. */
export function userSlotPlayer(): player {
  return built(Player(0), "userSlotPlayer");
}

/**
 * A player, an empty slot: the last slot, `Player(GetBJMaxPlayers() - 1)`,
 * which the Probe's map leaves empty; the Fixture fails when it is not.
 */
export function emptySlotPlayer(): player {
  const last = built(Player(GetBJMaxPlayers() - 1), "emptySlotPlayer");
  if (GetPlayerSlotState(last) !== PLAYER_SLOT_STATE_EMPTY) {
    error("Fixture emptySlotPlayer: the last slot is not empty", 0);
  }
  return last;
}

/** A player, neutral: Neutral Passive, `Player(PLAYER_NEUTRAL_PASSIVE)`. */
export function neutralPassivePlayer(): player {
  return built(Player(PLAYER_NEUTRAL_PASSIVE), "neutralPassivePlayer");
}

// Units

/** A unit, live: a `'hfoo'` of `Player(0)` at the map's origin (`CreateUnit`). */
export function liveUnit(): unit {
  const owner = built(Player(0), "liveUnit");
  return built(CreateUnit(owner, FourCC("hfoo"), 0, 0, 0), "liveUnit");
}

/** A unit, dead: a live `'hfoo'` of `Player(0)` after `KillUnit`, its corpse still in the game. */
export function deadUnit(): unit {
  const footman = liveUnit();
  KillUnit(footman);
  return footman;
}

/** A unit, removed: a live `'hfoo'` of `Player(0)` after `RemoveUnit`, a stale handle. */
export function removedUnit(): unit {
  const footman = liveUnit();
  RemoveUnit(footman);
  return footman;
}

/**
 * A unit, live: a `'Hpal'` hero of `Player(0)` at the map's origin
 * (`CreateUnit`), its inventory empty.
 */
export function liveHero(): unit {
  const owner = built(Player(0), "liveHero");
  return built(CreateUnit(owner, FourCC("Hpal"), 0, 0, 0), "liveHero");
}

/** A unit, dead: a live `'Hpal'` hero of `Player(0)` after `KillUnit`, its corpse still in the game. */
export function deadHero(): unit {
  const paladin = liveHero();
  KillUnit(paladin);
  return paladin;
}

/** A unit, removed: a live `'Hpal'` hero of `Player(0)` after `RemoveUnit`, a stale handle. */
export function removedHero(): unit {
  const paladin = liveHero();
  RemoveUnit(paladin);
  return paladin;
}

// Unit pools

/** A unit pool, live: `CreateUnitPool` holding the `'hfoo'` unit type at weight 1. */
export function liveUnitPool(): unitpool {
  const pool = built(CreateUnitPool(), "liveUnitPool");
  UnitPoolAddUnitType(pool, FourCC("hfoo"), 1);
  return pool;
}

/** A unit pool, empty: `CreateUnitPool`, no unit type added. */
export function emptyUnitPool(): unitpool {
  return built(CreateUnitPool(), "emptyUnitPool");
}

/** A unit pool, destroyed: a live unit pool after `DestroyUnitPool`, a stale handle. */
export function destroyedUnitPool(): unitpool {
  const pool = liveUnitPool();
  DestroyUnitPool(pool);
  return pool;
}

// Items

/** An item, live: a `'ratf'` (Claws of Attack) on the ground at the map's origin (`CreateItem`). */
export function liveItem(): item {
  return built(CreateItem(FourCC("ratf"), 0, 0), "liveItem");
}

/**
 * An item, dead: a live `'ratf'` after `SetWidgetLife` to 0; the Fixture
 * fails when the item's life is still above 0.
 */
export function deadItem(): item {
  const claws = liveItem();
  SetWidgetLife(claws, 0);
  if (GetWidgetLife(claws) > 0) {
    error("Fixture deadItem: the item's life is still above 0", 0);
  }
  return claws;
}

/** An item, removed: a live `'ratf'` after `RemoveItem`, a stale handle. */
export function removedItem(): item {
  const claws = liveItem();
  RemoveItem(claws);
  return claws;
}

// Item pools

/** An item pool, live: `CreateItemPool` holding the `'ratf'` item type at weight 1. */
export function liveItemPool(): itempool {
  const pool = built(CreateItemPool(), "liveItemPool");
  ItemPoolAddItemType(pool, FourCC("ratf"), 1);
  return pool;
}

/** An item pool, empty: `CreateItemPool`, no item type added. */
export function emptyItemPool(): itempool {
  return built(CreateItemPool(), "emptyItemPool");
}

/** An item pool, destroyed: a live item pool after `DestroyItemPool`, a stale handle. */
export function destroyedItemPool(): itempool {
  const pool = liveItemPool();
  DestroyItemPool(pool);
  return pool;
}

// Destructables

/**
 * A destructable, live: a `'LTlt'` (a Lordaeron tree) at (-512, -512),
 * facing 0, scale 1, variation 0 (`CreateDestructable`).
 */
export function liveDestructable(): destructable {
  return built(
    CreateDestructable(FourCC("LTlt"), -512, -512, 0, 1, 0),
    "liveDestructable",
  );
}

/** A destructable, dead: a live `'LTlt'` after `KillDestructable`, still in the game. */
export function deadDestructable(): destructable {
  const tree = liveDestructable();
  KillDestructable(tree);
  return tree;
}

/** A destructable, removed: a live `'LTlt'` after `RemoveDestructable`, a stale handle. */
export function removedDestructable(): destructable {
  const tree = liveDestructable();
  RemoveDestructable(tree);
  return tree;
}

// Timers

/** A timer, live: `CreateTimer`, never started. */
export function liveTimer(): timer {
  return CreateTimer();
}

/** A timer, destroyed: a live timer after `DestroyTimer`, a stale handle. */
export function destroyedTimer(): timer {
  const timer = liveTimer();
  DestroyTimer(timer);
  return timer;
}

// Locations and rects

/** A location, live: `Location(x, y)`, the map's origin by default. */
export function liveLocation(x = 0, y = 0): location {
  return Location(x, y);
}

/** A location, removed: a live location at the origin after `RemoveLocation`, a stale handle. */
export function removedLocation(): location {
  const location = liveLocation();
  RemoveLocation(location);
  return location;
}

/** A rect, live: `Rect(-256, -256, 256, 256)`, centred on the map's origin. */
export function liveRect(): rect {
  return Rect(-256, -256, 256, 256);
}

/** A rect, removed: a live rect after `RemoveRect`, a stale handle. */
export function removedRect(): rect {
  const rect = liveRect();
  RemoveRect(rect);
  return rect;
}

// Groups

/** A group, empty: `CreateGroup`, no unit added. */
export function emptyGroup(): group {
  return built(CreateGroup(), "emptyGroup");
}

// Hashtables and game caches

/** A hashtable, empty: `InitHashtable`, nothing saved. */
export function emptyHashtable(): hashtable {
  return built(InitHashtable(), "emptyHashtable");
}

/** A game cache, empty: `InitGameCache` of a file never saved, nothing stored. */
export function emptyGameCache(): gamecache {
  return built(InitGameCache("NullabilityFixture.w3v"), "emptyGameCache");
}

// Multiboards

/**
 * A multiboard, one cell: `CreateMultiboard` after `MultiboardSetRowCount`
 * and `MultiboardSetColumnCount` to 1, so its only cell is (0, 0).
 */
export function oneCellMultiboard(): multiboard {
  const board = built(CreateMultiboard(), "oneCellMultiboard");
  MultiboardSetRowCount(board, 1);
  MultiboardSetColumnCount(board, 1);
  return board;
}

// Dialogs

/** A dialog, live: `DialogCreate`, never shown. */
export function liveDialog(): dialog {
  return built(DialogCreate(), "liveDialog");
}

/** A dialog, destroyed: a live dialog after `DialogDestroy`, a stale handle. */
export function destroyedDialog(): dialog {
  const dialog = liveDialog();
  DialogDestroy(dialog);
  return dialog;
}

// Quests

/** A quest, live: `CreateQuest`, nothing set. */
export function liveQuest(): quest {
  return built(CreateQuest(), "liveQuest");
}

/**
 * A quest after `DestroyQuest`: a live quest destroyed, whose stale state
 * is not known, so the Fixture is named after the action and does not claim
 * the handle is stale (#371).
 */
export function questAfterDestroyQuest(): quest {
  const quest = liveQuest();
  DestroyQuest(quest);
  return quest;
}

// Boolexprs

/**
 * A boolexpr, live: a `Condition` of a function that returns `true`, a new
 * one each call, so no two Fixtures share their function.
 */
export function liveCondition(): conditionfunc {
  return Condition(() => true);
}

/** A boolexpr, live: a `Filter` of a new function that returns `true`, as `liveCondition`. */
export function liveFilter(): filterfunc {
  return Filter(() => true);
}

/** A boolexpr, destroyed: a live `Condition` after `DestroyCondition`, a stale handle. */
export function destroyedCondition(): conditionfunc {
  const condition = liveCondition();
  DestroyCondition(condition);
  return condition;
}

/** A boolexpr, destroyed: a live `Filter` after `DestroyFilter`, a stale handle. */
export function destroyedFilter(): filterfunc {
  const filter = liveFilter();
  DestroyFilter(filter);
  return filter;
}

/** A boolexpr, destroyed: a live `Filter` after `DestroyBoolExpr`, a stale handle. */
export function destroyedBoolExpr(): boolexpr {
  const filter = liveFilter();
  DestroyBoolExpr(filter);
  return filter;
}

// Frames

/** A frame, top-level: the game UI, `BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0)`. */
export function gameUiFrame(): framehandle {
  return built(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "gameUiFrame");
}

/**
 * A frame, top-level simple frame: the console, `BlzGetFrameByName("ConsoleUI", 0)`,
 * which a simple frame takes as its owner.
 */
export function consoleUiFrame(): framehandle {
  return built(BlzGetFrameByName("ConsoleUI", 0), "consoleUiFrame");
}

/**
 * A frame, top: the game UI's parent, `BlzFrameGetParent` of the game UI
 * frame, the highest frame the sweep has reached (a handle in the retired
 * `nullability-slice-1`); the Fixture fails when the game UI has no parent.
 */
export function gameUiParentFrame(): framehandle {
  return built(BlzFrameGetParent(gameUiFrame()), "gameUiParentFrame");
}

/** A frame, live child: a `"FRAME"` made with `BlzCreateFrameByType` on the game UI, inheriting nothing. */
function childFrame(): framehandle {
  return built(
    BlzCreateFrameByType("FRAME", "NullabilityFixture", gameUiFrame(), "", 0),
    "childFrame",
  );
}

/** A frame, destroyed: a live child frame after `BlzDestroyFrame`, a stale handle. */
export function destroyedFrame(): framehandle {
  const frame = childFrame();
  BlzDestroyFrame(frame);
  return frame;
}

/**
 * A simple frame, destroyed: a `"SimpleInfoPanelIconDamage"`, a default
 * template, made with `BlzCreateSimpleFrame` on the console, after
 * `BlzDestroyFrame`, a stale handle.
 */
export function destroyedSimpleFrame(): framehandle {
  const frame = built(
    BlzCreateSimpleFrame("SimpleInfoPanelIconDamage", consoleUiFrame(), 0),
    "destroyedSimpleFrame",
  );
  BlzDestroyFrame(frame);
  return frame;
}

// Origin frame types: a converted integer, never stale.

/**
 * An origin frame type, out of range: `ConvertOriginFrameType` of the first
 * integer past the Patch's greatest `originframetype` constant
 * (`ORIGIN_FRAME_UNIT_PANEL_BUFF_BAR_LABEL`, 22, on 3.0.0.24268), so a Patch
 * that adds an origin frame keeps it out of range.
 */
export function outOfRangeOriginFrameType(): originframetype {
  const greatest = CONVERTER_CONSTANTS.ConvertOriginFrameType.reduce(
    (greatest, [, value]) => (value > greatest ? value : greatest),
    0,
  );
  return built(
    ConvertOriginFrameType(greatest + 1),
    "outOfRangeOriginFrameType",
  );
}

// Triggers

/** A trigger, live: `CreateTrigger`. */
export function liveTrigger(): trigger {
  return CreateTrigger();
}

/** A trigger, destroyed: a live trigger after `DestroyTrigger`, a stale handle. */
export function destroyedTrigger(): trigger {
  const live = liveTrigger();
  DestroyTrigger(live);
  return live;
}

// Camera setups: no Native destroys one, so none is stale.

/** A camera setup, fresh: `CreateCameraSetup`, nothing set. */
export function freshCameraSetup(): camerasetup {
  return CreateCameraSetup();
}
