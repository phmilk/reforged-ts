import type { Machine, SpawnCommand, Wsl } from "../../src/machine.js";

/** The Windows side of a fake WSL machine. */
export interface FakeWslOptions {
  /** The Windows Documents folder, as a Windows path. */
  documents?: string;
  /** The Windows `%TEMP%` folder, as a Windows path. */
  temp?: string;
  /**
   * Windows folders mapped to folders of this machine, by Windows path:
   * `toWsl` gives a path under one of them its local path. Any other path
   * gives its `/mnt/<drive>/` path, as `wslpath -u` does.
   */
  roots?: Record<string, string>;
}

/**
 * A fake WSL bridge answering from `options`: `toWsl` as `wslpath -u`, a
 * folder absent from `options` an AuthorError-like failure.
 */
export function fakeWsl(options: FakeWslOptions = {}): Wsl {
  const answer = (value: string | undefined, what: string) => () => {
    if (value === undefined) {
      throw new Error(`the fake WSL machine has no ${what}`);
    }
    return value;
  };
  return {
    toWsl: (windowsPath) => {
      for (const [windows, local] of Object.entries(options.roots ?? {})) {
        if (windowsPath.toLowerCase().startsWith(windows.toLowerCase())) {
          const rest = windowsPath.slice(windows.length).split("\\");
          return [local, ...rest].filter((part) => part !== "").join("/");
        }
      }
      const match = /^([A-Za-z]):\\?(.*)$/.exec(windowsPath);
      if (match === null) throw new Error(`not a Windows path: ${windowsPath}`);
      const [, drive = "", rest = ""] = match;
      return `/mnt/${drive.toLowerCase()}/${rest.split("\\").join("/")}`;
    },
    documentsFolder: answer(options.documents, "Documents folder"),
    tempFolder: answer(options.temp, "TEMP folder"),
  };
}

export interface FakeMachineOptions {
  platform?: NodeJS.Platform;
  /** Makes the machine a WSL one (platform `linux`), its Windows side answering from these. */
  wsl?: FakeWslOptions;
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
 * process or program is reached. Windows unless `platform` says otherwise;
 * WSL, on `linux`, with `wsl`.
 */
export function fakeMachine(options: FakeMachineOptions = {}): Machine {
  const files = options.files ?? {};
  const { spawned } = options;
  return {
    platform:
      options.platform ?? (options.wsl === undefined ? "win32" : "linux"),
    ...(options.wsl !== undefined && { wsl: fakeWsl(options.wsl) }),
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
