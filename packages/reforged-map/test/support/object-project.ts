// The Map project of the Object tests (#758): a copy of a fixture map folder,
// the definition files a test writes under its root, and typescript and
// reforged-builtins linked from this package's installation, as Object sync,
// adoption, release and the build read them. Unlike createMapProject's
// (map-project.ts), it has no tsconfig and no fixture sources in src/.

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  syncObjectDefinitions,
  type ObjectSyncOptions,
} from "../../src/index.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  listTree,
  makeTempDir,
} from "./map-folder.js";

/** A Map project of the Object tests: its root, and its map folder under the root. */
export interface MapProject {
  readonly root: string;
  readonly mapFolder: string;
}

/** How the Map project is set up beyond its map folder and files. */
export interface ObjectProjectOptions {
  /** Whether the Map project installs typescript. */
  readonly typescript?: boolean;
  /** Whether it installs reforged-builtins, or the folder of a stand-in. */
  readonly builtins?: boolean | string;
  /** The name of its map folder, `test.w3m` by default. */
  readonly mapFolder?: string;
}

/**
 * Links `node_modules/<name>` of `root` to `target`, this package's
 * installation of `name` by default. The link is a junction, which Windows
 * makes without the right to create symbolic links, to the target's real
 * path, since a junction to a link is not followed there.
 */
export function link(
  root: string,
  name: string,
  target: string = path.join(PACKAGE_ROOT, "node_modules", name),
): void {
  const linkPath = path.join(root, "node_modules", ...name.split("/"));
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync(fs.realpathSync(target), linkPath, "junction");
}

/** Writes files under the Map project's root, by relative path, their folders made. */
export function write(
  project: Pick<MapProject, "root">,
  files: Readonly<Record<string, string>>,
): void {
  for (const [name, contents] of Object.entries(files)) {
    const file = path.join(project.root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
  }
}

/**
 * A Map project in a new temporary folder, removed by `removeTemporary`: a
 * copy of the fixture map folder `fixture` as its map folder, a private
 * package.json, `files` under its root, and typescript and reforged-builtins
 * linked unless `options` leaves them out.
 */
export function mapProject(
  fixture: string,
  files: Readonly<Record<string, string>> = {},
  {
    typescript = true,
    builtins = true,
    mapFolder: name = "test.w3m",
  }: ObjectProjectOptions = {},
): MapProject {
  const root = makeTempDir();
  const mapFolder = path.join(root, name);
  fs.cpSync(fixtureMap(fixture), mapFolder, { recursive: true });
  fs.writeFileSync(path.join(root, "package.json"), '{ "private": true }\n');
  if (typescript) link(root, "typescript");
  if (builtins !== false) {
    link(root, "reforged-builtins", builtins === true ? undefined : builtins);
  }
  const project = { root, mapFolder };
  write(project, files);
  return project;
}

/** A copy of a Map project in a new temporary folder, typescript and reforged-builtins linked again: `cpSync` would copy their folders on Windows (#754). */
export function copyProject(project: MapProject): MapProject {
  const root = makeTempDir();
  const modules = path.join(project.root, "node_modules");
  fs.cpSync(project.root, root, {
    recursive: true,
    filter: (source) => source !== modules,
  });
  link(root, "typescript");
  link(root, "reforged-builtins");
  return {
    root,
    mapFolder: path.join(root, path.relative(project.root, project.mapFolder)),
  };
}

/** Options whose World Editor check sees no window. */
const NO_WINDOW: ObjectSyncOptions = {
  worldEditorCheck: { readWindowTitles: () => [] },
};

/** Syncs a Map project's Object definitions into its map folder, with no World Editor window unless `options` says otherwise. */
export function sync(project: MapProject, options: ObjectSyncOptions = {}) {
  return syncObjectDefinitions(project.mapFolder, project.root, {
    ...NO_WINDOW,
    ...options,
  });
}

/** What `snapshot` holds beyond the files. */
export interface SnapshotOptions {
  /** Whether the folders are held too, each as `folder`. */
  readonly folders?: boolean;
}

/**
 * Every file under a folder, outside a `node_modules`, by relative path with
 * `/` separators, with the SHA-256 of its bytes in hex, sorted by path. With
 * `folders`, every folder under it too, as `folder`.
 */
export function snapshot(
  folder: string,
  { folders = false }: SnapshotOptions = {},
): Map<string, string> {
  const entries: [string, string][] = [];
  for (const name of listTree(folder)) {
    const entry = path.join(folder, name);
    const relative = name.split(path.sep).join("/");
    if (fs.statSync(entry).isFile()) {
      entries.push([
        relative,
        createHash("sha256").update(fs.readFileSync(entry)).digest("hex"),
      ]);
    } else if (folders) {
      entries.push([relative, "folder"]);
    }
  }
  return new Map(entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}
