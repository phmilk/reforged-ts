/**
 * Matches the Patch declarations with their Overlay entries: every function
 * needs one entry whose parameters equal the Patch signature (count, order,
 * names); an entry that matches no declaration is an orphan warning, because
 * the Overlay is shared by all vendored Patches.
 */
import type { Diagnostic } from "./diagnostics.js";
import {
  jassSignature,
  type Declaration,
  type FunctionDeclaration,
  type TypeDeclaration,
} from "./model.js";
import { overlayKey, type Overlay, type OverlayEntry } from "./overlay.js";

/** A function with the Overlay facts that shape its declaration. */
export interface ResolvedFunction extends FunctionDeclaration {
  overlay: OverlayEntry;
}

export type Resolved = TypeDeclaration | ResolvedFunction;

export interface Resolution {
  /** Declarations in source order; a function without a usable entry is left out. */
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
  const matched = new Set<string>();

  for (const declaration of declarations) {
    if (declaration.kind === "type") {
      resolved.push(declaration);
      continue;
    }
    const key = overlayKey(declaration.source, declaration.name);
    const entry = overlay.entries.get(key);
    if (!entry) {
      // An invalid entry file is already reported; do not report it twice.
      if (!overlay.rejected.has(key)) diagnostics.push(missing(declaration));
      continue;
    }
    matched.add(key);
    if (!sameParameters(declaration, entry)) {
      diagnostics.push(mismatch(declaration, entry));
      continue;
    }
    resolved.push({ ...declaration, overlay: entry });
  }

  for (const [key, entry] of overlay.entries) {
    if (!matched.has(key)) diagnostics.push(orphan(entry, patch));
  }
  return { declarations: resolved, diagnostics };
}

function sameParameters(fn: FunctionDeclaration, entry: OverlayEntry): boolean {
  return (
    fn.params.length === entry.params.length &&
    fn.params.every((param, index) => param.name === entry.params[index]!.name)
  );
}

function missing(fn: FunctionDeclaration): Diagnostic {
  return {
    severity: "error",
    kind: "missing-entry",
    file: fn.source,
    line: fn.line,
    name: fn.name,
    message: `${fn.source}: no Overlay entry for ${jassSignature(fn)}`,
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

function orphan(entry: OverlayEntry, patch: string): Diagnostic {
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
