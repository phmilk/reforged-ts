/** @noSelfInFile */

import { MapPlayer } from "../handles/index";
import { Timer } from "../handles/timer";
import { onEntryPoint } from "../init/entry-points";
import { onStage } from "../init/stages";
import { base64Decode, base64Encode } from "./base64";
import { BinaryReader } from "./binaryreader";
import { BinaryWriter } from "./binarywriter";
import { SyncRequest } from "./sync";

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

function findHost() {
  isChecking = true;

  if (localStartTime === 0) {
    localStartTime = os.clock();
  }

  // sync each players total game time
  const writer = new BinaryWriter();
  writer.writeFloat(localStartTime - localJoinTime);

  new SyncRequest(MapPlayer.fromLocal(), base64Encode(writer.toString()))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- an unused variable or parameter, whose removal changes the emitted Lua; step 6 (#53) removes it
    .then((res, req) => {
      const data = base64Decode(res.data);
      const reader = new BinaryReader(data);
      const syncedTime = reader.readFloat();

      // store how long the player has been in the game
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- the sync sender lookup; step 6 (#53) removes it
      const from = MapPlayer.fromEvent()!;
      lobbyTimes[from.id] = syncedTime;

      // check which player has been in the game the longest
      let hostTime = 0;
      let hostId = 0;

      for (let i = 0; i < bj_MAX_PLAYERS; i++) {
        const p = MapPlayer.fromIndex(i);

        // skip if the player is not playing
        if (
          // eslint-disable-next-line @typescript-eslint/prefer-optional-chain -- rewriting the check changes the emitted Lua; step 6 (#53) removes it
          p === undefined ||
          p.slotState !== PLAYER_SLOT_STATE_PLAYING ||
          p.controller !== MAP_CONTROL_USER
        ) {
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
    })
    // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable -- SyncRequest.catch is not thenable; step 6 (#53) removes it
    .catch((res) => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- a number or status in a template literal; step 6 (#53) removes it
      print(`findHost Error: ${res.status}`);
      isChecking = false;
    });
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
