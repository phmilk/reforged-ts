/** @noSelfInFile */

// The player Event descriptors: chat, leave, keyboard, mouse, sync data,
// alliance changes, victory and defeat. A fixed row registers on every player
// slot, on the one Trigger `on()` created; a parameterised row is a function
// of the player (and text, key or prefix) it registers for. Every payload's
// player is the triggering player, read through `MapPlayer.fromEvent()`; the
// scalars are read from the Natives as they are.

import { MapPlayer } from "../handles/player";
import { forEachPlayerSlot } from "../handles/slots";
import type { Trigger } from "../handles/trigger";
import { MouseEventKind } from "../handles/trigger";
import { required } from "./descriptor";
import type { EventRow, FixedRow } from "./rows";
import { eventRows } from "./rows";

/**
 * The payload of a player event that carries only its player
 * (`PlayerEvents.leave`, `allianceChanged`, `victory`, `defeat`), and
 * the base of every player event's payload. The player is always set.
 */
export interface PlayerPayload {
  /** The player the event is about, such as the one who chatted or left. */
  readonly player: MapPlayer;
}

/** The payload of `PlayerEvents.chat`: every field is always set. */
export interface ChatPayload extends PlayerPayload {
  /** The whole chat message. */
  readonly message: string;
  /** The text the descriptor was registered with. */
  readonly matched: string;
}

/**
 * The payload of `PlayerEvents.keyDown` and `PlayerEvents.keyUp`: every
 * field is always set.
 */
export interface KeyPayload extends PlayerPayload {
  /** The key pressed or released. */
  readonly key: oskeytype;
  /** The modifier keys held with it, as the registration's `metaKey`. */
  readonly metaKey: number;
  /** Whether the key went down: true for `keyDown`, false for `keyUp`. */
  readonly isDown: boolean;
}

/**
 * The payload of `PlayerEvents.mouseDown`, `mouseUp` and `mouseMove`:
 * every field is always set.
 */
export interface MousePayload extends PlayerPayload {
  /** The x coordinate of the world point under the mouse, in world units. */
  readonly x: number;
  /** The y coordinate of the world point under the mouse, in world units. */
  readonly y: number;
}

/**
 * The payload of `PlayerEvents.syncData`: every field is always set, the
 * player being the one who sent the data.
 */
export interface SyncPayload extends PlayerPayload {
  /** The prefix the sender passed to `BlzSendSyncData`. */
  readonly prefix: string;
  /** The data the sender's client sent, the same string on every client. */
  readonly data: string;
}

/** The triggering player, guaranteed by the player events. */
function triggerPlayer(event: string): MapPlayer {
  return required(MapPlayer.fromEvent(), "player", event);
}

/** The payload of a player event that carries only its player. */
function readPlayer(event: string): PlayerPayload {
  return { player: triggerPlayer(event) };
}

/** A fixed row that `register`s for every player slot, on one Trigger. */
function everySlot<P>(
  register: (trigger: Trigger, player: MapPlayer) => void,
  read: (event: string) => P,
): FixedRow<P> {
  return {
    register: (trigger) => {
      forEachPlayerSlot((player) => {
        register(trigger, player);
      });
    },
    read,
    fixed: true,
  };
}

/** The row of the player event `event` on every slot. */
function slotRow(event: playerevent): FixedRow<PlayerPayload> {
  return everySlot((trigger, player) => {
    trigger.registerPlayerEvent(player, event);
  }, readPlayer);
}

/** The row of the mouse event `kind` on every slot. */
function mouseRow(kind: MouseEventKind): FixedRow<MousePayload> {
  return everySlot(
    (trigger, player) => {
      trigger.registerPlayerMouseEvent(player, kind);
    },
    (event) => ({
      player: triggerPlayer(event),
      x: BlzGetTriggerPlayerMouseX(),
      y: BlzGetTriggerPlayerMouseY(),
    }),
  );
}

/** The row of a key event, fired when the key goes down or when it goes up. */
function keyRow(
  fireOnKeyDown: boolean,
): EventRow<[player: MapPlayer, key: oskeytype, metaKey: number], KeyPayload> {
  return {
    register: (trigger, player, key, metaKey) => {
      trigger.registerPlayerKeyEvent(player, key, metaKey, fireOnKeyDown);
    },
    read: (event) => ({
      player: triggerPlayer(event),
      key: required(BlzGetTriggerPlayerKey(), "key", event),
      metaKey: BlzGetTriggerPlayerMetaKey(),
      isDown: BlzGetTriggerPlayerIsKeyDown(),
    }),
  };
}

/**
 * The player Event descriptors: `PlayerEvents.leave` for every player slot,
 * `PlayerEvents.chat(player, text, exactMatch)` for one player.
 * @remarks
 * A member that is a descriptor registers for the player in every slot; a
 * member that is a function registers for the player it is given. Every
 * payload holds the triggering player (a {@link PlayerPayload}), and no
 * field of a player event's payload is ever `undefined`.
 * @example Listening for a chat command
 * {@includeCode ../../examples/harness/events-on.ts#subscription}
 * @namespace
 */
