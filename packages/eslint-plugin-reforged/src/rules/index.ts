// The registry: every rule of the plugin, one line each, sorted by name.
// Adding a rule is its file under rules/, one import and one line here.
import type { RuleEntry } from "../rule-entry.js";
import noDottedAssetPaths from "./no-dotted-asset-paths.js";
import noHandlesAtModuleTopLevel from "./no-handles-at-module-top-level.js";
import noLegacyW3tsNames from "./no-legacy-w3ts-names.js";
import noPercentInDisplayStrings from "./no-percent-in-display-strings.js";
import noSelfRecursion from "./no-self-recursion.js";
import noUnorderedIteration from "./no-unordered-iteration.js";
import noUnsafeNatives from "./no-unsafe-natives.js";
import noUnusedHandleResult from "./no-unused-handle-result.js";

export const ruleEntries: readonly RuleEntry[] = [
  noDottedAssetPaths,
  noHandlesAtModuleTopLevel,
  noLegacyW3tsNames,
  noPercentInDisplayStrings,
  noSelfRecursion,
  noUnorderedIteration,
  noUnsafeNatives,
  noUnusedHandleResult,
];
