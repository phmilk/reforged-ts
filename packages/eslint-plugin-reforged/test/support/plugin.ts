// The plugin as a Map project loads it, for the rule tests: each rule comes
// from the default export, so a test covers the rule as registered.
import plugin from "../../src/index.js";

/** The rule registered under `name` in the default export; throws if absent. */
export function ruleOf(name: string) {
  if (!Object.hasOwn(plugin.rules, name)) {
    throw new Error(`the plugin exports no rule named ${name}`);
  }
  return plugin.rules[name];
}
