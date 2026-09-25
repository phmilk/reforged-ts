/**
 * `release:matrix`, programmatic entry point: the compatibility matrix,
 * generated from the packages and never edited by hand. Each stable release
 * appends one row (the four package versions, the game Patch, the Toolchain
 * pins, the Node floor, the 3.0.0 systems covered, the cut date and the docs
 * version URL) to a committed JSON file, from which two Markdown tables are
 * rendered: one for the docs site's compatibility page and one fragment the
 * Template's sync workflow splices into its README. The version step runs it
 * right after `changeset version`, so the Version Packages pull request
 * shows the row. The shape of the JSON file is documented in
 * `docs/release.md` and is stable.
 *
 * This module builds the rows. The shapes are in `matrix-model.ts`, the
 * rendering of the files in `matrix-render.ts` and the reading of the
 * workspace in `matrix-inputs.ts`; all three are re-exported here.
 */
import { checkPatches } from "./check-patches.js";
import { readMatrixInputs } from "./matrix-inputs.js";
import {
  canonicalRow,
  docsUrl,
  MATRIX_FORMAT,
  minorLabel,
  PACKAGE_FIELDS,
  releaseName,
  ROW_FIELDS,
  SYSTEMS_FILE,
  TOOLCHAIN,
  type Matrix,
  type MatrixInput,
  type MatrixRow,
  type PackageField,
  type SystemsList,
  type ToolchainField,
} from "./matrix-model.js";
import { render } from "./matrix-render.js";
import { LIBRARY_PACKAGE, ROW_PACKAGES } from "./packages.js";
import { isPrerelease, parseSemver } from "./semver.js";

export * from "./matrix-inputs.js";
export * from "./matrix-model.js";
export * from "./matrix-render.js";

/** Why the generator fails; `message` says it in one line. */
export interface MatrixProblem {
  kind:
    | "patch-check"
    | "missing-package"
    | "invalid-version"
    | "prerelease-package"
    | "missing-toolchain"
    | "invalid-node-floor"
    | "missing-systems"
    | "changed-row";
  message: string;
}

export type MatrixResult =
  | {
      ok: true;
      /**
       * `appended`: a new row; `unchanged`: the release already has its
       * row; `skipped`: a prerelease, which never produces a row.
       */
      status: "appended" | "unchanged" | "skipped";
      /** The release's row, `null` when skipped. */
      row: MatrixRow | null;
      /** Why no row, for `skipped`. */
      reason: string | null;
      matrix: Matrix;
      /** Every generated file, by path relative to the repository root. */
      files: Map<string, string>;
    }
  | { ok: false; problems: MatrixProblem[] };

const NODE_FLOOR = /^>=\s*v?(\d+(?:\.\d+){0,2})$/;

/** Orders two `major.minor` labels numerically. */
function compareMinors(a: string, b: string): number {
  const [aMajor = 0, aMinor = 0] = a.split(".").map(Number);
  const [bMajor = 0, bMinor = 0] = b.split(".").map(Number);
  return aMajor - bMajor || aMinor - bMinor;
}

/**
 * The 3.0.0 systems a library minor covers: the ones it adds and the ones
 * every earlier minor added.
 */
function coveredSystems(systems: SystemsList, minor: string): string[] {
  const covered: string[] = [];
  const labels = Object.keys(systems)
    .filter((label) => compareMinors(label, minor) <= 0)
    .sort(compareMinors);
  for (const label of labels) {
    for (const system of systems[label] ?? []) {
      if (!covered.includes(system)) covered.push(system);
    }
  }
  return covered;
}

/** The fields but the cut date on which two rows of one release differ. */
function differences(committed: MatrixRow, current: MatrixRow): string[] {
  return ROW_FIELDS.filter((field) => field !== "cutDate")
    .filter(
      (field) =>
        JSON.stringify(committed[field]) !== JSON.stringify(current[field]),
    )
    .map(
      (field) =>
        `${field} ${JSON.stringify(committed[field])} in the matrix, ${JSON.stringify(current[field])} now`,
    );
}

/**
 * The matrix after this version step: the committed rows, plus the row of
 * the release when the workspace holds a stable release that has none.
 * Fails when a `reforged.patch` breaks the consistency check, when the
 * systems list has no entry for the library's minor, or when the release
 * already has a row whose contents (the cut date aside) differ.
 */
