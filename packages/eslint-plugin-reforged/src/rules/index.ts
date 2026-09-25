// The registry: every rule of the plugin, one line each, sorted by name.
// Adding a rule is its file under rules/, one import and one line here.
import type { RuleEntry } from "../rule-entry.js";
import noUnsafeNatives from "./no-unsafe-natives.js";

export const ruleEntries: readonly RuleEntry[] = [noUnsafeNatives];
