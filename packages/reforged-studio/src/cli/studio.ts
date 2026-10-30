#!/usr/bin/env node
/**
 * The `reforged-studio` bin, a thin wrapper over `startStudio` for a Map
 * project not made from the Template, whose `pnpm studio` is to call
 * `startStudio` itself (phmilk/reforged-ts-template#145):
 *
 * `reforged-studio --map <folder> [--project <root>] [--game <executable>]
 * [--world-editor <executable>] [--port <port>] [--no-open]`
 *
 * The Map project's root is the current folder when `--project` is left
 * out; the game is found as `startStudio` finds it. It prints the Studio's
 * URL, opens it unless `--no-open`, and stops on Ctrl+C; when a Studio
 * already runs on the map folder, it opens and prints that one's, and ends.
 * A missing game or map folder prints one line naming what to fix, and
 * exits 1.
 */
import path from "node:path";
import { parseArgs } from "node:util";
import { MapFolderError } from "reforged-map";
import { InstallNotFoundError } from "../install.js";
import { startStudio } from "../studio.js";

const USAGE =
  "Usage: reforged-studio --map <folder> [--project <root>] [--game <executable>] [--world-editor <executable>] [--port <port>] [--no-open]";

const cwd = process.env.INIT_CWD ?? process.cwd();

try {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== "--"),
    options: {
      map: { type: "string" },
      project: { type: "string" },
      game: { type: "string" },
      "world-editor": { type: "string" },
      port: { type: "string" },
      "no-open": { type: "boolean" },
      help: { type: "boolean" },
    },
  });
  if (values.help === true) {
    process.stdout.write(`${USAGE}\n`);
  } else if (values.map === undefined) {
    process.stderr.write(`--map names the map folder. ${USAGE}\n`);
    process.exitCode = 1;
  } else {
    const port = values.port === undefined ? undefined : Number(values.port);
    if (port !== undefined && !Number.isInteger(port)) {
      throw new TypeError(`--port is a number, not ${String(values.port)}.`);
    }
    const studio = await startStudio({
      projectRoot: path.resolve(cwd, values.project ?? "."),
      mapFolder: path.resolve(cwd, values.map),
      ...(values.game !== undefined && {
        gameExecutable: path.resolve(cwd, values.game),
      }),
      ...(values["world-editor"] !== undefined && {
        worldEditorExecutable: values["world-editor"],
      }),
      ...(port !== undefined && { port }),
      open: values["no-open"] !== true,
    });
    if (!studio.started) {
      process.stdout.write(
        `A Studio already runs on this map folder, at ${studio.url}/objects.\n`,
      );
    } else {
      process.stdout.write(
        `The Studio runs at ${studio.url}/objects. Press Ctrl+C to stop it.\n`,
      );
      const stop = () => {
        void studio.close().then(() => process.exit(0));
      };
      process.once("SIGINT", stop);
      process.once("SIGTERM", stop);
    }
  }
} catch (error) {
  if (
    error instanceof InstallNotFoundError ||
    error instanceof MapFolderError ||
    error instanceof TypeError
  ) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
