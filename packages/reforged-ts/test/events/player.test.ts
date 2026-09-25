/** @noSelfInFile */

// PlayerEvents through on(): the suites of support/events.ts, iterating the
// namespace's members, which fire the Subscription's Trigger with a stubbed
// context and observe the call log and what the handler received. The fixed
// rows register on every player slot; the parameterised rows register the
// player, text, key or prefix they were given.

import { MapPlayer, PlayerEvents } from "../../src/index";
import { defined } from "../support/defined";
import { describeNamespace, everySlot } from "../support/events";
import { handleRef } from "../support/handle-ref";

const player = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const playerRef = handleRef("player", player.handle);
const typing = defined(MapPlayer.fromIndex(3), "the player in slot 3");

/** The case of a row registering the player event `event` on every slot. */
function slotCase(event: string) {
  return {
    registers: (trigger: string) =>
      everySlot(
        (slot) => `TriggerRegisterPlayerEvent(${trigger}, ${slot}, ${event})`,
      ),
    context: { GetTriggerPlayer: typing.handle },
    payload: { player: typing },
    required: [["player", "GetTriggerPlayer"]] as const,
  };
}

/** The case of a mouse row, registering `event` on every slot. */
function mouseCase(event: string) {
  return {
    registers: (trigger: string) =>
      everySlot(
        (slot) => `TriggerRegisterPlayerEvent(${trigger}, ${slot}, ${event})`,
      ),
    context: {
      GetTriggerPlayer: typing.handle,
      BlzGetTriggerPlayerMouseX: 128.5,
      BlzGetTriggerPlayerMouseY: -64,
    },
    payload: { player: typing, x: 128.5, y: -64 },
    required: [["player", "GetTriggerPlayer"]] as const,
  };
}

/** The case of a key row, fired when the key goes down when `down`. */
function keyCase(down: boolean) {
  return {
    args: [player, OSKEY_A, 2] as const,
    registers: (trigger: string) => [
      `BlzTriggerRegisterPlayerKeyEvent(${trigger}, ${playerRef}, OSKEY_A, 2, ${tostring(down)})`,
    ],
    context: {
      GetTriggerPlayer: player.handle,
      BlzGetTriggerPlayerKey: OSKEY_A,
      BlzGetTriggerPlayerMetaKey: 2,
      BlzGetTriggerPlayerIsKeyDown: down,
    },
    payload: { player, key: OSKEY_A, metaKey: 2, isDown: down },
    required: [
      ["player", "GetTriggerPlayer"],
      ["key", "BlzGetTriggerPlayerKey"],
    ] as const,
  };
}

describeNamespace("PlayerEvents", PlayerEvents, {
  chat: [
    {
      args: [player, "-go", true],
      registers: (trigger) => [
        `TriggerRegisterPlayerChatEvent(${trigger}, ${playerRef}, "-go", true)`,
      ],
      context: {
        GetTriggerPlayer: player.handle,
        GetEventPlayerChatString: "-go",
        GetEventPlayerChatStringMatched: "-go",
      },
      payload: { player, message: "-go", matched: "-go" },
      required: [
        ["player", "GetTriggerPlayer"],
        ["message", "GetEventPlayerChatString"],
        ["matched", "GetEventPlayerChatStringMatched"],
      ],
    },
    {
      title: "PlayerEvents.chat, not an exact match",
      args: [player, "gg", false],
      registers: (trigger) => [
        `TriggerRegisterPlayerChatEvent(${trigger}, ${playerRef}, "gg", false)`,
      ],
      context: {
        GetTriggerPlayer: player.handle,
        GetEventPlayerChatString: "gg wp",
        GetEventPlayerChatStringMatched: "gg",
      },
      payload: { player, message: "gg wp", matched: "gg" },
    },
  ],
  leave: [slotCase("EVENT_PLAYER_LEAVE")],
  keyDown: [keyCase(true)],
  keyUp: [keyCase(false)],
  mouseDown: [mouseCase("EVENT_PLAYER_MOUSE_DOWN")],
  mouseUp: [mouseCase("EVENT_PLAYER_MOUSE_UP")],
  mouseMove: [mouseCase("EVENT_PLAYER_MOUSE_MOVE")],
  syncData: [
    {
      args: [player, "save"],
      registers: (trigger) => [
        `BlzTriggerRegisterPlayerSyncEvent(${trigger}, ${playerRef}, "save", false)`,
      ],
      context: {
        GetTriggerPlayer: player.handle,
        BlzGetTriggerSyncPrefix: "save",
        BlzGetTriggerSyncData: "level=3",
      },
      payload: { player, prefix: "save", data: "level=3" },
      required: [
        ["player", "GetTriggerPlayer"],
        ["prefix", "BlzGetTriggerSyncPrefix"],
        ["data", "BlzGetTriggerSyncData"],
      ],
    },
  ],
  allianceChanged: [
    {
      args: [player, ALLIANCE_SHARED_VISION],
      registers: (trigger) => [
        `TriggerRegisterPlayerAllianceChange(${trigger}, ${playerRef}, ALLIANCE_SHARED_VISION)`,
      ],
      context: { GetTriggerPlayer: player.handle },
      payload: { player },
      required: [["player", "GetTriggerPlayer"]],
    },
  ],
  victory: [slotCase("EVENT_PLAYER_VICTORY")],
  defeat: [slotCase("EVENT_PLAYER_DEFEAT")],
});
