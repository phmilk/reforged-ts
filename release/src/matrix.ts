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
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  checkPatches,
  LIBRARY_PACKAGE,
  readPatchInputs,
  TYPINGS_PACKAGE,
  type TypingsEntry,
} from "./check-patches.js";
import type { PublishablePackage } from "./workspace.js";

/** The test harness. */
export const HARNESS_PACKAGE = "reforged-test";

/** The lint plugin. */
export const PLUGIN_PACKAGE = "eslint-plugin-reforged";

/** The committed matrix, relative to the repository root. */
export const MATRIX_FILE = "release/compatibility/matrix.json";

/**
 * The declared list of the 3.0.0 systems each library minor adds, relative
 * to the repository root. The maintainer extends it when a tier ships.
 */
export const SYSTEMS_FILE = "release/compatibility/systems.json";

/**
 * The README fragment the Template's sync workflow fetches from `master`
 * (`https://raw.githubusercontent.com/phmilk/reforged-ts/master/release/compatibility/matrix.md`).
 */
export const FRAGMENT_FILE = "release/compatibility/matrix.md";

/**
 * The table of the docs site's compatibility page: a partial (the leading
 * underscore keeps Docusaurus from making it a page) the page imports.
 */
export const SITE_TABLE_FILE = "website/docs/compatibility/_matrix.mdx";

/**
 * Where the docs of a library version live: the docs site's base followed
 * by the docs version label, the library's `major.minor` (#40).
 */
export const DOCS_BASE_URL = "https://phmilk.github.io/reforged-ts/docs";

/** The version of the JSON file's shape; bumped only when it breaks. */
export const MATRIX_FORMAT = 1;

/** The Toolchain pins a row records, by row field, as catalog names. */
export const TOOLCHAIN = {
  typescript: "typescript",
  typescriptToLua: "typescript-to-lua",
  luaTypes: "lua-types",
} as const;

type ToolchainField = keyof typeof TOOLCHAIN;

/** One stable release: the row of the matrix. */
export interface MatrixRow {
  /** `reforged-ts`'s version. */
  library: string;
  /** `reforged-types`'s version. */
  typings: string;
  /** `reforged-test`'s version. */
  harness: string;
  /** `eslint-plugin-reforged`'s version. */
  plugin: string;
  /** The game Patch, a Build: the library's `reforged.patch`. */
  patch: string;
  /** The catalog pins: TypeScript exact, the others as ranges. */
  typescript: string;
  typescriptToLua: string;
  luaTypes: string;
  /** The Node floor of the library's `engines.node` (`22.13`). */
  node: string;
  /** The 3.0.0 systems the library covers, in the order declared. */
  systems: string[];
  /** The day the version step ran, `YYYY-MM-DD` (UTC). */
  cutDate: string;
  /** The docs of the library's `major.minor`. */
  docs: string;
}

/** The committed JSON file. */
export interface Matrix {
  format: typeof MATRIX_FORMAT;
  /** Oldest first; only ever appended. */
  rows: MatrixRow[];
}

/** The 3.0.0 systems each library minor (`1.0`) adds, in declared order. */
export type SystemsList = Readonly<Record<string, readonly string[]>>;

export interface MatrixInput {
  /** The publishable packages. */
  packages: readonly Pick<
    PublishablePackage,
    "name" | "version" | "manifest"
  >[];
  /** The Patches the Typings ship an entry for. */
  entries: readonly TypingsEntry[];
  /** The workspace catalog of `pnpm-workspace.yaml`. */
  catalog: Readonly<Partial<Record<string, string>>>;
  /** Whether Changesets is in pre mode (`.changeset/pre.json`). */
  preMode: boolean;
  systems: SystemsList;
  /** The committed matrix. */
  existing: Matrix;
  /** The day the version step runs, `YYYY-MM-DD`. */
  cutDate: string;
}

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

const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const PRERELEASE = /^\d+\.\d+\.\d+-/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MINOR = /^(\d+)\.(\d+)$/;
const NODE_FLOOR = /^>=\s*v?(\d+(?:\.\d+){0,2})$/;

/** A row's fields, in the order the file writes them. */
const ROW_FIELDS = [
  "library",
  "typings",
  "harness",
  "plugin",
  "patch",
  "typescript",
  "typescriptToLua",
  "luaTypes",
  "node",
  "systems",
  "cutDate",
  "docs",
] as const satisfies readonly (keyof MatrixRow)[];

/** The four packages of a row, by row field. */
const ROW_PACKAGES = {
  library: LIBRARY_PACKAGE,
  typings: TYPINGS_PACKAGE,
  harness: HARNESS_PACKAGE,
  plugin: PLUGIN_PACKAGE,
} as const;

type PackageField = keyof typeof ROW_PACKAGES;

const PACKAGE_FIELDS = Object.keys(ROW_PACKAGES) as PackageField[];

