/**
 * `startStudio`, the Studio's programmatic entry: a local server on a Map
 * project's map folder, bound to the loopback interface, serving the page
 * and its JSON API (`./server/`). The `reforged-studio` bin calls it, and
 * the Template's `pnpm studio` will (phmilk/reforged-ts-template#145).
 */
import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import {
  readLiveStudio,
  STUDIO_RUNTIME_FORMAT,
  type StudioRuntimeFile,
  type WorldEditorCheckOptions,
  type WorldEditorReloadOptions,
} from "reforged-map";
import { openStorage } from "./casc/storage.js";
import { readGameData, type GameData } from "./game-data.js";
import { findInstall, systemMachine } from "./install.js";
import { GAME_DATA_SETS } from "./layers.js";
import { createPathResolver } from "./paths.js";
import { handle } from "./server/api.js";
import { EventStreams } from "./server/events.js";
import { DEFAULT_PORT, listen } from "./server/listen.js";
import type { EditorEnvironment } from "./server/open-in-editor.js";
import { removeRuntimeFile, writeRuntimeFile } from "./server/runtime-file.js";
import { Session } from "./server/session.js";
import { watchFiles } from "./server/watch.js";

/** The options of {@link startStudio}. */
export interface StudioOptions {
  /**
   * The Map project's root, from which `reforged-builtins` and `typescript`
   * are resolved and under which its Object definitions (`src/objects`) and
   * Object manifest (`object-manifest.json`) are found.
   */
  projectRoot: string;
  /** The map folder, saved as a folder by the World Editor. */
  mapFolder: string;
  /**
   * The game's executable, or any path inside its install: the install
   * holding `.build.info` at or above it is read. When left out, the one
   * `WC3_EXECUTABLE` names, else the Battle.net app's default folders.
   */
  gameExecutable?: string;
  /**
   * The World Editor's executable, which the reload after a save starts
   * (`-launch -loadfile`), with `reforged-map`'s `reloadWorldEditor`. When
   * left out, a save that would offer the reload says the executable is
   * missing.
   */
  worldEditorExecutable?: string;
  /** The first port tried, {@link DEFAULT_PORT} when left out: the next free one above it is taken when it is not free; 0 takes any free port. */
  port?: number;
  /** Whether to open the Studio's page in the system's browser once it listens; false when left out. */
  open?: boolean;
  /**
   * The World Editor check's options (`reforged-map`'s
   * `WorldEditorCheckOptions`), such as a stand-in for the windows' titles
   * in tests; the system's check when left out.
   */
  worldEditorCheck?: WorldEditorCheckOptions;
  /**
   * The World Editor reload's options (`reforged-map`'s
   * `WorldEditorReloadOptions`), such as a stand-in launcher in tests; the
   * system's when left out.
   */
  worldEditorReload?: WorldEditorReloadOptions;
  /** The environment "Open in editor" reads `PATH`, `VISUAL` and `EDITOR` from; `process.env` when left out. */
  env?: EditorEnvironment;
}

/** A running Studio, which {@link startStudio} returns. */
export interface Studio {
  /** Its origin, `http://localhost:<port>`: the page is at `<url>/objects`, an object at `<url>/objects/<rawcode>`. */
  readonly url: string;
  /**
   * Whether this call started it: false when a live Studio already held the
   * map folder, whose URL `url` is and which keeps running.
   */
  readonly started: boolean;
  /**
   * Stops the server, its watch and its event streams, and removes its
   * runtime file; a second call waits for the first. It does nothing for a
   * Studio this call did not start.
   */
  close(): Promise<void>;
}

/** The files beyond the lookup's that the watch polls: the placements. */
const PLACEMENT_FILES = ["war3map.doo", "war3mapUnits.doo"];

/** Opens a URL in the system's browser, detached; an error is not reported. */
function openBrowser(url: string): void {
  const [command, args] =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", '""', url]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : systemMachine.wsl
          ? ["cmd.exe", ["/c", "start", '""', url]]
          : ["xdg-open", [url]];
  const child = spawn(command, args, { detached: true, stdio: "ignore" });
  child.on("error", () => undefined);
  child.unref();
}

/** The signals of a stop from the terminal, on which the runtime file is removed. */
const STOP_SIGNALS: readonly NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

/**
 * Keeps the runtime file while the Studio runs: written now, removed by the
 * returned function, on the process's normal end, or on Ctrl+C or a
 * termination signal, after which a signal no one else listens to ends the
 * process as it would have without the Studio.
 */
function holdRuntimeFile(
  projectRoot: string,
  record: StudioRuntimeFile,
): () => void {
  writeRuntimeFile(projectRoot, record);
  const release = (): void => {
    process.off("exit", release);
    for (const signal of STOP_SIGNALS) process.off(signal, onSignal);
    removeRuntimeFile(projectRoot, record);
  };
  const onSignal = (signal: NodeJS.Signals): void => {
    release();
    if (process.listenerCount(signal) === 0) process.kill(process.pid, signal);
  };
  process.on("exit", release);
  for (const signal of STOP_SIGNALS) process.on(signal, onSignal);
  return release;
}

