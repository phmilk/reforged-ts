/**
 * Diagnostics are the generator's only way to report a problem: every error
 * and warning of a run, in a deterministic order, printed as the checklist.
 */

export type DiagnosticKind =
  /** A Patch line the parser does not understand. */
  | "parse"
  /** A Patch folder that cannot be read (missing file, bad provenance). */
  | "patch-invalid"
  /** An Overlay file that is not a valid entry. */
  | "overlay-invalid"
  /** A declaration with no Overlay entry. */
  | "missing-entry"
  /** An Overlay entry whose parameters differ from the Patch signature. */
  | "param-mismatch"
  /** An Overlay entry that matches no declaration of the Patch. */
  | "orphan";

export interface Diagnostic {
  severity: "error" | "warning";
  kind: DiagnosticKind;
  /** The full line the checklist prints, starting with its location. */
  message: string;
  /** Patch file name, or Overlay file path relative to the Overlay folder. */
  file?: string;
  /** 1-based line in a Patch file. */
  line?: number;
  /** The declaration or entry name the diagnostic is about. */
  name?: string;
}

export function hasErrors(diagnostics: readonly Diagnostic[]): boolean {
  return diagnostics.some((d) => d.severity === "error");
}
