/**
 * `probe:build`: compiles a Probe with the runner's in-game module as the
 * bundle's entry, bakes the Probe's name, a fresh runId and the Patch of the
 * Typings it compiles against into the bundle, composes the editor script
 * and the bundle into the map script and stages the map folder. Needs no
 * game.
 */
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { compileBundle } from "./compile.js";
import { composeMapScript } from "./compose.js";
import {
  PROBE_FOLDERS,
  PROBES_TSCONFIG,
  RUNNER_MODULE,
  WORKSPACE_FOLDER,
  type ProbeFolders,
} from "./folders.js";
import { gameVersion, readPatch } from "./manifest.js";
import { probeFile } from "./probes.js";
import {
  EDITOR_SCRIPT,
  cleanOutputFolder,
  readEditorScript,
  stageMapFolder,
  stagingFolderFor,
} from "./stage.js";
import { writeState } from "./state.js";

/** The module specifier the runner imports the Probe by. */
export const CURRENT_PROBE = "@probe/current";

/**
 * The string literals of the in-game module (game/runner.ts) that a build
 * replaces in the bundle, quotes included, with the Probe's name, the
 * build's runId and the Patch of the Typings.
 */
export const PLACEHOLDERS = {
  probe: '"$PROBE_NAME$"',
  runId: '"$PROBE_RUN_ID$"',
  patch: '"$PROBE_PATCH$"',
} as const;

/** A runId: letters, digits and hyphens, inside the Result file's safe alphabet. */
const RUN_ID_PATTERN = /^[A-Za-z0-9-]+$/;

export interface BuildResult {
  probe: string;
  /** The runId baked into the bundle and stored in the state file. */
  runId: string;
  /** The Patch of the Typings' manifest, baked into the bundle. */
  patch: string;
  /** The staged copy of the map folder, holding the composed script. */
  stagingFolder: string;
  /** The bundle, as baked and composed. */
  bundleFile: string;
}

/** The line a command prints for a build: the Probe, its runId and where it was staged. */
export function builtMessage(result: BuildResult): string {
  return `Built Probe ${result.probe}, run ${result.runId}: ${result.stagingFolder}`;
}

/**
 * Builds the Probe `probe` of `folders.probes` into
 * `<folders.output>/<probe>/`, emptied first: the bundle, then the staged
 * map folder whose `war3map.lua` is the editor script, one newline and the
 * bundle. The runner writes the Patch of `folders.manifest` in the run's
 * `BEGIN` line, so the run names the Typings it was built against. Stores
 * the runId, with `client`, the Build of the game client `probe:run` runs
 * it on, in the Probe's state file last, so a failed build leaves the
 * previous one's. A bad name, a missing Probe, a manifest without a Patch
 * or a compile error is an AuthorError of one line.
 */
export function buildProbe(
  probe: string,
  folders: ProbeFolders = PROBE_FOLDERS,
  runId: string = randomUUID(),
  client?: string,
): BuildResult {
  const source = probeFile(folders.probes, probe);
  if (!RUN_ID_PATTERN.test(runId)) {
    throw new Error(`Not a runId: ${JSON.stringify(runId)}`);
  }
  const patch = readPatch(folders.manifest);
  // Fail on a map folder without the editor script before touching the output folder.
  const editorScript = readEditorScript(folders.map);

  const outputFolder = path.join(folders.output, probe);
  cleanOutputFolder(outputFolder);
  const stagingFolder = stagingFolderFor(outputFolder, folders.map);
  stageMapFolder(folders.map, stagingFolder);

  const bundle = compileBundle({
    tsconfig: PROBES_TSCONFIG,
    entry: RUNNER_MODULE,
    paths: { [CURRENT_PROBE]: source },
    rootDir: commonFolder(WORKSPACE_FOLDER, path.dirname(source)),
    outDir: outputFolder,
    typings: gameVersion(patch),
  });
  const baked = bake(bundle.bytes, {
    [PLACEHOLDERS.probe]: JSON.stringify(probe),
    [PLACEHOLDERS.runId]: JSON.stringify(runId),
    [PLACEHOLDERS.patch]: JSON.stringify(patch),
  });
  fs.writeFileSync(bundle.file, baked);
  fs.writeFileSync(
    path.join(stagingFolder, EDITOR_SCRIPT),
    composeMapScript(editorScript, baked),
  );

  writeState(folders.state, {
    probe,
    runId,
    ...(client !== undefined && { client }),
  });
  return { probe, runId, patch, stagingFolder, bundleFile: bundle.file };
}

/** The deepest folder holding both folders. */
function commonFolder(first: string, second: string): string {
  let folder = path.resolve(first);
  const other = path.resolve(second);
  for (;;) {
    const relative = path.relative(folder, other);
    const parent = path.dirname(folder);
    if (
      (!relative.startsWith("..") && !path.isAbsolute(relative)) ||
      parent === folder
    ) {
      return folder;
    }
    folder = parent;
  }
}

/**
 * The bundle with each placeholder replaced by its value. Each must occur
 * exactly once: the in-game module holds each once, and nothing else may.
 * Bytes are kept as they are (latin1 maps each byte to one character).
 */
function bake(
  bundle: Uint8Array,
  values: Readonly<Record<string, string>>,
): Uint8Array {
  let text = Buffer.from(bundle).toString("latin1");
  for (const [placeholder, value] of Object.entries(values)) {
    const count = text.split(placeholder).length - 1;
    if (count !== 1) {
      throw new Error(
        `The bundle holds ${String(count)} ${placeholder}, not one: the runner's in-game module defines it once, and no Probe may use it.`,
      );
    }
    text = text.replace(placeholder, () => value);
  }
  return Buffer.from(text, "latin1");
}
