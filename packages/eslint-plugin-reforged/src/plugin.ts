// The plugin object: `meta`, `rules` and `configs`, built from the rule
// registry and the data files loaded once at creation.
import type { TSESLint } from "@typescript-eslint/utils";

import {
  type DataFiles,
  loadPluginData,
  type OptionalPackage,
} from "./data/index.js";
import { pluginMeta } from "./meta.js";
import type { AnyRuleModule, Severity } from "./rule-entry.js";
import { ruleEntries } from "./rules/index.js";

/** The prefix a Map project's config uses for the rules (`reforged/<rule>`). */
export const pluginPrefix = "reforged";

export interface PluginOptions {
  /** Where each data file is read from; defaults to the installed ones. */
  readonly files?: DataFiles;
  /**
   * The Map project's root, where the optional packages (reforged-ts,
   * reforged-types) are looked up; defaults to the working directory, the
   * directory ESLint runs in.
   */
  readonly projectRoot?: string;
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

/** A rule that keeps its metadata (docs link, schema) but reports nothing. */
function disabled(rule: AnyRuleModule): AnyRuleModule {
  return { ...rule, create: () => ({}) };
}

/**
 * Builds the plugin. Throws a DataFileError when a data file has an
 * unexpected shape. When an optional package is missing from the project,
 * the rules that require it are registered disabled, with one console
 * warning per package naming them. The default export is `createPlugin()`.
 */
export function createPlugin(options: PluginOptions = {}): ReforgedPlugin {
  const data = loadPluginData(options.files, options.projectRoot);
  const disabledBy = new Map<OptionalPackage, string[]>();
  const rules: Record<string, AnyRuleModule> = {};
  const severities: Record<string, Severity> = {};
  for (const entry of ruleEntries) {
    const missing = (entry.requires ?? []).filter((each) =>
      data.unavailable.has(each),
    );
    for (const each of missing) {
      disabledBy.set(each, [...(disabledBy.get(each) ?? []), entry.name]);
    }
    const rule = entry.create(data);
    rules[entry.name] = missing.length === 0 ? rule : disabled(rule);
    severities[`${pluginPrefix}/${entry.name}`] = entry.severity;
  }
  for (const [each, names] of disabledBy) {
    const reason = data.unavailable.get(each)?.reason ?? each;
    console.warn(
      `${pluginMeta.name}: ${reason}; disabled: ${names.map((name) => `${pluginPrefix}/${name}`).join(", ")}.`,
    );
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
