import type { Machine, SpawnCommand } from "../../src/machine.js";

export interface FakeMachineOptions {
  platform?: NodeJS.Platform;
  env?: Record<string, string>;
  /** The files, by path: their text. */
  files?: Record<string, string>;
  /** The registry, by key then value name: the data as stored. */
  registry?: Record<string, Record<string, string>>;
  /** The image names of the running processes, as the process list gives them. */
  processes?: readonly string[];
  /** Where the process-list query records each image name it is asked about. */
  processQueries?: string[];
  /**
   * Where the detached spawn records each program it is asked to start.
   * Without it, the machine starts no program: a spawn is refused.
   */
  spawned?: SpawnCommand[];
}

/**
 * A machine that answers from the options alone: no real file, registry,
 * process or program is reached. Windows unless `platform` says otherwise.
 */
export function fakeMachine(options: FakeMachineOptions = {}): Machine {
  const files = options.files ?? {};
  const { spawned } = options;
  return {
    platform: options.platform ?? "win32",
    env: options.env ?? {},
    exists: (file) => file in files,
    readFile: (file) => files[file],
    queryRegistry: (key, value) => options.registry?.[key]?.[value],
    isRunning: (imageName) => {
      options.processQueries?.push(imageName);
      return (options.processes ?? []).includes(imageName);
    },
    spawnDetached: (command) => {
      if (spawned === undefined) {
        return Promise.reject(new Error("the fake machine starts no program"));
      }
      spawned.push(command);
      return Promise.resolve();
    },
  };
}
