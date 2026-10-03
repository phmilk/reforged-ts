import type {
  GameProcess,
  Machine,
  SpawnCommand,
  Wsl,
} from "../../src/machine.js";

/** The Windows side of a fake WSL machine. */
export interface FakeWslOptions {
  /** The Windows Documents folder, as a Windows path. */
  documents?: string;
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
    documentsFolder: () => {
      if (options.documents === undefined) {
        throw new Error("the fake WSL machine has no Documents folder");
      }
      return options.documents;
    },
  };
}

/** What a fake machine's game did, in order, with the fake time of each step. */
export type GameEvent =
  | { at: number; event: "start"; command: SpawnCommand }
  | { at: number; event: "key"; pid: number }
  | { at: number; event: "capture"; pid: number; file: string }
  | { at: number; event: "end"; pid: number };

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
   * Where the machine records what it is asked to do to a game: start it,
   * post it a key, capture its window, end it. Without it, the machine
   * starts no program: a start is refused.
   */
  game?: GameEvent[];
  /**
   * Called each time the fake time moves on (`sleep`), with the new time in
   * milliseconds from 0 and the game started, if any: a test writes the
   * Result file or makes the game exit here.
   */
  onTime?: (time: number, game: FakeGame | undefined) => void;
  /** Whether a key can be posted yet: false while the game has no window. Default: always. */
  hasWindow?: (time: number) => boolean;
  /** Makes a capture fail with this message. */
  captureFailure?: string;
}

/** The game process a fake machine started. */
export interface FakeGame extends GameProcess {
  /** Makes the process exit, as a crash or `endProcess` does. */
  exit(): void;
}

/**
 * A machine that answers from the options alone: no real file, registry,
 * process, program, window or clock is reached. Windows unless `platform`
 * says otherwise; WSL, on `linux`, with `wsl`. Its time starts at 0 and
 * moves only by `sleep`.
 */
export function fakeMachine(options: FakeMachineOptions = {}): Machine {
  const files = options.files ?? {};
  const events = options.game;
  let time = 0;
  let game: FakeGame | undefined;
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
    startGame: (command) => {
      if (events === undefined) {
        return Promise.reject(new Error("the fake machine starts no program"));
      }
      events.push({ at: time, event: "start", command });
      let exited = false;
      game = {
        pid: 4242,
        exited: () => exited,
        exit: () => {
          exited = true;
        },
      };
      return Promise.resolve(game);
    },
    postKey: (pid) => {
      if (!(options.hasWindow?.(time) ?? true)) return false;
      events?.push({ at: time, event: "key", pid });
      return true;
    },
    captureWindow: (pid, file) => {
      events?.push({ at: time, event: "capture", pid, file });
      if (options.captureFailure !== undefined) {
        throw new Error(options.captureFailure);
      }
    },
    endProcess: (pid) => {
      events?.push({ at: time, event: "end", pid });
      game?.exit();
    },
    now: () => time,
    sleep: (milliseconds) => {
      time += milliseconds;
      options.onTime?.(time, game);
      return Promise.resolve();
    },
  };
}
