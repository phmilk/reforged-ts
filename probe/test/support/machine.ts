import type { Machine } from "../../src/machine.js";

export interface FakeMachineOptions {
  platform?: NodeJS.Platform;
  env?: Record<string, string>;
  /** The files, by path: their text. */
  files?: Record<string, string>;
  /** The registry, by key then value name: the data as stored. */
  registry?: Record<string, Record<string, string>>;
}

/**
 * A machine that answers from the options alone: no real file, registry,
 * process or program is reached. Windows unless `platform` says otherwise.
 */
export function fakeMachine(options: FakeMachineOptions = {}): Machine {
  const files = options.files ?? {};
  return {
    platform: options.platform ?? "win32",
    env: options.env ?? {},
    exists: (file) => file in files,
    readFile: (file) => files[file],
    queryRegistry: (key, value) => options.registry?.[key]?.[value],
    isRunning: () => false,
    spawnDetached: () =>
      Promise.reject(new Error("the fake machine starts no program")),
  };
}