export function buildMatrix(input: MatrixInput): MatrixResult {
  const problems: MatrixProblem[] = [];
  const existing = input.existing.rows.map(canonicalRow);

  const patchCheck = checkPatches({
    packages: input.packages,
    entries: input.entries,
  });
  for (const problem of patchCheck.problems) {
    problems.push({ kind: "patch-check", message: problem.message });
  }

  const versions: Partial<Record<PackageField, string>> = {};
  const prereleases: PackageField[] = [];
  for (const field of PACKAGE_FIELDS) {
    const name = ROW_PACKAGES[field];
    const pkg = input.packages.find((candidate) => candidate.name === name);
    if (pkg === undefined || pkg.manifest.private === true) {
      problems.push({
        kind: "missing-package",
        message: `No publishable package is named ${name}; a row records the version of ${Object.values(ROW_PACKAGES).join(", ")}.`,
      });
      continue;
    }
    const version = parseSemver(pkg.version);
    if (version === undefined) {
      problems.push({
        kind: "invalid-version",
        message: `${name} has version ${JSON.stringify(pkg.version)}, which is not a semver version.`,
      });
      continue;
    }
    versions[field] = pkg.version;
    if (isPrerelease(version)) prereleases.push(field);
  }
  const unreadable = problems.some(
    ({ kind }) => kind === "missing-package" || kind === "invalid-version",
  );
  // A prerelease produces no row, but still fails on its Patch fields.
  const skip = input.preMode === "pre" || prereleases.includes("library");
  if (unreadable || (skip && problems.length > 0)) {
    return { ok: false, problems };
  }

  const done = (
    status: "appended" | "unchanged" | "skipped",
    row: MatrixRow | null,
    reason: string | null,
    rows: MatrixRow[],
  ): MatrixResult => {
    const matrix: Matrix = { format: MATRIX_FORMAT, rows };
    return { ok: true, status, row, reason, matrix, files: render(matrix) };
  };

  const library = versions.library ?? "";
  if (input.preMode === "pre") {
    return done(
      "skipped",
      null,
      "Changesets is in pre mode: prerelease versions produce no row.",
      existing,
    );
  }
  if (prereleases.includes("library")) {
    return done(
      "skipped",
      null,
      `${LIBRARY_PACKAGE} ${library} is a prerelease: prerelease versions produce no row.`,
      existing,
    );
  }
  for (const field of prereleases) {
    problems.push({
      kind: "prerelease-package",
      message: `${ROW_PACKAGES[field]} is at the prerelease ${String(versions[field])} while ${LIBRARY_PACKAGE} ${library} is stable; a row holds stable versions only.`,
    });
  }

  const toolchain: Partial<Record<ToolchainField, string>> = {};
  for (const [field, name] of Object.entries(TOOLCHAIN) as [
    ToolchainField,
    string,
  ][]) {
    const pin = input.catalog[name];
    if (pin === undefined || pin === "") {
      problems.push({
        kind: "missing-toolchain",
        message: `The catalog of pnpm-workspace.yaml has no pin for ${name}, a Toolchain version the matrix records.`,
      });
    } else {
      toolchain[field] = pin;
    }
  }

  const libraryManifest = input.packages.find(
    (pkg) => pkg.name === LIBRARY_PACKAGE,
  )?.manifest;
  const engines = libraryManifest?.engines as
    Readonly<Record<string, unknown>> | undefined;
  const floor = NODE_FLOOR.exec(
    typeof engines?.node === "string" ? engines.node.trim() : "",
  )?.[1];
  if (floor === undefined) {
    problems.push({
      kind: "invalid-node-floor",
      message: `${LIBRARY_PACKAGE} has engines.node ${JSON.stringify(engines?.node)}; the matrix reads the Node floor from a range of the form ">=22.13".`,
    });
  }

  const minor = minorLabel(library);
  if (!(minor in input.systems)) {
    problems.push({
      kind: "missing-systems",
      message: `${SYSTEMS_FILE} has no entry for ${LIBRARY_PACKAGE} ${minor}; add "${minor}" with the 3.0.0 systems it adds (an empty list when none).`,
    });
  }
  if (problems.length > 0) return { ok: false, problems };

  const row = canonicalRow({
    library,
    typings: versions.typings ?? "",
    harness: versions.harness ?? "",
    plugin: versions.plugin ?? "",
    patch:
      patchCheck.patches.find(({ name }) => name === LIBRARY_PACKAGE)?.patch ??
      "",
    typescript: toolchain.typescript ?? "",
    typescriptToLua: toolchain.typescriptToLua ?? "",
    luaTypes: toolchain.luaTypes ?? "",
    node: floor ?? "",
    systems: coveredSystems(input.systems, minor),
    cutDate: input.cutDate,
    docs: docsUrl(library),
  });

  const committed = existing.find((candidate) =>
    PACKAGE_FIELDS.every((field) => candidate[field] === row[field]),
  );
  if (committed !== undefined) {
    const changed = differences(committed, row);
    if (changed.length > 0) {
      return {
        ok: false,
        problems: [
          {
            kind: "changed-row",
            message: `The matrix already has a row for ${releaseName(row)} (cut ${committed.cutDate}) with other contents: ${changed.join("; ")}. Rows are only ever appended; a change to them ships in a new release.`,
          },
        ],
      };
    }
    return done("unchanged", committed, null, existing);
  }
  return done("appended", row, null, [...existing, row]);
}

/** Reads the workspace at `root` and builds its matrix. */
export async function generateMatrix(
  root: string,
  now: Date,
): Promise<MatrixResult> {
  return buildMatrix(await readMatrixInputs(root, now));
}
