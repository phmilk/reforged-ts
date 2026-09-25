/** @noSelfInFile */

// PlayerEvents through on(): the suites of support/events.ts, which fire the
// Subscription's Trigger with a stubbed context and observe the call log and
// what the handler received. The fixed rows register on every player slot;
// the parameterised rows register the player, text, key or prefix they were
// given.

import { MapPlayer, PlayerEvents } from "../../src/index";
import { defined } from "../support/defined";
import { describeDescriptor, everySlot } from "../support/events";
import { handleRef } from "../support/handle-ref";

const player = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const playerRef = handleRef("player", player.handle);
const typing = defined(MapPlayer.fromIndex(3), "the player in slot 3");

const slotEvents = [
  ["leave", "EVENT_PLAYER_LEAVE"],
  ["victory", "EVENT_PLAYER_VICTORY"],
  ["defeat", "EVENT_PLAYER_DEFEAT"],
] as const;

for (const [name, event] of slotEvents) {
  describeDescriptor({
    name: `PlayerEvents.${name}`,
    descriptor: PlayerEvents[name],
    registers: (trigger) =>
      everySlot(
        (slot) => `TriggerRegisterPlayerEvent(${trigger}, ${slot}, ${event})`,
      ),
    context: { GetTriggerPlayer: typing.handle },
    payload: { player: typing },
    required: [["player", "GetTriggerPlayer"]],
  });
}

const mouseEvents = [
  ["mouseDown", "EVENT_PLAYER_MOUSE_DOWN"],
  ["mouseUp", "EVENT_PLAYER_MOUSE_UP"],
  ["mouseMove", "EVENT_PLAYER_MOUSE_MOVE"],
] as const;

for (const [name, event] of mouseEvents) {
  describeDescriptor({
    name: `PlayerEvents.${name}`,
    descriptor: PlayerEvents[name],
    registers: (trigger) =>
      everySlot(
        (slot) => `TriggerRegisterPlayerEvent(${trigger}, ${slot}, ${event})`,
      ),
    context: {
      GetTriggerPlayer: typing.handle,
      BlzGetTriggerPlayerMouseX: 128.5,
      BlzGetTriggerPlayerMouseY: -64,
    },
    payload: { player: typing, x: 128.5, y: -64 },
    required: [["player", "GetTriggerPlayer"]],
  });
}

describeDescriptor({
  name: "PlayerEvents.chat",
  descriptor: PlayerEvents.chat(player, "-go", true),
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
});

describeDescriptor({
  name: "PlayerEvents.chat",
  title: "PlayerEvents.chat, not an exact match",
  descriptor: PlayerEvents.chat(player, "gg", false),
  registers: (trigger) => [
    `TriggerRegisterPlayerChatEvent(${trigger}, ${playerRef}, "gg", false)`,
  ],
  context: {
    GetTriggerPlayer: player.handle,
    GetEventPlayerChatString: "gg wp",
    GetEventPlayerChatStringMatched: "gg",
  },
  payload: { player, message: "gg wp", matched: "gg" },
});

const keyEvents = [
  ["keyDown", true],
  ["keyUp", false],
] as const;

for (const [name, down] of keyEvents) {
  describeDescriptor({
    name: `PlayerEvents.${name}`,
    descriptor: PlayerEvents[name](player, OSKEY_A, 2),
    registers: (trigger) => [
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
    ],
  });
}

describeDescriptor({
  name: "PlayerEvents.syncData",
  descriptor: PlayerEvents.syncData(player, "save"),
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
});

describeDescriptor({
  name: "PlayerEvents.allianceChanged",
  descriptor: PlayerEvents.allianceChanged(player, ALLIANCE_SHARED_VISION),
  registers: (trigger) => [
    `TriggerRegisterPlayerAllianceChange(${trigger}, ${playerRef}, ALLIANCE_SHARED_VISION)`,
  ],
  context: { GetTriggerPlayer: player.handle },
  payload: { player },
  required: [["player", "GetTriggerPlayer"]],
});