/** The same row with its fields in the file's order. */
function canonicalRow(row: MatrixRow): MatrixRow {
  return {
    library: row.library,
    typings: row.typings,
    harness: row.harness,
    plugin: row.plugin,
    patch: row.patch,
    typescript: row.typescript,
    typescriptToLua: row.typescriptToLua,
    luaTypes: row.luaTypes,
    node: row.node,
    systems: [...row.systems],
    cutDate: row.cutDate,
    docs: row.docs,
  };
}

/** A library version's or minor's `major.minor` label. */
function minorLabel(version: string): string {
  return version.split(".").slice(0, 2).join(".");
}

/** Orders two `major.minor` labels numerically. */
function compareMinors(a: string, b: string): number {
  const [aMajor = 0, aMinor = 0] = a.split(".").map(Number);
  const [bMajor = 0, bMinor = 0] = b.split(".").map(Number);
  return aMajor - bMajor || aMinor - bMinor;
}

/** The docs version URL of a library version: its `major.minor` label. */
export function docsUrl(libraryVersion: string): string {
  return `${DOCS_BASE_URL}/${minorLabel(libraryVersion)}`;
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

const releaseName = (row: Pick<MatrixRow, PackageField>) =>
  PACKAGE_FIELDS.map((field) => `${ROW_PACKAGES[field]} ${row[field]}`).join(
    ", ",
  );

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
    if (!VERSION.test(pkg.version)) {
      problems.push({
        kind: "invalid-version",
        message: `${name} has version ${JSON.stringify(pkg.version)}, which is not a semver version.`,
      });
      continue;
    }
    versions[field] = pkg.version;
    if (PRERELEASE.test(pkg.version)) prereleases.push(field);
  }
  const unreadable = problems.some(
    ({ kind }) => kind === "missing-package" || kind === "invalid-version",
  );
  // A prerelease produces no row, but still fails on its Patch fields.
  const skip = input.preMode || prereleases.includes("library");
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
  if (input.preMode) {
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

/** Escapes what Markdown and MDX would read as markup in a table cell. */
function cell(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("|", "\\|")
    .replaceAll("<", "&lt;")
    .replaceAll("{", "&#123;")
    .replaceAll("}", "&#125;");
}

const HEADERS = [
  LIBRARY_PACKAGE,
  TYPINGS_PACKAGE,
  HARNESS_PACKAGE,
  PLUGIN_PACKAGE,
  "Patch",
  "TypeScript",
  "typescript-to-lua",
  "lua-types",
  "Node",
  "3.0.0 systems",
  "Cut",
  "Docs",
];

/** The table, newest release first; columns padded to their widest cell. */
function table(rows: readonly MatrixRow[]): string {
  const body = [...rows]
    .reverse()
    .map((row) => [
      row.library,
      row.typings,
      row.harness,
      row.plugin,
      row.patch,
      row.typescript,
      row.typescriptToLua,
      row.luaTypes,
      `${row.node} or later`,
      row.systems.length === 0 ? "none" : row.systems.join(", "),
      row.cutDate,
      `[${row.docs.slice(row.docs.lastIndexOf("/") + 1)}](${row.docs})`,
    ]);
  const lines = [HEADERS, ...body].map((cells) => cells.map(cell));
  const widths = HEADERS.map((_, column) =>
    Math.max(3, ...lines.map((cells) => (cells[column] ?? "").length)),
  );
  const line = (cells: readonly string[]) =>
    `| ${cells.map((text, column) => text + " ".repeat((widths[column] ?? 0) - text.length)).join(" | ")} |\n`;
  const [header = [], ...others] = lines;
  return (
    line(header) +
    line(widths.map((width) => "-".repeat(width))) +
    others.map(line).join("")
  );
}

const EMPTY =
  "No stable release yet. During the build phase the packages are published as `1.0.0-alpha.N` under the `next` dist-tag.\n";

const GENERATED = `Generated by \`pnpm release:matrix\` from ${MATRIX_FILE}; do not edit.`;

/** The three generated files of a matrix, by path. */
export function render(matrix: Matrix): Map<string, string> {
  const rows = matrix.rows.map(canonicalRow);
  const content = rows.length === 0 ? EMPTY : table(rows);
  return new Map([
    [
      MATRIX_FILE,
      `${JSON.stringify({ format: MATRIX_FORMAT, rows }, null, 2)}\n`,
    ],
    [FRAGMENT_FILE, `<!-- ${GENERATED} -->\n\n${content}`],
    [SITE_TABLE_FILE, `{/* ${GENERATED} */}\n\n${content}`],
  ]);
}

/** Inputs the generator cannot read, naming the file at fault. */
export class MatrixInputError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MatrixInputError";
  }
}

/**
 * The `catalog:` map of a `pnpm-workspace.yaml`: the top-level `catalog`
 * key's entries, one `name: specifier` per line, quotes and comments
 * dropped. Only the flat form the workspace uses is read.
 */
