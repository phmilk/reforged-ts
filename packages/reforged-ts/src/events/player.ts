/** @noSelfInFile */

// The player Event descriptors: chat, leave, keyboard, mouse, sync data,
// alliance changes, victory and defeat. A fixed row registers on every player
// slot, on the one Trigger `on()` created; a parameterised row is a function
// of the player (and text, key or prefix) it registers for. Every payload's
// player is the triggering player, read through `MapPlayer.fromEvent()`; the
// scalars are read from the Natives as they are.

import { MapPlayer } from "../handles/player";
import type { Trigger } from "../handles/trigger";
import { MouseEventKind } from "../handles/trigger";
import type { EventDescriptor } from "./descriptor";
import { required } from "./descriptor";

/** The payload of a player event that carries only its player. */
interface PlayerPayload {
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
  readonly key: oskeytype;
  readonly metaKey: number;
  readonly isDown: boolean;
}

/** The payload of the mouse events. */
interface MousePayload extends PlayerPayload {
  readonly x: number;
  readonly y: number;
}

/** The payload of `PlayerEvents.syncData`. */
interface SyncPayload extends PlayerPayload {
  readonly prefix: string;
  readonly data: string;
}

/** The triggering player, guaranteed by the player events. */
function triggerPlayer(event: string): MapPlayer {
  return required(MapPlayer.fromEvent(), "player", event);
}

/** Registers `register` for every player slot, on one Trigger. */
function everySlot(register: (trigger: Trigger, player: MapPlayer) => void) {
  return (trigger: Trigger) => {
    for (let index = 0; index < bj_MAX_PLAYER_SLOTS; index++) {
      const player = MapPlayer.fromIndex(index);
      if (player !== undefined) {
        register(trigger, player);
      }
    }
  };
}

/** The descriptor of the player event `event` on every slot. */
function slotEvent(
  name: string,
  event: playerevent,
): EventDescriptor<PlayerPayload> {
  const described = `PlayerEvents.${name}`;
  return {
    register: everySlot((trigger, player) => {
      trigger.registerPlayerEvent(player, event);
    }),
    read: () => ({ player: triggerPlayer(described) }),
  };
}

/** The descriptor of the mouse event `kind` on every slot. */
function mouse(
  name: string,
  kind: MouseEventKind,
): EventDescriptor<MousePayload> {
  const described = `PlayerEvents.${name}`;
  return {
    register: everySlot((trigger, player) => {
      trigger.registerPlayerMouseEvent(player, kind);
    }),
    read: () => ({
      player: triggerPlayer(described),
      x: BlzGetTriggerPlayerMouseX(),
      y: BlzGetTriggerPlayerMouseY(),
    }),
  };
}

/** The descriptor of `key` with `metaKey` for `player`, down or up. */
function keyEvent(
  name: string,
  player: MapPlayer,
  key: oskeytype,
  metaKey: number,
  fireOnKeyDown: boolean,
): EventDescriptor<KeyPayload> {
  const described = `PlayerEvents.${name}`;
  return {
    register: (trigger) => {
      trigger.registerPlayerKeyEvent(player, key, metaKey, fireOnKeyDown);
    },
    read: () => ({
      player: triggerPlayer(described),
      key: required(BlzGetTriggerPlayerKey(), "key", described),
      metaKey: BlzGetTriggerPlayerMetaKey(),
      isDown: BlzGetTriggerPlayerIsKeyDown(),
    }),
  };
}

/**
 * The player Event descriptors: `PlayerEvents.leave` for every player slot,
 * `PlayerEvents.chat(player, text, exactMatch)` for one player.
 */
export const PlayerEvents = {
  /**
   * A player sends a chat message containing `text`, or equal to it when
   * `exactMatch`; `message` is the whole message, `matched` is `text`.
   */
  chat: (
    player: MapPlayer,
    text: string,
    exactMatch: boolean,
  ): EventDescriptor<ChatPayload> => ({
    register: (trigger) => {
      trigger.registerPlayerChatEvent(player, text, exactMatch);
    },
    read: () => ({
      player: triggerPlayer("PlayerEvents.chat"),
      message: required(
        GetEventPlayerChatString(),
        "message",
        "PlayerEvents.chat",
      ),
      matched: required(
        GetEventPlayerChatStringMatched(),
        "matched",
        "PlayerEvents.chat",
      ),
    }),
  }),

  /** A player leaves the game. */
  leave: slotEvent("leave", EVENT_PLAYER_LEAVE),

  /** A player presses `key` with the modifiers `metaKey`. */
  keyDown: (
    player: MapPlayer,
    key: oskeytype,
    metaKey: number,
  ): EventDescriptor<KeyPayload> =>
    keyEvent("keyDown", player, key, metaKey, true),

  /** A player releases `key` with the modifiers `metaKey`. */
  keyUp: (
    player: MapPlayer,
    key: oskeytype,
    metaKey: number,
  ): EventDescriptor<KeyPayload> =>
    keyEvent("keyUp", player, key, metaKey, false),

  /** A player presses a mouse button; `x` and `y` are the world point. */
  mouseDown: mouse("mouseDown", MouseEventKind.Down),

  /** A player releases a mouse button; `x` and `y` are the world point. */
  mouseUp: mouse("mouseUp", MouseEventKind.Up),

  /** A player moves the mouse; `x` and `y` are the world point. */
  mouseMove: mouse("mouseMove", MouseEventKind.Move),

  /** A player's synced data with `prefix` arrives at every player. */
  syncData: (
    player: MapPlayer,
    prefix: string,
  ): EventDescriptor<SyncPayload> => ({
    register: (trigger) => {
      trigger.registerPlayerSyncEvent(player, prefix, false);
    },
    read: () => ({
      player: triggerPlayer("PlayerEvents.syncData"),
      prefix: required(
        BlzGetTriggerSyncPrefix(),
        "prefix",
        "PlayerEvents.syncData",
      ),
      data: required(BlzGetTriggerSyncData(), "data", "PlayerEvents.syncData"),
    }),
  }),

  /** A player changes its `allianceType` alliance setting toward another. */
  allianceChanged: (
    player: MapPlayer,
    allianceType: alliancetype,
  ): EventDescriptor<PlayerPayload> => ({
    register: (trigger) => {
      trigger.registerPlayerAllianceChange(player, allianceType);
    },
    read: () => ({ player: triggerPlayer("PlayerEvents.allianceChanged") }),
  }),

  /** A player wins the game. */
  victory: slotEvent("victory", EVENT_PLAYER_VICTORY),

  /** A player loses the game. */
  defeat: slotEvent("defeat", EVENT_PLAYER_DEFEAT),
};
