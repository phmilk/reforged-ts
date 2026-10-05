// The allowlist classification: which entry of data/local-safe.json a call,
// or an assignment to a library accessor, invokes. Names are resolved
// through the type checker, so a project function or method that shares a
// listed name is never on the list.
//
// Name forms (the ones data/local-safe.json uses):
// - a Native: a function declared in reforged-types, by its name;
// - a Lua global of lua-types (`print`), by its name;
// - an instance member of a class or interface declared in reforged-ts:
//   `Class#member`; a static member: `Class.member`;
// - `obj.prop = value` (any assignment operator) on an accessor with a setter
//   declared in reforged-ts: `Class#prop` (or `Class.prop` when static), as a
//   call to that setter (decision 4 of the #50 run).
import type { ParserServicesWithTypeInformation } from "@typescript-eslint/utils";

import type { LocalSafeEntry, LocalSafeKind } from "../data/index.js";
import { type Invocation, resolveCallee, syntacticName } from "./callee.js";

/** The packages whose global functions an allowlist name can denote. */
const globalFunctionPackages: ReadonlySet<string> = new Set([
  "reforged-types",
  "lua-types",
]);

/**
 * The allowlist name of what a call or accessor assignment invokes (see the
 * name forms above), or undefined when it invokes nothing the allowlist can
 * name: a project function, a computed member, a plain property write.
 * Asks the checker; match syntactically first (`Allowlist.kindOf` does).
 */
export function invokedName(
  services: ParserServicesWithTypeInformation,
  node: Invocation,
): string | undefined {
  return resolveCallee(services, node, globalFunctionPackages)?.name;
}

/** The allowlist of data/local-safe.json, indexed for the rules. */
export interface Allowlist {
  /** The kind of a listed name, undefined when the name is not listed. */
  kindOfName(name: string): LocalSafeKind | undefined;
  /**
   * The kind of the entry a call or accessor assignment invokes, undefined
   * when it invokes no listed entry. Matches the name syntactically, then
   * asks the checker through `invokedName`.
   */
  kindOf(
    services: ParserServicesWithTypeInformation,
    node: Invocation,
  ): LocalSafeKind | undefined;
  /** Like `kindOf`, with the resolved name (for messages). */
  entryOf(
    services: ParserServicesWithTypeInformation,
    node: Invocation,
  ): { readonly name: string; readonly kind: LocalSafeKind } | undefined;
}

/**
 * Indexes the allowlist. `extraVisual` adds names (same forms) treated as
 * `visual`, for a rule's `allow` option; a listed entry keeps its own kind.
 */
export function createAllowlist(
  entries: readonly LocalSafeEntry[],
  extraVisual: readonly string[] = [],
): Allowlist {
  const kinds = new Map<string, LocalSafeKind>();
  for (const name of extraVisual) {
    kinds.set(name, "visual");
  }
  for (const entry of entries) {
    kinds.set(entry.name, entry.kind);
  }
  // The last segment of every name, for the syntactic pre-match.
  const shortNames = new Set(
    [...kinds.keys()].map((name) => name.split(/[#.]/).pop() ?? name),
  );
  const allowlist: Allowlist = {
    kindOfName: (name) => kinds.get(name),
    kindOf: (services, node) => allowlist.entryOf(services, node)?.kind,
    entryOf(services, node) {
      const short = syntacticName(node);
      if (short === undefined || !shortNames.has(short)) {
        return undefined;
      }
      const name = invokedName(services, node);
      const kind = name === undefined ? undefined : kinds.get(name);
      return name === undefined || kind === undefined
        ? undefined
        : { name, kind };
    },
  };
  return allowlist;
}
