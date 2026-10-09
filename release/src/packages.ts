/**
 * The names of the publishable packages a release script treats apart from
 * the others. This is the one module that names a package: every other
 * script imports its names from here, and finds the rest of the workspace
 * through `workspace.ts`.
 */

/**
 * The library. Its version names the Template ref, its majors need a
 * migration page, and its `reforged.patch` must be the Typings' newest.
 */
export const LIBRARY_PACKAGE = "reforged-ts";

/** The Typings, whose Game version folders list the supported Patches. */
export const TYPINGS_PACKAGE = "reforged-types";

/** The test harness. */
export const HARNESS_PACKAGE = "reforged-test";

/** The lint plugin. */
export const PLUGIN_PACKAGE = "eslint-plugin-reforged";

/**
 * The map folder reader, which a Map project's build calls to generate its
 * code. It came after the first four, and the Template takes it up after
 * its first release (phmilk/reforged-ts-template#68).
 */
export const MAP_PACKAGE = "reforged-map";

/**
 * The Built-in objects of each Patch (ADR 0013), private until its release;
 * the major-changeset gate covers its majors too.
 */
export const BUILTINS_PACKAGE = "reforged-builtins";

/**
 * The five packages of a compatibility matrix row, by row field, in matrix
 * order: the order of the row's fields, the tables' columns and the
 * Template dispatch's tag.
 */
export const ROW_PACKAGES = {
  library: LIBRARY_PACKAGE,
  typings: TYPINGS_PACKAGE,
  harness: HARNESS_PACKAGE,
  plugin: PLUGIN_PACKAGE,
  map: MAP_PACKAGE,
} as const;