/**
 * Starts the Studio on a Map project's map folder.
 *
 * @remarks
 * When a live Studio already holds the map folder, as its runtime file
 * (`.reforged-studio.json` at the Map project's root) says, it opens that
 * Studio's page when `open` is true and returns its URL, starting nothing.
 * Otherwise it finds the game's install and opens its storage, opens the
 * map folder once with `reforged-map`'s `openObjectData` and its Rawcode
 * lookup with `openRawcodeLookup`, then listens on `127.0.0.1` only and
 * writes the runtime file, replacing a Studio's on another map folder of
 * the Map project; `close()`, the process's normal end, Ctrl+C and a
 * termination signal remove it. It answers only
 * requests whose `Host` is `localhost:<port>` or `127.0.0.1:<port>`, and a
 * write only from its own origin. It polls the files the lookup reads and
 * the placement files once a second, holding none open: a change with no
 * unsaved edit reads the map folder again and sends `reloaded` on the event
 * stream, a change with unsaved edits keeps them and sends
 * `changed-on-disk`.
 *
 * @param options - The Map project, its map folder, the game, the port and
 *   whether to open the page.
 * @returns The running Studio: its URL, whether this call started it, and
 *   how to stop it.
 * @throws {@link InstallNotFoundError} When the game's install is not found;
 *   its message names the setting to fix.
 * @throws `reforged-map`'s `MapFolderError` When the map folder is missing.
 */
export async function startStudio(options: StudioOptions): Promise<Studio> {
  const projectRoot = path.resolve(options.projectRoot);
  const mapFolder = path.resolve(options.mapFolder);
  const running = readLiveStudio(projectRoot, mapFolder);
  if (running !== undefined) {
    if (options.open === true) openBrowser(`${running.url}/objects`);
    return { url: running.url, started: false, close: () => Promise.resolve() };
  }
  const installDir = findInstall(
    options.gameExecutable,
    projectRoot,
    systemMachine,
  );
  const storage = await openStorage(installDir);
  const build = storage.build;

  const gameData = new Map<string, Promise<GameData>>();
  const gameDataOf = (gameDataSet: string): Promise<GameData> => {
    let read = gameData.get(gameDataSet);
    if (read === undefined) {
      read = readGameData(storage, { gameDataSet });
      gameData.set(gameDataSet, read);
    }
    return read;
  };

  // The art layer is HD until #839 reads the World Editor's preference.
  const paths = createPathResolver(storage, { artLayer: "hd", mapFolder });

  const session = new Session({ projectRoot, mapFolder });
  const events = new EventStreams();

  let port = 0;
  // The watch's resync, once the watch runs: after the Studio's own save.
  let resync = (): void => undefined;
  const worldEditorExecutable =
    options.worldEditorExecutable === undefined
      ? undefined
      : path.resolve(options.worldEditorExecutable);
  const server = http.createServer((request, response) => {
    void handle(
      {
        session,
        events,
        port: () => port,
        projectRoot,
        mapFolder,
        build,
        gameData: gameDataOf,
        fallbackGameDataSet: GAME_DATA_SETS[0]?.id ?? "custom-fk",
        worldEditorCheck: options.worldEditorCheck,
        worldEditorExecutable,
        worldEditorReload: options.worldEditorReload,
        resync: () => {
          resync();
        },
        env: options.env ?? process.env,
        paths,
      },
      request,
      response,
    );
  });
  port = await listen(server, options.port ?? DEFAULT_PORT);
  const url = `http://localhost:${String(port)}`;
  const releaseRuntimeFile = holdRuntimeFile(projectRoot, {
    format: STUDIO_RUNTIME_FORMAT,
    url,
    pid: process.pid,
    mapFolder,
    startedAt: new Date().toISOString(),
  });

  const watch = watchFiles(
    () => [
      ...session.lookup.files(),
      ...PLACEMENT_FILES.map((name) => path.join(mapFolder, name)),
    ],
    (files) => {
      const names = files.map((file) =>
        path
          .relative(
            path.dirname(file) === mapFolder ? mapFolder : projectRoot,
            file,
          )
          .split(path.sep)
          .join("/"),
      );
      const counts = session.counts();
      if (counts.unsavedEdits > 0) {
        events.send("changed-on-disk", { ...counts, files: names });
        return true;
      }
      try {
        session.reopen();
      } catch {
        // The map folder cannot be read yet (a World Editor save replacing
        // it): the next poll tries again.
        return false;
      }
      events.send("reloaded", { ...session.counts(), files: names });
      return true;
    },
  );

  resync = () => {
    watch.resync();
  };

  if (options.open === true) openBrowser(`${url}/objects`);

  let closed: Promise<void> | undefined;
  return {
    url,
    started: true,
    close: () =>
      (closed ??= new Promise((resolve, reject) => {
        releaseRuntimeFile();
        watch.stop();
        events.close();
        server.close((error) => {
          if (error === undefined) resolve();
          else reject(error);
        });
        server.closeAllConnections();
      })),
  };
}
