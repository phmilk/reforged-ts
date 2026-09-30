/**
 * A Probe's state file, `<state>/<probe>.json`: the runId of its last build,
 * which `probe:read` compares with the Result file's.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AuthorError } from "./errors.js";
import type { Machine } from "./machine.js";

export interface ProbeState {
  probe: string;
  /** The runId the last build baked into the bundle. */
  runId: string;
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
  const { runId } = (state ?? {}) as { runId?: unknown };
  if (typeof runId !== "string" || runId === "") {
    throw new AuthorError(
      `${file} holds no runId: build the Probe again with \`pnpm probe:build ${probe}\`.`,
    );
  }
  return { probe, runId };
}