export function parseCatalog(yaml: string): Record<string, string> {
  const catalog: Record<string, string> = {};
  const lines = yaml.split(/\r?\n/);
  const start = lines.findIndex((line) => /^catalog:\s*(#.*)?$/.test(line));
  if (start === -1) return catalog;
  const entry =
    /^\s+(?:"([^"]+)"|'([^']+)'|([^\s:#"']+)):\s*(?:"([^"]*)"|'([^']*)'|([^\s#]+))\s*(?:#.*)?$/;
  for (const line of lines.slice(start + 1)) {
    if (/^\s*(#.*)?$/.test(line)) continue;
    if (!/^\s/.test(line)) break;
    const match = entry.exec(line);
    if (match === null) continue;
    const groups: (string | undefined)[] = match.slice(1);
    const name = groups[0] ?? groups[1] ?? groups[2] ?? "";
    catalog[name] = groups[3] ?? groups[4] ?? groups[5] ?? "";
  }
  return catalog;
}

/**
 * The parsed JSON file at `path` under `root`; `missing` when there is no
 * such file.
 */
async function readJson(
  root: string,
  path: string,
  missing?: unknown,
): Promise<unknown> {
  let text: string;
  try {
    text = await readFile(join(root, path), "utf8");
  } catch (error) {
    if (
      missing !== undefined &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return missing;
    }
    throw new MatrixInputError(
      `${path}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new MatrixInputError(
      `${path}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

/** The systems list of `systems.json`: `{ "minors": { "1.0": [...] } }`. */
export function parseSystems(value: unknown): SystemsList {
  const minors = isRecord(value) ? value.minors : undefined;
  if (!isRecord(minors)) {
    throw new MatrixInputError(
      `${SYSTEMS_FILE}: expected { "minors": { "<major>.<minor>": [<3.0.0 system>, ...] } }.`,
    );
  }
  for (const [label, systems] of Object.entries(minors)) {
    if (!MINOR.test(label) || !isStringList(systems)) {
      throw new MatrixInputError(
        `${SYSTEMS_FILE}: "${label}" must be a library minor such as "1.0" listing the 3.0.0 systems it adds as strings.`,
      );
    }
  }
  return minors as SystemsList;
}

/** The committed matrix, validated field by field. */
export function parseMatrix(value: unknown): Matrix {
  const invalid = (why: string) =>
    new MatrixInputError(`${MATRIX_FILE}: ${why}`);
  if (!isRecord(value) || value.format !== MATRIX_FORMAT) {
    throw invalid(
      `expected { "format": ${String(MATRIX_FORMAT)}, "rows": [...] }.`,
    );
  }
  if (!Array.isArray(value.rows)) throw invalid(`"rows" must be an array.`);
  const rows = value.rows.map((row: unknown, index): MatrixRow => {
    if (!isRecord(row)) throw invalid(`row ${String(index)} is not an object.`);
    for (const field of ROW_FIELDS) {
      const ok =
        field === "systems"
          ? isStringList(row[field])
          : typeof row[field] === "string";
      if (!ok) throw invalid(`row ${String(index)} has no valid "${field}".`);
    }
    const typed = row as unknown as MatrixRow;
    if (!DATE.test(typed.cutDate)) {
      throw invalid(
        `row ${String(index)} has cutDate ${typed.cutDate}, not YYYY-MM-DD.`,
      );
    }
    return canonicalRow(typed);
  });
  return { format: MATRIX_FORMAT, rows };
}

/** Changesets' pre mode state, relative to the repository root. */
export const PRE_STATE_FILE = ".changeset/pre.json";

/** Whether a pre state (`{ "mode": "pre", "tag": "alpha" }`) is in pre mode. */
const isPreMode = (state: unknown): boolean =>
  isRecord(state) && state.mode === "pre";

/** The date of `now` as a cut date, `YYYY-MM-DD` in UTC. */
export function cutDateOf(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * The inputs of `buildMatrix` for the workspace at `root`, with the cut
 * date of `now`. A missing matrix file is an empty matrix; a missing
 * systems list is an error.
 */
export async function readMatrixInputs(
  root: string,
  now: Date,
): Promise<MatrixInput> {
  const { packages, entries } = await readPatchInputs(root);
  let yaml: string;
  try {
    yaml = await readFile(join(root, "pnpm-workspace.yaml"), "utf8");
  } catch (error) {
    throw new MatrixInputError(
      `pnpm-workspace.yaml: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  return {
    packages,
    entries,
    catalog: parseCatalog(yaml),
    preMode: isPreMode(await readJson(root, PRE_STATE_FILE, {})),
    systems: parseSystems(await readJson(root, SYSTEMS_FILE)),
    // No matrix yet: the first stable release writes it.
    existing: parseMatrix(
      await readJson(root, MATRIX_FILE, { format: MATRIX_FORMAT, rows: [] }),
    ),
    cutDate: cutDateOf(now),
  };
}

/** Reads the workspace at `root` and builds its matrix. */
export async function generateMatrix(
  root: string,
  now: Date,
): Promise<MatrixResult> {
  return buildMatrix(await readMatrixInputs(root, now));
}
