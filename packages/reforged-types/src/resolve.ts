/**
 * Matches the Patch declarations with their Overlay entries: every function
 * needs one entry whose parameters equal the Patch signature (count, order,
 * names); an entry that matches no declaration is an orphan warning, because
 * the Overlay is shared by all vendored Patches. Every global needs one
 * entry too; a type may have one.
 */
import type { Diagnostic } from "./diagnostics.js";
import {
  jassGlobal,
  jassSignature,
  jassType,
  type Declaration,
  type FunctionDeclaration,
  type GlobalDeclaration,
  type TypeDeclaration,
} from "./model.js";
import {
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
    if (declaration.kind === "type" || declaration.kind === "global") {
      const item =
        declaration.kind === "type"
          ? resolveType(declaration, overlay, matched)
          : resolveGlobal(declaration, overlay, matched);
      if (item && "severity" in item) diagnostics.push(item);
      else if (item) resolved.push(item);
      continue;
    }
    const key = overlayKey(declaration.source, declaration.name);
    const entry = overlay.entries.get(key);
    if (!entry) {
      // An invalid entry file is already reported; do not report it twice.
      if (!overlay.rejected.has(key)) {
        diagnostics.push(
          wrongShape(declaration, overlay, matched) ?? missing(declaration)
        );
      }
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
  for (const entries of [overlay.globals, overlay.types]) {
    for (const [key, entry] of entries) {
      if (!matched.has(key)) diagnostics.push(orphan(entry, patch));
    }
  }
  return { declarations: resolved, diagnostics };
}

/**
 * A global needs an entry of the global shape; undefined when its entry file
 * was rejected (already reported, the global is left out).
 */
function resolveGlobal(
  global: GlobalDeclaration,
  overlay: Overlay,
  matched: Set<string>
): ResolvedGlobal | Diagnostic | undefined {
  const key = overlayKey(global.source, global.name);
  const entry = overlay.globals.get(key);
  if (entry) {
    matched.add(key);
    return { ...global, overlay: entry };
  }
  if (overlay.rejected.has(key)) return undefined;
  return wrongShape(global, overlay, matched) ?? missingGlobal(global);
}

/** A type may have an entry of the type shape. */
function resolveType(
  type: TypeDeclaration,
  overlay: Overlay,
  matched: Set<string>
): ResolvedType | Diagnostic {
  const key = overlayKey(type.source, type.name);
  const entry = overlay.types.get(key);
  if (entry) {
    matched.add(key);
    return { ...type, overlay: entry };
  }
  return wrongShape(type, overlay, matched) ?? type;
}

/**
 * The error for a declaration whose entry file has another kind's shape,
 * naming the fields the declaration needs; undefined when there is none.
 */
function wrongShape(
  declaration: Declaration,
  overlay: Overlay,
  matched: Set<string>
): Diagnostic | undefined {
  const key = overlayKey(declaration.source, declaration.name);
  const found =
    overlay.entries.get(key) ?? overlay.globals.get(key) ?? overlay.types.get(key);
  if (!found) return undefined;
  matched.add(key);

  const has = overlay.entries.has(key)
    ? "returns and params"
    : overlay.globals.has(key)
      ? "nullable"
      : undefined;
  const [what, jass, needs] =
    declaration.kind === "type"
      ? ["type", jassType(declaration), "may carry only deprecated and notes"]
      : declaration.kind === "global"
        ? ["global", jassGlobal(declaration), "must carry nullable"]
        : [
            declaration.kind,
            jassSignature(declaration),
            "must carry returns and params",
          ];
  return {
    severity: "error",
    kind: "overlay-invalid",
    file: found.file,
    name: declaration.name,
    message:
      `${found.file}: ${declaration.name} is a ${what} (${jass}); ` +
      `its entry ${needs}${has ? `, not ${has}` : ""}`,
  };
}

function missingGlobal(global: GlobalDeclaration): Diagnostic {
  return {
    severity: "error",
    kind: "missing-entry",
    file: global.source,
    line: global.line,
    name: global.name,
    message: `${global.source}: no Overlay entry for global ${jassGlobal(
      global
    )}`,
  };
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
