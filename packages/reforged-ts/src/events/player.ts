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

/** The payload of a player event that carries only its player. */
interface PlayerPayload {
  /** The triggering player. */
  readonly player: MapPlayer;
}

/** The payload of `PlayerEvents.chat`. */
interface ChatPayload extends PlayerPayload {
  /** The whole chat message. */
  readonly message: string;
  /** The text the descriptor was registered with. */
  readonly matched: string;
}

/** The payload of `PlayerEvents.keyDown` and `PlayerEvents.keyUp`. */
interface KeyPayload extends PlayerPayload {
  /** The key pressed or released. */
  readonly key: oskeytype;
  /** The modifier keys held with it, as the registration's `metaKey`. */
  readonly metaKey: number;
  /** Whether the key went down: true for `keyDown`, false for `keyUp`. */
  readonly isDown: boolean;
}

/** The payload of the mouse events. */
interface MousePayload extends PlayerPayload {
  /** The x coordinate of the world point under the mouse. */
  readonly x: number;
  /** The y coordinate of the world point under the mouse. */
  readonly y: number;
}

/** The payload of `PlayerEvents.syncData`. */
interface SyncPayload extends PlayerPayload {
  /** The prefix the data was sent with. */
  readonly prefix: string;
  /** The data sent. */
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
 */
export const PlayerEvents = eventRows("PlayerEvents", {
  /**
   * A player sends a chat message containing `text`, or equal to it when
   * `exactMatch`; `message` is the whole message, `matched` is `text`.
   */
  chat: {
    register: (
      trigger: Trigger,
      player: MapPlayer,
      text: string,
      exactMatch: boolean,
    ) => {
      trigger.registerPlayerChatEvent(player, text, exactMatch);
    },
    read: (event): ChatPayload => ({
      player: triggerPlayer(event),
      message: required(GetEventPlayerChatString(), "message", event),
      matched: required(GetEventPlayerChatStringMatched(), "matched", event),
    }),
  },

  /** A player leaves the game. */
  leave: slotRow(EVENT_PLAYER_LEAVE),

  /** A player presses `key` with the modifiers `metaKey`. */
  keyDown: keyRow(true),

  /** A player releases `key` with the modifiers `metaKey`. */
  keyUp: keyRow(false),

  /** A player presses a mouse button; `x` and `y` are the world point. */
  mouseDown: mouseRow(MouseEventKind.Down),

  /** A player releases a mouse button; `x` and `y` are the world point. */
  mouseUp: mouseRow(MouseEventKind.Up),

  /** A player moves the mouse; `x` and `y` are the world point. */
  mouseMove: mouseRow(MouseEventKind.Move),

  /** A player's synced data with `prefix` arrives at every player. */
  syncData: {
    register: (trigger: Trigger, player: MapPlayer, prefix: string) => {
      trigger.registerPlayerSyncEvent(player, prefix, false);
    },
    read: (event): SyncPayload => ({
      player: triggerPlayer(event),
      prefix: required(BlzGetTriggerSyncPrefix(), "prefix", event),
      data: required(BlzGetTriggerSyncData(), "data", event),
    }),
  },

  /** A player changes its `allianceType` alliance setting toward another. */
  allianceChanged: {
    register: (
      trigger: Trigger,
      player: MapPlayer,
      allianceType: alliancetype,
    ) => {
      trigger.registerPlayerAllianceChange(player, allianceType);
    },
    read: readPlayer,
  },

  /** A player wins the game. */
  victory: slotRow(EVENT_PLAYER_VICTORY),

  /** A player loses the game. */
  defeat: slotRow(EVENT_PLAYER_DEFEAT),
});
