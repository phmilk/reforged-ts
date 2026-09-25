/**
 * `release:check-patches`, programmatic entry point: whether the Patch
 * declarations of the publishable packages agree with one another. Every
 * publishable package declares, in the `reforged.patch` field of its
 * `package.json`, the game Patch it supports; the check asserts that each one
 * names a Patch the Typings ship an entry for, and that the library's equals
 * the newest of them (the library pins the newest Patch it supports). The
 * compatibility matrix generator runs it before writing a row, CI on every
 * pull request.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { compareBuilds, gameVersion, isBuild } from "./build.js";
import { LIBRARY_PACKAGE, TYPINGS_PACKAGE } from "./packages.js";
import { errorMessage, isRecord } from "./unknown.js";
import {
  readPublishablePackages,
  type PackageManifest,
  type PublishablePackage,
} from "./workspace.js";

/**
 * One Patch the Typings ship an entry for: the Game version folder
 * (`3.0.0/`) and the Build it is generated from, as its `manifest.json`
 * records it.
 */
export interface TypingsEntry {
  gameVersion: string;
  patch: string;
}

export interface PatchCheckInput {
  /** The publishable packages; a private one is skipped. */
  packages: readonly Pick<PublishablePackage, "name" | "manifest">[];
  /** The Patches the Typings ship an entry for, in any order. */
  entries: readonly TypingsEntry[];
}

/** Why the check fails; `message` says it in one line, naming the values. */
export type PatchProblem = { message: string } & (
  | {
      /** The package has no `reforged.patch`. */
      kind: "missing-field";
      package: string;
    }
  | {
      /** The package's `reforged.patch` is not a Build. */
      kind: "invalid-field";
      package: string;
      value: unknown;
    }
  | {
      /** The package names a Patch the Typings ship no entry for. */
      kind: "unknown-patch";
      package: string;
      patch: string;
    }
  | {
      /** The library's Patch is not the Typings' newest. */
      kind: "library-not-newest";
      package: string;
      patch: string;
      newest: string;
    }
  | {
      /** No publishable package is the library. */
      kind: "missing-library";
      package: string;
    }
  | {
      /** The Typings ship an entry for no Patch at all. */
      kind: "no-typings-entries";
    }
);

export interface PatchCheckResult {
  /** Passes when there is no problem. */
  ok: boolean;
  /**
   * Each publishable package's `reforged.patch`, in the order of the input;
   * `null` when the field is missing or not a Build.
   */
  patches: { name: string; patch: string | null }[];
  /** The newest Patch the Typings ship an entry for; `null` for none. */
  newest: string | null;
  problems: PatchProblem[];
}

/** The `reforged.patch` of a manifest, `undefined` when it has none. */
function declaredPatch(manifest: PackageManifest): unknown {
  const reforged = manifest.reforged;
  return isRecord(reforged) ? reforged.patch : undefined;
}

const listed = (patches: readonly string[]) =>
  patches.length === 0 ? "none" : patches.join(", ");

