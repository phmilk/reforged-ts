/** @noSelfInFile */

// Local-only code: what `MapPlayer.runLocal` does in Dev mode, and the one
// check the actions that change game state make against it.
//
// In Dev mode `runLocal` runs its function one level deeper and under pcall,
// so an error inside is reported like a failing callback and the depth is
// restored. While the depth is not zero, the base's creation and release
// steps, `Group.for`, `Force.for` and a first `Frame.fromName` raise through
// `assertNotLocal`: each changes game state on one client only (a Handle id
// allocated or freed, an enumeration run), which desyncs the game. With Dev
// mode off the depth never leaves zero, so the check never raises.
//
// Package-internal: nothing here is exported from the library index.

import type { Handle } from "../handles/handle";
import { anchored, LIBRARY } from "../init/state";
import { originOf, reportedFailures, reportFailure } from "./protect";

/** How many Dev-mode `runLocal` functions are running now, nested. */
const local = anchored<{ depth: number }>("local", () => ({ depth: 0 }));

/** What the failures of every `runLocal` function reported, shared. */
const reported = reportedFailures();

/**
 * Runs `fn` as Dev mode's `runLocal` does, for `player` (already known to be
 * the local player): one level deeper, under pcall, then back at the depth it
 * started at. A failure is reported like a protected callback's, with the
 * origin `MapPlayer#<id> MapPlayer.runLocal`.
 */
export function runLocalGuarded(player: Handle<handle>, fn: () => void): void {
  local.depth++;
  const [ok, failure] = pcall(fn);
  local.depth--;
  if (!ok) {
    reportFailure(
      reported,
      originOf(player, "MapPlayer.runLocal"),
      tostring(failure),
    );
  }
}

/**
 * Raises when called inside a Dev-mode `runLocal`: `action` (`creating a
 * Unit`, `Group.for`) changes game state for one client. `level` is the one
 * the caller would give `error` to name the Map project's line.
 */
export function assertNotLocal(action: string, level: number): void {
  if (local.depth !== 0) {
    error(
      `${LIBRARY}: ${action} inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`,
      level + 1,
    );
  }
}