export const PlayerEvents = eventRows("PlayerEvents", {
  /**
   * A player sends a chat message containing `text`, or equal to it when
   * `exactMatch`; `message` is the whole message, `matched` is `text`.
   * The payload is a {@link ChatPayload}.
   * @example A chat command with an argument
   * {@includeCode ../../examples/harness/player-events.ts#chat}
   * @native TriggerRegisterPlayerChatEvent
   */
  chat: {
    /** Registers the chat messages of `player` matching `text` on the Trigger. */
    register: (
      trigger: Trigger,
      player: MapPlayer,
      text: string,
      exactMatch: boolean,
    ) => {
      trigger.registerPlayerChatEvent(player, text, exactMatch);
    },
    /** Reads the player, the whole message and the matched text. */
    read: (event): ChatPayload => ({
      player: triggerPlayer(event),
      message: required(GetEventPlayerChatString(), "message", event),
      matched: required(GetEventPlayerChatStringMatched(), "matched", event),
    }),
  },

  /**
   * A player leaves the game.
   * @example Announcing how players leave the game
   * {@includeCode ../../examples/harness/player-events.ts#outcome}
   * @native TriggerRegisterPlayerEvent
   */
  leave: slotRow(EVENT_PLAYER_LEAVE),

  /**
   * A player presses `key` with the modifiers `metaKey`, and again
   * repeatedly while holding it. The payload is a {@link KeyPayload}.
   * @example Sprinting while a key is held
   * {@includeCode ../../examples/harness/player-events.ts#keys}
   * @native BlzTriggerRegisterPlayerKeyEvent
   */
  keyDown: keyRow(true),

  /**
   * A player releases `key` with the modifiers `metaKey`. The payload is a
   * {@link KeyPayload}.
   * @example Sprinting while a key is held
   * {@includeCode ../../examples/harness/player-events.ts#keys}
   * @native BlzTriggerRegisterPlayerKeyEvent
   */
  keyUp: keyRow(false),

  /**
   * A player presses a mouse button; `x` and `y` are the world point. The payload is a
   * {@link MousePayload}.
   * @example Following mouse drags
   * {@includeCode ../../examples/harness/player-events.ts#mouse}
   * @native TriggerRegisterPlayerEvent
   */
  mouseDown: mouseRow(MouseEventKind.Down),

  /**
   * A player releases a mouse button; `x` and `y` are the world point. The payload is a
   * {@link MousePayload}.
   * @example Following mouse drags
   * {@includeCode ../../examples/harness/player-events.ts#mouse}
   * @native TriggerRegisterPlayerEvent
   */
  mouseUp: mouseRow(MouseEventKind.Up),

  /**
   * A player moves the mouse; `x` and `y` are the world point. The payload is a
   * {@link MousePayload}.
   * @example Following mouse drags
   * {@includeCode ../../examples/harness/player-events.ts#mouse}
   * @native TriggerRegisterPlayerEvent
   */
  mouseMove: mouseRow(MouseEventKind.Move),

  /**
   * A player's synced data with `prefix` arrives at every player. The
   * payload is a {@link SyncPayload}.
   * @example Sending one player's pick to every client
   * {@includeCode ../../examples/harness/player-events.ts#sync}
   * @native BlzTriggerRegisterPlayerSyncEvent
   */
  syncData: {
    /** Registers the data `player` sends with `prefix` on the Trigger. */
    register: (trigger: Trigger, player: MapPlayer, prefix: string) => {
      trigger.registerPlayerSyncEvent(player, prefix, false);
    },
    /** Reads the sending player, the prefix and the data. */
    read: (event): SyncPayload => ({
      player: triggerPlayer(event),
      prefix: required(BlzGetTriggerSyncPrefix(), "prefix", event),
      data: required(BlzGetTriggerSyncData(), "data", event),
    }),
  },

  /**
   * A player changes its `allianceType` alliance setting toward another.
   * The payload holds the player whose setting changed.
   * @example Watching a player's alliances
   * {@includeCode ../../examples/harness/player-events.ts#alliance}
   * @native TriggerRegisterPlayerAllianceChange
   */
  allianceChanged: {
    /** Registers the changes of `player`'s `allianceType` on the Trigger. */
    register: (
      trigger: Trigger,
      player: MapPlayer,
      allianceType: alliancetype,
    ) => {
      trigger.registerPlayerAllianceChange(player, allianceType);
    },
    /** Reads the player whose setting changed. */
    read: readPlayer,
  },

  /**
   * A player wins the game.
   * @example Announcing how players leave the game
   * {@includeCode ../../examples/harness/player-events.ts#outcome}
   * @native TriggerRegisterPlayerEvent
   */
  victory: slotRow(EVENT_PLAYER_VICTORY),

  /**
   * A player loses the game.
   * @example Announcing how players leave the game
   * {@includeCode ../../examples/harness/player-events.ts#outcome}
   * @native TriggerRegisterPlayerEvent
   */
  defeat: slotRow(EVENT_PLAYER_DEFEAT),
});
