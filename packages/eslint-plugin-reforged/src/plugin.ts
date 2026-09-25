// The plugin object: `meta`, `rules` and `configs`, built from the rule
// registry and the data files loaded once at creation.
import type { TSESLint } from "@typescript-eslint/utils";

import { type DataFiles, loadPluginData } from "./data/index.js";
import { pluginMeta } from "./meta.js";
import type { AnyRuleModule, Severity } from "./rule-entry.js";
import { ruleEntries } from "./rules/index.js";

/** The prefix a Map project's config uses for the rules (`reforged/<rule>`). */
export const pluginPrefix = "reforged";

export interface PluginOptions {
  /** Where each data file is read from; defaults to the installed ones. */
  readonly files?: DataFiles;
}

export interface ReforgedPlugin {
  readonly meta: { readonly name: string; readonly version: string };
  readonly rules: Readonly<Record<string, AnyRuleModule>>;
  readonly configs: {
    /**
     * Registers the plugin and sets every rule at its decided severity. No
     * parser and no project options: spread it after typescript-eslint's
     * type-checked presets (or any configuration that provides
     * `parserOptions.projectService`).
     */
    readonly recommended: TSESLint.FlatConfig.ConfigArray;
  };
}

/**
 * Builds the plugin. Throws a DataFileError when a data file has an
 * unexpected shape. The default export is `createPlugin()`.
 */
export function createPlugin(options: PluginOptions = {}): ReforgedPlugin {
  const data = loadPluginData(options.files);
  const rules: Record<string, AnyRuleModule> = {};
  const severities: Record<string, Severity> = {};
  for (const entry of ruleEntries) {
    rules[entry.name] = entry.create(data);
    severities[`${pluginPrefix}/${entry.name}`] = entry.severity;
  }
  const recommended: TSESLint.FlatConfig.ConfigArray = [];
  const plugin: ReforgedPlugin = {
    meta: pluginMeta,
    rules,
    configs: { recommended },
  };
  recommended.push({
    name: `${pluginPrefix}/recommended`,
    plugins: { [pluginPrefix]: plugin },
    rules: severities,
  });
  return plugin;
}
