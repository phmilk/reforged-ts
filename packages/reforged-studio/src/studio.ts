/**
 * `startStudio`, the Studio's programmatic entry: a local server on a Map
 * project's map folder, bound to the loopback interface, serving the page
 * and its JSON API (`./server/`). The `reforged-studio` bin and the
 * Template's `pnpm studio` both call it.
 */
import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import type { WorldEditorCheckOptions } from "reforged-map";
import { openStorage } from "./casc/storage.js";
import { readGameData, type GameData } from "./game-data.js";
import { findInstall, systemMachine } from "./install.js";
import { GAME_DATA_SETS } from "./layers.js";
import { handle } from "./server/api.js";
import { EventStreams } from "./server/events.js";
import { DEFAULT_PORT, listen } from "./server/listen.js";
import type { EditorEnvironment } from "./server/open-in-editor.js";
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
   * (`-launch -loadfile`): kept for the save, which comes with #834.
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
  /** The environment "Open in editor" reads `PATH`, `VISUAL` and `EDITOR` from; `process.env` when left out. */
  env?: EditorEnvironment;
}

/** A running Studio, which {@link startStudio} returns. */
export interface Studio {
  /** Its origin, `http://localhost:<port>`: the page is at `<url>/objects`, an object at `<url>/objects/<rawcode>`. */
  readonly url: string;
  /** Stops the server, its watch and its event streams. */
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

/**
 * Starts the Studio on a Map project's map folder.
 *
 * @remarks
 * It finds the game's install and opens its storage, opens the map folder
 * once with `reforged-map`'s `openObjectData` and its Rawcode lookup with
 * `openRawcodeLookup`, then listens on `127.0.0.1` only. It answers only
 * requests whose `Host` is `localhost:<port>` or `127.0.0.1:<port>`, and a
 * write only from its own origin. It polls the files the lookup reads and
 * the placement files once a second, holding none open: a change with no
 * unsaved edit reads the map folder again and sends `reloaded` on the event
 * stream, a change with unsaved edits keeps them and sends
 * `changed-on-disk`.
 *
 * @param options - The Map project, its map folder, the game, the port and
 *   whether to open the page.
 * @returns The running Studio: its URL, and how to stop it.
 * @throws {@link InstallNotFoundError} When the game's install is not found;
 *   its message names the setting to fix.
 * @throws `reforged-map`'s `MapFolderError` When the map folder is missing.
 */
export async function startStudio(options: StudioOptions): Promise<Studio> {
  const projectRoot = path.resolve(options.projectRoot);
  const mapFolder = path.resolve(options.mapFolder);
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

  const current = new Session({ projectRoot, mapFolder });
  const events = new EventStreams();

  let port = 0;
  const server = http.createServer((request, response) => {
    void handle(
      {
        session: current,
        events,
        port: () => port,
        projectRoot,
        mapFolder,
        build,
        gameData: gameDataOf,
        fallbackGameDataSet: GAME_DATA_SETS[0]?.id ?? "custom-fk",
        worldEditorCheck: options.worldEditorCheck,
        env: options.env ?? process.env,
      },
      request,
      response,
    );
  });
  port = await listen(server, options.port ?? DEFAULT_PORT);
  const url = `http://localhost:${String(port)}`;

  const watch = watchFiles(
    () => [
      ...current.lookup.files(),
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
      const counts = current.counts();
      if (counts.unsavedEdits > 0) {
        events.send("changed-on-disk", { ...counts, files: names });
        return true;
      }
      try {
        current.reopen();
      } catch {
        // The map folder cannot be read yet (a World Editor save replacing
        // it): the next poll tries again.
        return false;
      }
      events.send("reloaded", { ...current.counts(), files: names });
      return true;
    },
  );

  if (options.open === true) openBrowser(`${url}/objects`);

  return {
    url,
    close: () =>
      new Promise((resolve, reject) => {
        watch.stop();
        events.close();
        server.close((error) => {
          if (error === undefined) resolve();
          else reject(error);
        });
        server.closeAllConnections();
      }),
  };
}
