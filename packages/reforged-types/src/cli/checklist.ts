/**
 * Prints diagnostics as the curation checklist: errors first, then warnings,
 * one `- [ ]` line each, in the order the generator reported them.
 */
import type { Diagnostic } from "../diagnostics.js";

export function formatChecklist(diagnostics: readonly Diagnostic[]): string {
  const sections: string[] = [];
  for (const [title, severity] of [
    ["Errors", "error"],
    ["Warnings", "warning"],
  ] as const) {
    const items = diagnostics.filter((d) => d.severity === severity);
    if (items.length === 0) continue;
    sections.push(
      `${title} (${items.length}):\n` +
        items.map((d) => `- [ ] ${d.message}\n`).join("")
    );
  }
  return sections.join("\n");
}

/** `3 errors, 1 warning`. */
export function countDiagnostics(diagnostics: readonly Diagnostic[]): string {
  const errors = diagnostics.filter((d) => d.severity === "error").length;
  const warnings = diagnostics.length - errors;
  return `${plural(errors, "error")}, ${plural(warnings, "warning")}`;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
