/**
 * The shapes of the Overlay entries, one per kind folder, as the generator
 * holds them once read. Each shape adds its own facts to the fields every
 * entry carries.
 */
import type { SourceName } from "./model.js";

/** The only `origin` an entry may name: seeded from war3-types-strict. */
export const SEED_ORIGIN = "war3-types-strict";

/** The fields every entry carries, whatever its kind. */
export interface BaseEntry {
  /** Path relative to the Overlay folder, `/`-separated. */
  file: string;
  name: string;
  source: SourceName;
  deprecated?: string;
  /** Rendered as `@remarks`. */
  notes?: string;
}

/** A function or global entry: it also records when and how it came. */
export interface TrackedEntry extends BaseEntry {
  /** The Build that introduced the declaration; rendered as `@patch`. */
  since?: string;
  /** Absent for hand-written entries. */
  origin?: typeof SEED_ORIGIN;
}

export interface OverlayParam {
  name: string;
  nullable: boolean;
  /** TypeScript type text that replaces the parameter's mapped Jass type. */
  type?: string;
}

/** A function's entry, mandatory for every `native` and `function`. */
export interface FunctionEntry extends TrackedEntry {
  returns: { nullable: boolean };
  params: OverlayParam[];
  /** The value is only valid for the local player; `false` when absent. */
  async: boolean;
}

/**
 * A global's entry, mandatory for every global. It has no `returns` or
 * `params`: `nullable` is the global's own nullability, and for an array the
 * nullability of its elements.
 */
export interface GlobalEntry extends TrackedEntry {
  nullable: boolean;
}

/** A type's optional entry: the base fields only. */
export type TypeEntry = BaseEntry;
