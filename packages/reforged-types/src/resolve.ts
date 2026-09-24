/**
 * Matches the Patch declarations with their Overlay entries: every function
 * needs one entry whose parameters equal the Patch signature (count, order,
 * names), every global needs one entry, and a type may have one. The kind
 * folder an entry lives in decides which declarations it can match. An entry
 * that matches no declaration is an orphan warning, because the Overlay is
 * shared by all vendored Patches.
 */
import type { Diagnostic } from "./diagnostics.js";
import {
  jassGlobal,
  jassSignature,
  type Declaration,
  type FunctionDeclaration,
  type GlobalDeclaration,
  type TypeDeclaration,
} from "./model.js";
import {
  entryPath,
  overlayKey,
  type GlobalEntry,
  type Overlay,
  type OverlayEntry,
  type TypeEntry,
} from "./overlay.js";

/** A function with the Overlay facts that shape its declaration. */
export interface ResolvedFunction extends FunctionDeclaration {
  overlay: OverlayEntry;
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
  overlay: Overlay,
  patch: string
): Resolution {
  const resolved: Resolved[] = [];
  const diagnostics: Diagnostic[] = [];
  /** Files of the entries a declaration matched. */
  const matched = new Set<string>();

  for (const declaration of declarations) {
    const key = overlayKey(declaration.source, declaration.name);
    if (declaration.kind === "type") {
      const entry = overlay.types.get(key);
      if (entry) matched.add(entry.file);
      resolved.push(entry ? { ...declaration, overlay: entry } : declaration);
      continue;
    }
    if (declaration.kind === "global") {
      const entry = overlay.globals.get(key);
      if (entry) {
        matched.add(entry.file);
        resolved.push({ ...declaration, overlay: entry });
      } else if (!overlay.rejected.has(expectedPath(declaration))) {
        diagnostics.push(missing(declaration));
      }
      continue;
    }
    const entry = overlay.entries.get(key);
    if (!entry) {
      // An invalid entry file is already reported; do not report it twice.
      if (!overlay.rejected.has(expectedPath(declaration))) {
        diagnostics.push(missing(declaration));
      }
      continue;
    }
    matched.add(entry.file);
    if (!sameParameters(declaration, entry)) {
      diagnostics.push(mismatch(declaration, entry));
      continue;
    }
    resolved.push({ ...declaration, overlay: entry });
  }

  for (const entries of [overlay.entries, overlay.globals, overlay.types]) {
    for (const entry of entries.values()) {
      if (!matched.has(entry.file)) diagnostics.push(orphan(entry, patch));
    }
  }
  return { declarations: resolved, diagnostics };
}

/** The entry file a function or global needs. */
function expectedPath(
  declaration: FunctionDeclaration | GlobalDeclaration
): string {
  const folder = declaration.kind === "global" ? "globals" : "functions";
  return entryPath(declaration.source, folder, declaration.name);
}

function sameParameters(fn: FunctionDeclaration, entry: OverlayEntry): boolean {
  return (
    fn.params.length === entry.params.length &&
    fn.params.every((param, index) => param.name === entry.params[index]!.name)
  );
}

/** The checklist line: source, the Jass declaration and the file to write. */
function missing(
  declaration: FunctionDeclaration | GlobalDeclaration
): Diagnostic {
  const jass =
    declaration.kind === "global"
      ? `global ${jassGlobal(declaration)}`
      : jassSignature(declaration);
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

function mismatch(fn: FunctionDeclaration, entry: OverlayEntry): Diagnostic {
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

function orphan(
  entry: Pick<OverlayEntry, "file" | "name" | "source">,
  patch: string
): Diagnostic {
  return {
    severity: "warning",
    kind: "orphan",
    file: entry.file,
    name: entry.name,
    message:
      `${entry.file}: orphan Overlay entry, ` +
      `${entry.source} of Patch ${patch} declares no ${entry.name}`,
  };
}
