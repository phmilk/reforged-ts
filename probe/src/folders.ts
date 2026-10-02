/**
 * Where the Probe runner finds its Probes and map folder, and where it
 * writes: the package's own folders, which a test replaces with temporary
 * ones.
 */
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** The package folder, from src/ (the tests) and build/ (the commands) alike. */
export const PACKAGE_FOLDER = fileURLToPath(new URL("..", import.meta.url));

/** The workspace, whose library sources a Probe may import. */
export const WORKSPACE_FOLDER = join(PACKAGE_FOLDER, "..");

export interface ProbeFolders {
  /** The Probes: one `<probe>.ts` each. */
  probes: string;
  /** The map folder a Probe is composed into, as the World Editor saved it. */
  map: string;
  /** Where each Probe is built: `<output>/<probe>/`, its bundle and staged map folder. */
  output: string;
  /** Where each Probe's state file is kept: `<state>/<probe>.json`. */
  state: string;
}

/** The package's folders. `.probe/` is ignored by git. */
export const PROBE_FOLDERS: ProbeFolders = {
  probes: join(PACKAGE_FOLDER, "probes"),
  map: join(PACKAGE_FOLDER, "probe.w3m"),
  output: join(PACKAGE_FOLDER, ".probe", "build"),
  state: join(PACKAGE_FOLDER, ".probe"),
};

/**
 * The typescript-to-lua project of the Probes and the in-game module: the
 * options every Probe compiles with.
 */
export const PROBES_TSCONFIG = join(PACKAGE_FOLDER, "probes", "tsconfig.json");

/** The runner's in-game module: the entry of every Probe's bundle. */
export const RUNNER_MODULE = join(PACKAGE_FOLDER, "game", "runner.ts");

/** The reforged-types package, whose Typings the Probes compile against. */
const TYPES_FOLDER = join(WORKSPACE_FOLDER, "packages", "reforged-types");

/**
 * The Overlay, one JSON entry per declaration, which the Nullability
 * sweep's report reads and never writes.
 */
export const OVERLAY_FOLDER = join(TYPES_FOLDER, "overlay");

/**
 * The manifest of the Typings the Probes compile against
 * (`reforged-types/3.0.0`, probes/tsconfig.json): its `patch` is their Build.
 */
export const TYPINGS_MANIFEST = join(TYPES_FOLDER, "3.0.0", "manifest.json");

/** The Nullability sweep's report, one section per Slice, in the research docs. */
export const NULLABILITY_REPORT = join(
  WORKSPACE_FOLDER,
  "docs",
  "research",
  "nullability-sweep.md",
);
