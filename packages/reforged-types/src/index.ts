/**
 * Entry point of the reforged-types generator.
 */
export {
  generate,
  type GenerateFailure,
  type GenerateInput,
  type GenerateResult,
  type GenerateSuccess,
} from "./generate.js";
export type { Diagnostic, DiagnosticKind } from "./diagnostics.js";
export type { Added, Additions } from "./additions.js";
