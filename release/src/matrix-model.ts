/**
 * The compatibility matrix's shapes, shared by its three jobs: the files it
 * reads and writes, a row and the matrix, and the inputs of a version step.
 * `matrix.ts` builds the rows, `matrix-render.ts` renders the files and
 * `matrix-inputs.ts` reads the workspace.
 */
import type { PreMode } from "./changesets.js";
import type { TypingsEntry } from "./check-patches.js";
import { ROW_PACKAGES } from "./packages.js";
import type { PublishablePackage } from "./workspace.js";

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

export type ToolchainField = keyof typeof TOOLCHAIN;

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
  /**
   * The pre state of `.changeset/pre.json`: only `pre` produces
   * prereleases; an exited pre mode releases stable versions.
   */
  preMode: PreMode;
  systems: SystemsList;
  /** The committed matrix. */
  existing: Matrix;
  /** The day the version step runs, `YYYY-MM-DD`. */
  cutDate: string;
}

/** A row's fields, in the order the file writes them. */
export const ROW_FIELDS = [
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

export type PackageField = keyof typeof ROW_PACKAGES;

export const PACKAGE_FIELDS = Object.keys(ROW_PACKAGES) as PackageField[];

/** The same row with its fields in the file's order. */
export function canonicalRow(row: MatrixRow): MatrixRow {
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
export function minorLabel(version: string): string {
  return version.split(".").slice(0, 2).join(".");
}

/** The docs version URL of a library version: its `major.minor` label. */
export function docsUrl(libraryVersion: string): string {
  return `${DOCS_BASE_URL}/${minorLabel(libraryVersion)}`;
}

/** The four packages of a row and their versions, for messages. */
export const releaseName = (row: Pick<MatrixRow, PackageField>) =>
  PACKAGE_FIELDS.map((field) => `${ROW_PACKAGES[field]} ${row[field]}`).join(
    ", ",
  );
