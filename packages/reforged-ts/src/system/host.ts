/** @noSelfInFile */

import { MapPlayer } from "../handles/index";
import { Timer } from "../handles/timer";
import { onEntryPoint } from "../init/entry-points";
import { onStage } from "../init/stages";
import { base64Decode, base64Encode } from "./base64";
import { BinaryReader } from "./binaryreader";
import { BinaryWriter } from "./binarywriter";
import { type SyncResponse, SyncRequest } from "./sync";

const lobbyTimes: number[] = [];
const hostCallbacks: (() => void)[] = [];
let localJoinTime = 0;
let localStartTime = 0;
let host: MapPlayer | undefined;
let checkTimer: Timer | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- an unused variable or parameter, whose removal changes the emitted Lua; step 6 (#53) removes it
let isChecking = false;

export function onHostDetect(callback: () => void) {
  if (host) {
    callback();
  } else {
    hostCallbacks.push(callback);
  }
}

function onConfig() {
  if (localJoinTime === 0) {
    localJoinTime = os.clock();
  }
}

/** Whether `p` is a user who is playing. */
function isPlayingUser(p: MapPlayer | undefined): p is MapPlayer {
  return (
    p?.slotState === PLAYER_SLOT_STATE_PLAYING &&
    p.controller === MAP_CONTROL_USER
  );
}

function onLobbyTime(res: SyncResponse) {
  const reader = new BinaryReader(base64Decode(res.data));

  // store how long the player has been in the game
  lobbyTimes[res.from.id] = reader.readFloat();

  // check which player has been in the game the longest
  let hostTime = 0;
  let hostId = 0;

  for (let i = 0; i < bj_MAX_PLAYERS; i++) {
    const p = MapPlayer.fromIndex(i);

    // skip if the player is not playing
    if (!isPlayingUser(p)) {
      continue;
    }

    // if a playing user has not yet finished syncing then terminate execution
    if (!lobbyTimes[p.id]) {
      return;
    }

    // store the host with the longest game time
    if (lobbyTimes[p.id] > hostTime) {
      hostTime = lobbyTimes[p.id];
      hostId = p.id;
    }
  }

  // set the host, cleanup, and execute callbacks
  host = MapPlayer.fromIndex(hostId);
  if (checkTimer) {
    checkTimer.destroy();
  }
  hostCallbacks.forEach((cb) => {
    cb();
  });
}

function findHost() {
  isChecking = true;

  if (localStartTime === 0) {
    localStartTime = os.clock();
  }

  // sync each players total game time
  const writer = new BinaryWriter();
  writer.writeFloat(localStartTime - localJoinTime);
  const data = base64Encode(writer.toString());

  // One request per playing user, in slot order on every client, so the ids
  // agree; only that user's client sends, with its own measurement.
  for (let i = 0; i < bj_MAX_PLAYERS; i++) {
    const p = MapPlayer.fromIndex(i);
    if (isPlayingUser(p)) {
      SyncRequest.send(p, data).then(onLobbyTime, (reason: unknown) => {
        print(`findHost Error: ${String(reason)}`);
        isChecking = false;
      });
    }
  }
}

function onGameStart() {
  checkTimer = Timer.create();
  checkTimer.start(0.0, false, findHost);
}

// The detection Timer is born at the `gameStart` stage, not at the end of
// `main`: timers do not tick during initialization, so the difference is
// invisible, and no Handle is created in the Lua root. The join-time
// measurement keeps `config` timing, the lobby, which no stage has: build
// step 6 (#53) owns whether the heuristic stays.
onStage("gameStart", "library", onGameStart, "host detection");
onEntryPoint("config::before", "library", onConfig, "host join time");
