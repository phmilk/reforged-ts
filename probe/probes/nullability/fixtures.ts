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

/** A unit, live: a `'hfoo'` of Neutral Passive at the map's origin (`CreateUnit`). */
export function neutralPassiveUnit(): unit {
  const owner = built(Player(PLAYER_NEUTRAL_PASSIVE), "neutralPassiveUnit");
  return built(
    CreateUnit(owner, FourCC("hfoo"), 0, 0, 0),
    "neutralPassiveUnit",
  );
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

// Items

/** An item, live: a `'ratf'` (Claws of Attack) on the ground at the map's origin (`CreateItem`). */
export function liveItem(): item {
  return built(CreateItem(FourCC("ratf"), 0, 0), "liveItem");
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

/** A frame, top-level: the world frame, `BlzGetOriginFrame(ORIGIN_FRAME_WORLD_FRAME, 0)`. */
export function worldFrame(): framehandle {
  return built(BlzGetOriginFrame(ORIGIN_FRAME_WORLD_FRAME, 0), "worldFrame");
}

/** A frame, live child: a `"FRAME"` made with `BlzCreateFrameByType` on the game UI, inheriting nothing. */
export function childFrame(): framehandle {
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

/** A camera setup, positioned: a fresh setup after `CameraSetupSetDestPosition` to `(512, 512)`. */
export function positionedCameraSetup(): camerasetup {
  const setup = freshCameraSetup();
  CameraSetupSetDestPosition(setup, 512, 512, 0);
  return setup;
}
