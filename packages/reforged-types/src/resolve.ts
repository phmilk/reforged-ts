/**
 * Matches the Patch declarations with their Overlay entries: every function
 * needs one entry whose parameters equal the Patch signature (count, order,
 * names), every global needs one entry, and a type may have one. The kind
 * folder an entry lives in decides which declarations it can match. An entry
 * that no vendored Patch declares is an orphan warning, not an error, because
 * the Overlay is shared by all vendored Patches.
 */
import { patchList } from "./build.js";
import type { Diagnostic } from "./diagnostics.js";
import type {
  BaseEntry,
  FunctionEntry,
  GlobalEntry,
  TypeEntry,
} from "./entry.js";
import {
  jassDeclaration,
  jassSignature,
  type Declaration,
  type FunctionDeclaration,
  type GlobalDeclaration,
  type TypeDeclaration,
} from "./model.js";
import {
  entryPath,
  KIND_FOLDERS,
  kindFolder,
  overlayKey,
  type Overlay,
} from "./overlay.js";

/** A function with the Overlay facts that shape its declaration. */
export interface ResolvedFunction extends FunctionDeclaration {
  overlay: FunctionEntry;
}

/** A global with its mandatory Overlay entry. */
export interface ResolvedGlobal extends GlobalDeclaration {
  overlay: GlobalEntry;
}

/** A type with its optional Overlay entry. */
export interface ResolvedType extends TypeDeclaration {
  overlay?: TypeEntry;
}

export type Resolved = ResolvedType | ResolvedFunction | ResolvedGlobal;

export interface Resolution {
  /**
   * Declarations in source order; a function or global without a usable
   * entry is left out.
   */
  declarations: Resolved[];
  diagnostics: Diagnostic[];
}

export function resolve(
  declarations: readonly Declaration[],
  overlay: Overlay
): Resolution {
  const resolved: Resolved[] = [];
  const diagnostics: Diagnostic[] = [];

  for (const declaration of declarations) {
    const key = overlayKey(declaration.source, declaration.name);
    if (declaration.kind === "type") {
      const entry = overlay.types.get(key);
      resolved.push(entry ? { ...declaration, overlay: entry } : declaration);
      continue;
    }
    if (declaration.kind === "global") {
      const entry = overlay.globals.get(key);
      if (entry) {
        resolved.push({ ...declaration, overlay: entry });
      } else if (!overlay.rejected.has(expectedPath(declaration))) {
        diagnostics.push(missing(declaration));
      }
      continue;
    }
    const entry = overlay.functions.get(key);
    if (!entry) {
      // An invalid entry file is already reported; do not report it twice.
      if (!overlay.rejected.has(expectedPath(declaration))) {
        diagnostics.push(missing(declaration));
      }
      continue;
    }
    if (!sameParameters(declaration, entry)) {
      diagnostics.push(mismatch(declaration, entry));
      continue;
    }
    resolved.push({ ...declaration, overlay: entry });
  }

  return { declarations: resolved, diagnostics };
}

/**
 * The orphan warnings: every entry that no declaration of any vendored Patch
 * matches by source, kind and name. `declarations` holds the declarations of
 * all vendored Patches, `patches` their Builds, oldest first.
 */
export function orphans(
  declarations: readonly Declaration[],
  overlay: Overlay,
  patches: readonly string[]
): Diagnostic[] {
  const declared = new Set(declarations.map(expectedPath));
  const diagnostics: Diagnostic[] = [];
  for (const folder of KIND_FOLDERS) {
    for (const entry of overlay[folder].values()) {
      if (!declared.has(entry.file)) diagnostics.push(orphan(entry, patches));
    }
  }
  return diagnostics;
}

/** The entry file that would hold a declaration's entry. */
function expectedPath(declaration: Declaration): string {
  const { source, name } = declaration;
  return entryPath(source, kindFolder(declaration), name);
}

function sameParameters(
  fn: FunctionDeclaration,
  entry: FunctionEntry
): boolean {
  return (
    fn.params.length === entry.params.length &&
    fn.params.every((param, index) => param.name === entry.params[index]!.name)
  );
}

/** The checklist line: source, the Jass declaration and the file to write. */
function missing(
  declaration: FunctionDeclaration | GlobalDeclaration
): Diagnostic {
  const jass = jassDeclaration(declaration);
  return {
    severity: "error",
    kind: "missing-entry",
    file: declaration.source,
    line: declaration.line,
    name: declaration.name,
    message:
      `${declaration.source}: no Overlay entry for ${jass}; ` +
      `expected ${expectedPath(declaration)}`,
  };
}

function mismatch(fn: FunctionDeclaration, entry: FunctionEntry): Diagnostic {
  const overlayParams = entry.params.map((p) => p.name).join(", ");
  return {
    severity: "error",
    kind: "param-mismatch",
    file: entry.file,
    name: fn.name,
    message:
      `${entry.file}: parameters do not match the Patch: ` +
      `${jassSignature(fn)}; Overlay has (${overlayParams})`,
  };
}

function orphan(entry: BaseEntry, patches: readonly string[]): Diagnostic {
  return {
    severity: "warning",
    kind: "orphan",
    file: entry.file,
    name: entry.name,
    message:
      `${entry.file}: orphan Overlay entry, ` +
      `${entry.source} of ${patchList(patches)} declares no ${entry.name}`,
  };
}