/** Checks the `reforged.patch` of every publishable package. */
export function checkPatches(input: PatchCheckInput): PatchCheckResult {
  const shipped = [...new Set(input.entries.map((entry) => entry.patch))].sort(
    compareBuilds,
  );
  const newest = shipped.at(-1) ?? null;
  const problems: PatchProblem[] = [];
  if (newest === null) {
    problems.push({
      kind: "no-typings-entries",
      message: `${TYPINGS_PACKAGE} ships an entry for no Patch, so no reforged.patch can name one.`,
    });
  }

  const patches: PatchCheckResult["patches"] = [];
  for (const { name, manifest } of input.packages) {
    if (manifest.private === true) continue;
    const value = declaredPatch(manifest);
    if (value === undefined) {
      problems.push({
        kind: "missing-field",
        package: name,
        message: `${name} has no reforged.patch in its package.json; set it to the Patch it supports (${TYPINGS_PACKAGE} ships: ${listed(shipped)}).`,
      });
      patches.push({ name, patch: null });
      continue;
    }
    if (!isBuild(value)) {
      problems.push({
        kind: "invalid-field",
        package: name,
        value,
        message: `${name} has reforged.patch ${JSON.stringify(value)}, which is not a Build such as 3.0.0.24268.`,
      });
      patches.push({ name, patch: null });
      continue;
    }
    patches.push({ name, patch: value });
    if (newest !== null && !shipped.includes(value)) {
      problems.push({
        kind: "unknown-patch",
        package: name,
        patch: value,
        message: `${name} has reforged.patch ${value}, a Patch ${TYPINGS_PACKAGE} ships no entry for (it ships: ${listed(shipped)}).`,
      });
    }
    if (name === LIBRARY_PACKAGE && newest !== null && value !== newest) {
      problems.push({
        kind: "library-not-newest",
        package: name,
        patch: value,
        newest,
        message: `${name} has reforged.patch ${value}, but the newest Patch ${TYPINGS_PACKAGE} ships an entry for is ${newest}; the library pins the newest Patch it supports.`,
      });
    }
  }

  if (!patches.some((pkg) => pkg.name === LIBRARY_PACKAGE)) {
    problems.push({
      kind: "missing-library",
      package: LIBRARY_PACKAGE,
      message: `No publishable package is named ${LIBRARY_PACKAGE}, so the library's Patch cannot be compared with the newest Patch of ${TYPINGS_PACKAGE}.`,
    });
  }

  return { ok: problems.length === 0, patches, newest, problems };
}

/** Inputs the check cannot read, naming the file or package at fault. */
export class PatchInputError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "PatchInputError";
  }
}

const GAME_VERSION = /^\d+\.\d+\.\d+$/;

/**
 * The Patches the Typings in the folder `dir` ship an entry for: one per
 * Game version folder (`3.0.0/`), read from the `patch` of its
 * `manifest.json`, in Build order. Throws a `PatchInputError` when a folder
 * has no manifest or its `patch` is not a Build of that Game version.
 */
export async function readTypingsEntries(dir: string): Promise<TypingsEntry[]> {
  const folders = (await readdir(dir, { withFileTypes: true }))
    .filter((item) => item.isDirectory() && GAME_VERSION.test(item.name))
    .map((item) => item.name);
  const entries: TypingsEntry[] = [];
  for (const folder of folders) {
    const file = join(dir, folder, "manifest.json");
    let patch: unknown;
    try {
      const manifest = JSON.parse(await readFile(file, "utf8")) as unknown;
      patch = isRecord(manifest) ? manifest.patch : undefined;
    } catch (error) {
      throw new PatchInputError(`${file}: ${errorMessage(error)}`, {
        cause: error,
      });
    }
    if (!isBuild(patch) || gameVersion(patch) !== folder) {
      throw new PatchInputError(
        `${file}: patch is ${JSON.stringify(patch)}, not a Build of Game version ${folder}.`,
      );
    }
    entries.push({ gameVersion: folder, patch });
  }
  return entries.sort((a, b) => compareBuilds(a.patch, b.patch));
}

/**
 * The inputs of `checkPatches` for the workspace at `root`: its publishable
 * packages and the entries of the Typings among them. Throws a
 * `PatchInputError` when no publishable package is the Typings.
 */
export async function readPatchInputs(
  root: string,
): Promise<{ packages: PublishablePackage[]; entries: TypingsEntry[] }> {
  const all = await readPublishablePackages(root);
  const typings = all.find((pkg) => pkg.name === TYPINGS_PACKAGE);
  if (typings === undefined) {
    throw new PatchInputError(
      `No publishable package is named ${TYPINGS_PACKAGE} in ${root}, so no Patch has an entry.`,
    );
  }
  return {
    packages: all,
    entries: await readTypingsEntries(typings.absoluteDir),
  };
}
