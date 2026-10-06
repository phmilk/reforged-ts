/**
 * Matches the Patch declarations with their Overlay entries: every function
 * needs one entry whose parameters equal the Patch signature (count, order,
 * names), every global needs one entry, and a type may have one. The kind
 * folder an entry lives in decides which declarations it can match. An entry
 * that no vendored Patch declares is an orphan warning, not an error, because
 * the Overlay is shared by all vendored Patches. A function's entry also
 * names the Nullability family of a handle-returning common.j Native, and
 * only of one, and a Native of a nullable family is typed nullable. Each
 * Rawcode parameter and return takes its Object kind here (`rawcodes.ts`).
 */
import { patchList } from "./build.js";
import type { Diagnostic } from "./diagnostics.js";
import {
  NULLABILITY_FAMILIES,
  type BaseEntry,
  type FunctionEntry,
  type GlobalEntry,
  type TypeEntry,
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
import { overlayKind, parameterKind, type RawcodeKind } from "./rawcodes.js";

/**
 * The Object kinds of a function's Rawcodes: one per parameter, in order,
 * `undefined` where the parameter is not a Rawcode, and the return's.
 */
export interface FunctionRawcodes {
  params: (RawcodeKind | undefined)[];
  returns?: RawcodeKind;
}

/** A function with the Overlay facts that shape its declaration. */
export interface ResolvedFunction extends FunctionDeclaration {
  overlay: FunctionEntry;
  rawcodes: FunctionRawcodes;
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
): Resolution {
  const resolved: Resolved[] = [];
  const diagnostics: Diagnostic[] = [];
  const handleTypes = new Set([
    "handle",
    ...declarations.filter((d) => d.kind === "type").map((d) => d.name),
  ]);

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
    const familyProblem = checkFamily(declaration, entry, handleTypes);
    if (familyProblem) {
      diagnostics.push(familyError(entry, familyProblem));
      continue;
    }
    const rawcodes = classify(declaration, entry);
    if (!("params" in rawcodes)) {
      diagnostics.push(...rawcodes);
      continue;
    }
    resolved.push({ ...declaration, overlay: entry, rawcodes });
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
  patches: readonly string[],
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

/**
 * What is wrong with a function's `returns.family`, as the checklist words
 * it, if anything: a handle-returning common.j Native without one, one on
 * any other function, or a Native of a nullable family typed non-null.
 * Only the common.j Natives name a family: the handle returns of
 * blizzard.j follow the Natives they call (ADR 0008), and those of
 * common.ai belong to AI scripts.
 */
function checkFamily(
  fn: FunctionDeclaration,
  entry: FunctionEntry,
  handleTypes: ReadonlySet<string>,
): string | undefined {
  const { family, nullable } = entry.returns;
  const returnsHandle = handleTypes.has(fn.returns);
  const isCommonJNative = fn.source === "common.j" && fn.kind === "native";
  if (family === undefined) {
    return isCommonJNative && returnsHandle
      ? `${fn.name} returns a handle (${fn.returns}) but has no returns.family; ` +
          `name its Nullability family, one of ${Object.keys(NULLABILITY_FAMILIES).join(", ")}`
      : undefined;
  }
  if (!returnsHandle) {
    return `returns.family on ${fn.name}, which returns ${fn.returns}, not a handle; remove it`;
  }
  if (!isCommonJNative) {
    return (
      `returns.family on ${fn.name}, a ${fn.source} ${fn.kind}; ` +
      "only a common.j Native has one, remove it"
    );
  }
  if (!NULLABILITY_FAMILIES[family] && !nullable) {
    return (
      `${fn.name} is of the family ${family}, which may have nothing to return, ` +
      "but returns.nullable is false; make it true"
    );
  }
  return undefined;
}

/**
 * The Object kinds of a function's Rawcodes, or the checklist lines of what
 * stops it: an Overlay `kind` on an item that is not an `integer`, and a
 * parameter that looks like a Rawcode and that nothing classifies.
 */
function classify(
  fn: FunctionDeclaration,
  entry: FunctionEntry,
): FunctionRawcodes | Diagnostic[] {
  const problems: Diagnostic[] = [];
  const params = fn.params.map((param, index) => {
    const { kind } = entry.params[index];
    if (kind !== undefined && param.type !== "integer") {
      problems.push(
        kindError(
          entry,
          `params[${String(index)}].kind on ${fn.name} parameter ${param.name}, ` +
            `which is ${param.type}, not integer; remove it`,
        ),
      );
      return undefined;
    }
    const classified = parameterKind(param, kind);
    if (classified !== "unclassified") return classified;
    problems.push(unclassified(entry, fn, index));
    return undefined;
  });
  const { kind } = entry.returns;
  if (kind !== undefined && fn.returns !== "integer") {
    problems.push(
      kindError(
        entry,
        `returns.kind on ${fn.name}, which returns ${fn.returns}, not integer; remove it`,
      ),
    );
  }
  if (problems.length > 0) return problems;
  return kind === undefined
    ? { params }
    : { params, returns: overlayKind(kind) };
}

function sameParameters(
  fn: FunctionDeclaration,
  entry: FunctionEntry,
): boolean {
  return (
    fn.params.length === entry.params.length &&
    fn.params.every((param, index) => param.name === entry.params[index].name)
  );
}

/** The checklist line: source, the Jass declaration and the file to write. */
function missing(
  declaration: FunctionDeclaration | GlobalDeclaration,
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

/** The checklist line of an entry whose `returns.family` breaks the rule. */
function familyError(entry: FunctionEntry, problem: string): Diagnostic {
  return {
    severity: "error",
    kind: "nullability-family",
    file: entry.file,
    name: entry.name,
    message: `${entry.file}: ${problem}`,
  };
}

/** The checklist line of an Overlay `kind` the Patch declaration refuses. */
function kindError(entry: FunctionEntry, problem: string): Diagnostic {
  return {
    severity: "error",
    kind: "overlay-invalid",
    file: entry.file,
    name: entry.name,
    message: `${entry.file}: ${problem}`,
  };
}

/**
 * The checklist line of a parameter that looks like a Rawcode and that
 * neither the parameter-name table nor its Overlay `kind` classifies.
 */
function unclassified(
  entry: FunctionEntry,
  fn: FunctionDeclaration,
  index: number,
): Diagnostic {
  const { name, type } = fn.params[index];
  return {
    severity: "error",
    kind: "unclassified-rawcode",
    file: entry.file,
    name: fn.name,
    message:
      `${entry.file}: ${fn.name} parameter ${name} (${type}) looks like a Rawcode ` +
      `but has no Object kind; set params[${String(index)}].kind to an Object kind or "any", ` +
      `or add ${name} to the parameter-name table`,
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
