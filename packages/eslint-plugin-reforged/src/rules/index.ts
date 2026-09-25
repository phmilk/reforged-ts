// The registry: every rule of the plugin, one line each, sorted by name.
// Adding a rule is its file under rules/, one import and one line here.
import type { RuleEntry } from "../rule-entry.js";
import noHandlesAtModuleTopLevel from "./no-handles-at-module-top-level.js";
import noUnsafeNatives from "./no-unsafe-natives.js";
import noUnusedHandleResult from "./no-unused-handle-result.js";

export const ruleEntries: readonly RuleEntry[] = [
  noHandlesAtModuleTopLevel,
  noUnsafeNatives,
  noUnusedHandleResult,
];
