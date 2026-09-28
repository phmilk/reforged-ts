// The PlayerEvents descriptors through on(). A member that is a descriptor,
// such as `PlayerEvents.leave`, registers for the player in every slot; a
// member that is a function, such as `PlayerEvents.chat(player, text,
// exactMatch)`, registers for the player it is given. Every payload holds
// the triggering player and no field is ever undefined. on() returns the
// Subscription whose destroy() ends the handler.
import {
  Init,
  MapPlayer,
  MetaKey,
  on,
  PlayerEvents,
  tsGlobals,
  Unit,
} from "reforged-ts";
import type { KeyPayload, Subscription } from "reforged-ts";

// #region chat
/**
 * A "-kick <name>" command for `host`: `message` is the whole line typed,
 * `matched` the text the descriptor was registered with.
 */
export function kickCommand(host: MapPlayer): Subscription {
  return on(
    PlayerEvents.chat(host, "-kick ", false),
    ({ message, matched }) => {
      const name = message.substring(matched.length);
      for (const player of tsGlobals.Players) {
        if (player.name === name && player !== host) {
          player.remove(PLAYER_GAME_RESULT_DEFEAT);
        }
      }
    },
  );
}
// #endregion chat

// #region outcome
/** Tells everyone when a player leaves, wins or loses. */
export function announceOutcomes(): Subscription[] {
  return [
    on(PlayerEvents.leave, ({ player }) => {
      print(`${player.name} left the game`);
    }),
    on(PlayerEvents.victory, ({ player }) => {
      print(`${player.name} won`);
    }),
    on(PlayerEvents.defeat, ({ player }) => {
      print(`${player.name} was defeated`);
    }),
  ];
}
// #endregion outcome

// #region keys
/**
 * Makes `hero` sprint while `player` holds Shift+Space. `keyDown` fires
 * again and again while the key is held and `keyUp` once on release; the
 * payload holds the `key`, the `metaKey` modifiers and `isDown`. The key
 * events are synced, so the handlers may change game state.
 */
export function sprintKey(player: MapPlayer, hero: Unit): Subscription[] {
  const sprint = ({ isDown }: KeyPayload) => {
    hero.moveSpeed = isDown ? 400 : hero.defaultMoveSpeed;
  };
  return [
    on(PlayerEvents.keyDown(player, OSKEY_SPACE, MetaKey.Shift), sprint),
    on(PlayerEvents.keyUp(player, OSKEY_SPACE, MetaKey.Shift), sprint),
  ];
}
// #endregion keys

// #region mouse
/**
 * Draws a line of footprints where each player drags the mouse with a
 * button held: `x` and `y` are the world point under the mouse. The mouse
 * events are synced, and fire for every player once registered.
 */
export function trackDrags(): Subscription[] {
  const dragging = new Set<MapPlayer>();
  return [
    on(PlayerEvents.mouseDown, ({ player }) => {
      dragging.add(player);
    }),
    on(PlayerEvents.mouseUp, ({ player }) => {
      dragging.delete(player);
    }),
    on(PlayerEvents.mouseMove, ({ player, x, y }) => {
      if (dragging.has(player)) {
        print(`${player.name} drags over ${x.toFixed(0)}, ${y.toFixed(0)}`);
      }
    }),
  ];
}
// #endregion mouse

// #region sync
/**
 * Makes `player`'s pick known to every client: their client sends it with
 * `BlzSendSyncData`, and every client receives it as `data`. The handler
 * ends its own Subscription once the pick arrives.
 */
export function awaitPick(player: MapPlayer, pick: () => string): void {
  const subscription = on(PlayerEvents.syncData(player, "pick"), ({ data }) => {
    print(`${player.name} picked ${data}`);
    subscription.destroy();
  });
  MapPlayer.runLocal(player, () => {
    BlzSendSyncData("pick", pick());
  });
}
// #endregion sync

// #region alliance
/**
 * Warns `player`'s allies when `player` changes their passive alliance
 * setting toward anyone: the payload holds only the player who changed it.
 */
export function watchAlliances(player: MapPlayer): Subscription {
  return on(PlayerEvents.allianceChanged(player, ALLIANCE_PASSIVE), () => {
    for (const other of tsGlobals.Players) {
      if (other !== player && other.isPlayerAlly(player)) {
        other.displayText(0, 0, `${player.name} changed their alliances`);
      }
    }
  });
}
// #endregion alliance

Init.onTriggers(() => {
  const host = tsGlobals.Players[0];
  kickCommand(host);
  announceOutcomes();
  sprintKey(host, Unit.create(host, FourCC("Hpal"), 0, 0));
  trackDrags();
  watchAlliances(host);
});
