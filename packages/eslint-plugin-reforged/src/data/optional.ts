// The data files another package publishes: read from the linted project's
// own installation of that package, found from the project root, never from
// the plugin's own dependencies, so the facts are those of the versions the
// map compiles against. The package is optional: when the project does not
// have it, the file is unavailable and the plugin disables the rules that
// require it (plugin.ts). A file that is there but malformed still throws.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { readDataFile } from "./load.js";

/** The optional peer packages whose data files the rules read. */
export type OptionalPackage = "reforged-ts" | "reforged-types";

/** A data file published by an optional package. */
export interface OptionalDataFile<T> {
  /** The package that publishes it. */
  readonly package: OptionalPackage;
  /** Its path inside the package (`migration/renames.json`). */
  readonly path: string;
  /** The shape check, as for the plugin's own files. */
  readonly parse: (json: unknown, file: string) => T;
}

/** An optional file that could not be read, and why, for the warning. */
export interface Unavailable {
  readonly package: OptionalPackage;
  /** What happened, naming the package: `reforged-ts is not installed in /map ...`. */
  readonly reason: string;
}

export type OptionalResult<T> =
  | { readonly available: true; readonly value: T }
  | { readonly available: false; readonly unavailable: Unavailable };

/**
 * The directory of a package as Node finds it from `projectRoot`: the first
 * `node_modules/<name>` with a package.json, walking up to the file system
 * root. It does not go through the package's `exports`, which may not list
 * its data files.
 */
export function findPackageDirectory(
  projectRoot: string,
  name: string,
): string | undefined {
  let directory = path.resolve(projectRoot);
  for (;;) {
    const candidate = path.join(directory, "node_modules", name);
    if (existsSync(path.join(candidate, "package.json"))) {
      return candidate;
    }
    const parent = path.dirname(directory);
    if (parent === directory) {
      return undefined;
    }
    directory = parent;
  }
}

function versionOf(packageDirectory: string): string {
  try {
    const { version } = JSON.parse(
      readFileSync(path.join(packageDirectory, "package.json"), "utf8"),
    ) as { version?: unknown };
    return typeof version === "string" ? `@${version}` : "";
  } catch {
    return "";
  }
}

/**
 * Reads an optional package's data file. `override` is a path read instead
 * of the installed file (the tests); it must exist. Throws a DataFileError
 * when the file is there with an unexpected shape.
 */
export function readOptionalDataFile<T>(
  spec: OptionalDataFile<T>,
  projectRoot: string,
  override?: string,
): OptionalResult<T> {
  if (override !== undefined) {
    return { available: true, value: readDataFile(override, spec.parse) };
  }
  const directory = findPackageDirectory(projectRoot, spec.package);
  if (directory === undefined) {
    return {
      available: false,
      unavailable: {
        package: spec.package,
        reason: `${spec.package} is not installed in ${path.resolve(projectRoot)} (resolved from the project root)`,
      },
    };
  }
  const file = path.join(directory, spec.path);
  if (!existsSync(file)) {
    return {
      available: false,
      unavailable: {
        package: spec.package,
        reason: `${spec.package}${versionOf(directory)} in ${directory} does not publish ${spec.path}`,
      },
    };
  }
  return { available: true, value: readDataFile(file, spec.parse) };
}
