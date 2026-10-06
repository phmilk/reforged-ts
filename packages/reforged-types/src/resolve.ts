/**
 * Matches the Patch declarations with their Overlay entries: every function
 * needs one entry whose parameters equal the Patch signature (count, order,
 * names), every global needs one entry, and a type may have one. The kind
 * folder an entry lives in decides which declarations it can match. An entry
 * that no vendored Patch declares is an orphan warning, not an error, because
 * the Overlay is shared by all vendored Patches. A function's entry also
 * names the Nullability family of a handle-returning common.j Native, and
 * only of one, and a Native of a nullable family is typed nullable. Each
 * Rawcode parameter, return and global takes its Object kind here
 * (`rawcodes.ts`).
 */
import { patchList } from "./build.js";
import type { Diagnostic, DiagnosticKind } from "./diagnostics.js";
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
import {
  overlayKind,
  parameterKind,
  parameterLooksLikeRawcode,
  rawcodeGlobals,
  returnLooksLikeRawcode,
  type RawcodeKind,
} from "./rawcodes.js";

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

/**
 * A global with its mandatory Overlay entry, and its Object kind when it is
 * a Rawcode (its elements' for an array).
 */
export interface ResolvedGlobal extends GlobalDeclaration {
  overlay: GlobalEntry;
  rawcode?: RawcodeKind;
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
  const rawcodeGlobalNames = rawcodeGlobals(
    declarations.filter((d) => d.kind === "global"),
  );

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
        const rawcode = classifyGlobal(declaration, entry, rawcodeGlobalNames);
        if ("severity" in rawcode) diagnostics.push(rawcode);
        else resolved.push({ ...declaration, overlay: entry, ...rawcode });
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
      diagnostics.push(entryError("nullability-family", entry, familyProblem));
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
 * The `type` override that marks a parameter the generator takes for a
 * Rawcode as not one, on purpose: an order id the table would take for a
 * unit's Rawcode. Any other `type` text there is refused, so that a `type`
 * never silences the `unclassified-rawcode` check; a Rawcode takes `kind`.
 */
const NOT_A_RAWCODE_TYPE = "number";

/**
 * The Object kinds of a function's Rawcodes, or the checklist lines of what
 * stops it: an Overlay `kind` on an item that is not an `integer`, a `type`
 * other than `number` on a parameter that looks like a Rawcode, and a
 * parameter or return that looks like a Rawcode and that nothing
 * classifies.
 */
function classify(
  fn: FunctionDeclaration,
  entry: FunctionEntry,
): FunctionRawcodes | Diagnostic[] {
  const problems: Diagnostic[] = [];
  const params = fn.params.map((param, index) => {
    const { kind, type } = entry.params[index];
    const field = `params[${String(index)}]`;
    if (type !== undefined) {
      if (parameterLooksLikeRawcode(param) && type !== NOT_A_RAWCODE_TYPE) {
        problems.push(
          entryError(
            "overlay-invalid",
            entry,
            `${field}.type on ${fn.name} parameter ${param.name}, which looks like a Rawcode, ` +
              `is ${JSON.stringify(type)}; set ${field}.kind to an Object kind or "any" instead, ` +
              `or type to "${NOT_A_RAWCODE_TYPE}" for an integer that is not a Rawcode`,
          ),
        );
      }
      return undefined;
    }
    if (kind !== undefined && param.type !== "integer") {
      problems.push(
        entryError(
          "overlay-invalid",
          entry,
          `${field}.kind on ${fn.name} parameter ${param.name}, ` +
            `which is ${param.type}, not integer; remove it`,
        ),
      );
      return undefined;
    }
    const classified = parameterKind(param, kind);
    if (classified === undefined && parameterLooksLikeRawcode(param)) {
      problems.push(
        entryError(
          "unclassified-rawcode",
          entry,
          `${fn.name} parameter ${param.name} (${param.type}) looks like a Rawcode ` +
            `but has no Object kind; set ${field}.kind to an Object kind or "any", ` +
            `or add ${param.name} to the parameter-name table`,
        ),
      );
    }
    return classified;
  });
  const { kind } = entry.returns;
  if (kind !== undefined && fn.returns !== "integer") {
    problems.push(
      entryError(
        "overlay-invalid",
        entry,
        `returns.kind on ${fn.name}, which returns ${fn.returns}, not integer; remove it`,
      ),
    );
  }
  if (kind === undefined && returnLooksLikeRawcode(fn)) {
    problems.push(
      entryError(
        "unclassified-rawcode",
        entry,
        `${fn.name} returns an integer that looks like a Rawcode but has no Object kind; ` +
          `set returns.kind to an Object kind or "any", ` +
          `or add ${fn.name} to the returns that are not Rawcodes`,
      ),
    );
  }
  if (problems.length > 0) return problems;
  return kind === undefined
    ? { params }
    : { params, returns: overlayKind(kind) };
}

/**
 * A global's Object kind (`{}` when it is not a Rawcode), or the checklist
 * line of what stops it: an Overlay `kind` on a global that is not an
 * `integer`, or a global that looks like a Rawcode (one of
 * `rawcodeGlobalNames`) with no `kind`.
 */
function classifyGlobal(
  global: GlobalDeclaration,
  entry: GlobalEntry,
  rawcodeGlobalNames: ReadonlySet<string>,
): { rawcode?: RawcodeKind } | Diagnostic {
  const { kind } = entry;
  if (kind !== undefined && global.type !== "integer") {
    return entryError(
      "overlay-invalid",
      entry,
      `kind on ${global.name}, which is ${global.type}, not integer; remove it`,
    );
  }
  if (kind !== undefined) return { rawcode: overlayKind(kind) };
  if (!rawcodeGlobalNames.has(global.name)) return {};
  return entryError(
    "unclassified-rawcode",
    entry,
    `global ${global.name} (integer = ${global.initializer?.trim() ?? ""}) ` +
      `looks like a Rawcode but has no Object kind; set kind to an Object kind or "any"`,
  );
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

/**
 * The checklist line of an entry the Patch declaration refuses: a
 * `returns.family` that breaks the rule (`nullability-family`), an Overlay
 * `kind` or `type` the item cannot take (`overlay-invalid`), or an item that
 * looks like a Rawcode and has no kind (`unclassified-rawcode`).
 */
function entryError(
  kind: DiagnosticKind,
  entry: BaseEntry,
  problem: string,
): Diagnostic {
  return {
    severity: "error",
    kind,
    file: entry.file,
    name: entry.name,
    message: `${entry.file}: ${problem}`,
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
