/**
 * A Probe's state file, `<state>/<probe>.json`: the runId of its last build,
 * which `probe:read` compares with the Result file's, the Build of the
 * game client `probe:run` built it for, and the Game data it staged.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AuthorError } from "./errors.js";
import { gameDataFrom, type GameData } from "./game-data.js";
import type { Machine } from "./machine.js";

export interface ProbeState {
  probe: string;
  /** The runId the last build baked into the bundle. */
  runId: string;
  /**
   * The Build of the game client the last build was run on, from its
   * build config; undefined for a build `probe:build` made alone.
   */
  client?: string;
  /** The Game data the last build staged, for the report; absent when it kept the map's own. */
  gameData?: GameData;
}

/** The state file of `probe` in the state folder. */
export function stateFile(folder: string, probe: string): string {
  return join(folder, `${probe}.json`);
}

export function writeState(folder: string, state: ProbeState): void {
  mkdirSync(folder, { recursive: true });
  writeFileSync(
    stateFile(folder, state.probe),
    `${JSON.stringify(state, null, 2)}\n`,
  );
}

/** The state of `probe`'s last build; undefined when it was never built. */
export function readState(
  machine: Machine,
  folder: string,
  probe: string,
): ProbeState | undefined {
  const file = stateFile(folder, probe);
  const text = machine.readFile(file);
  if (text === undefined) return undefined;
  let state: unknown;
  try {
    state = JSON.parse(text);
  } catch {
    state = undefined;
  }
  const { runId, client, gameData } = (state ?? {}) as {
    runId?: unknown;
    client?: unknown;
    gameData?: unknown;
  };
  if (typeof runId !== "string" || runId === "") {
    throw new AuthorError(
      `${file} holds no runId: build the Probe again with \`pnpm probe:build ${probe}\`.`,
    );
  }
  const staged =
    typeof gameData === "object" && gameData !== null
      ? gameDataFrom((name) => (gameData as Record<string, unknown>)[name])
      : {};
  return {
    probe,
    runId,
    ...(typeof client === "string" && { client }),
    ...(Object.keys(staged).length > 0 && { gameData: staged }),
  };
}
