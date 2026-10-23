// What the authoring entry (object-definitions.ts) records of each
// definition and localized value it makes, kept out of the values it
// returns, which stay opaque. The loader reads it back. Not exported from
// the package.

import type { ObjectKind } from "./model.js";

/** A field the metadata does not know, set through the raw escape, as the author gave it. */
export interface RawFieldRecord {
  readonly field: unknown;
  readonly type: unknown;
  readonly level?: unknown;
  readonly dataPointer?: unknown;
  readonly value: unknown;
}

/** A definition, as the author gave it to a `define<Kind>` call: nothing checked yet. */
export interface DefinitionRecord {
  readonly kind: ObjectKind;
  readonly rawcode: unknown;
  readonly base: unknown;
  /** Whether the author gave a base: a Custom object's definition. */
  readonly custom: boolean;
  readonly fields: Readonly<Record<string, unknown>>;
  readonly raw: readonly RawFieldRecord[];
  /** The definition file being evaluated when the `define<Kind>` call ran, when the loader ran it. */
  readonly file: string | undefined;
}

/** A localized value, as the author gave it. */
export interface LocalizedRecord {
  readonly text: unknown;
  readonly translations: Readonly<Record<string, unknown>>;
}

const definitions = new WeakMap<object, DefinitionRecord>();
const localizedValues = new WeakMap<object, LocalizedRecord>();

/** The definition files being evaluated by the loader, innermost last. */
const evaluating: string[] = [];

/** Records a definition made by a `define<Kind>` call, stamped with the file being evaluated. */
export function recordDefinition(
  value: object,
  record: Omit<DefinitionRecord, "file">,
): void {
  definitions.set(value, { ...record, file: evaluating.at(-1) });
}

/** The record of a definition, or undefined when the value is not one. */
export function definitionRecord(value: unknown): DefinitionRecord | undefined {
  return typeof value === "object" && value !== null
    ? definitions.get(value)
    : undefined;
}

/** Records a localized value made by its constructor. */
export function recordLocalized(value: object, record: LocalizedRecord): void {
  localizedValues.set(value, record);
}

/** The record of a localized value, or undefined when the value is not one. */
export function localizedRecord(value: unknown): LocalizedRecord | undefined {
  return typeof value === "object" && value !== null
    ? localizedValues.get(value)
    : undefined;
}

/** Runs `evaluate` with `file` as the definition file being evaluated. */
export function whileEvaluating<T>(file: string, evaluate: () => T): T {
  evaluating.push(file);
  try {
    return evaluate();
  } finally {
    evaluating.pop();
  }
}
