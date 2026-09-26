/**
 * The report's view of the per-Patch manifest `reforged-types` writes: the
 * common.j Natives with their Jass types, and the Jass types the manifest
 * names. Blizzard.j functions are never mirrored and common.ai is outside
 * the coverage rule, so neither is read.
 */
import { InputError, isRecord } from "./input-error.js";

export interface Param {
  name: string;
  type: string;
}

export interface Native {
  name: string;
  params: Param[];
  returns: string;
}

export interface Manifest {
  /** The Build the manifest describes. */
  patch: string;
  /** The common.j Natives, in source order. */
  natives: Native[];
  /** Every Jass type a parameter, a return or a global of any source names. */
  types: Set<string>;
}

/** The Jass types that are not handles; every other type extends `handle`. */
const NOT_HANDLES = new Set([
  "integer",
  "real",
  "boolean",
  "string",
  "code",
  "nothing",
]);

export function isHandleType(type: string): boolean {
  return !NOT_HANDLES.has(type);
}

/** The Native as its Jass declaration reads, without the keyword. */
export function signature({ name, params, returns }: Native): string {
  const takes =
    params.length === 0
      ? "nothing"
      : params.map((param) => `${param.type} ${param.name}`).join(", ");
  return `${name} takes ${takes} returns ${returns}`;
}

const isString = (value: unknown): value is string => typeof value === "string";

function readParam(value: unknown): Param | undefined {
  if (!isRecord(value) || !isString(value.name) || !isString(value.type)) {
    return undefined;
  }
  return { name: value.name, type: value.type };
}

/** The manifest from its parsed JSON; throws an `InputError` when malformed. */
export function readManifest(json: unknown): Manifest {
  const malformed = (detail: string) =>
    new InputError(`The manifest is malformed: ${detail}.`);
  if (!isRecord(json) || !isString(json.patch) || !Array.isArray(json.entries))
    throw malformed("expected an object with `patch` and `entries`");

  const natives: Native[] = [];
  const types = new Set<string>();
  for (const entry of json.entries as unknown[]) {
    if (!isRecord(entry) || !isString(entry.name) || !isString(entry.kind))
      throw malformed("an entry has no `name` or `kind`");
    if (entry.kind === "global") {
      if (!isString(entry.type))
        throw malformed(`the global ${entry.name} has no type`);
      types.add(entry.type);
      continue;
    }
    const params = Array.isArray(entry.params)
      ? (entry.params as unknown[]).map(readParam)
      : [undefined];
    const returns = isRecord(entry.returns) ? entry.returns.type : undefined;
    if (!isString(returns) || !params.every((param) => param !== undefined))
      throw malformed(`the function ${entry.name} has no parameters or return`);
    types.add(returns);
    for (const param of params) types.add(param.type);
    if (entry.source === "common.j" && entry.kind === "native")
      natives.push({ name: entry.name, params, returns });
  }
  return { patch: json.patch, natives, types };
}
