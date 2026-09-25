// What a rule file exports: the rule's name, its severity in the recommended
// config (#16's table), and a factory that builds the rule from the data the
// plugin loaded. The plugin, its recommended config and the rule-table test
// are all derived from the list in rules/index.ts.
import type { TSESLint } from "@typescript-eslint/utils";

import type { PluginData } from "./data/index.js";

export type Severity = "error" | "warn";

/** A rule as ESLint loads it; message ids and options are the rule's own. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a heterogeneous list of rules needs the loose shape ESLint itself uses
export type AnyRuleModule = TSESLint.RuleModule<string, any[]>;

export interface RuleEntry {
  /** The rule's name, without the `reforged/` prefix; also its docs page name. */
  readonly name: string;
  /** Its severity in `configs.recommended`. */
  readonly severity: Severity;
  /** Builds the rule from the loaded data files. */
  readonly create: (data: PluginData) => AnyRuleModule;
}

/** Declares a rule entry; the identity keeps each rule file's export typed. */
export function defineRuleEntry(entry: RuleEntry): RuleEntry {
  return entry;
}
