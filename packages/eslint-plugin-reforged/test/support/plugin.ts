// The plugin as a Map project loads it, for the rule tests: created as the
// default export is, with the fixture project as the project root, so the
// optional packages (the stub reforged-ts and its rename map) are the
// fixture's, whatever directory the tests run from.
import { createPlugin } from "../../src/index.js";
import { fixtureProjectRoot } from "./fixture-project.js";

export const plugin = createPlugin({ projectRoot: fixtureProjectRoot });

/** The rule registered under `name` in the plugin; throws if absent. */
export function ruleOf(name: string) {
  if (!Object.hasOwn(plugin.rules, name)) {
    throw new Error(`the plugin exports no rule named ${name}`);
  }
  return plugin.rules[name];
}
