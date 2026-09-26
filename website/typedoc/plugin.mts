// The site's own TypeDoc plugin, loaded by every reference instance (#40).
// TypeDoc imports it from source, so it is TypeScript that Node's type
// stripping runs: erasable syntax only. It shares TypeDoc's module instance,
// which a module the Docusaurus configuration imports would not: that one is
// loaded through Docusaurus' own transpiler.
//
// What it adds to TypeDoc as docusaurus-plugin-typedoc runs it:
// - the site's tag vocabulary, when the project declares none (`tsdoc.json`);
// - the validation gate: docusaurus-plugin-typedoc converts and renders but
//   neither validates nor fails, so the plugin does both before the output.
import { readFileSync } from "node:fs";
import {
  Application,
  OptionDefaults,
  type ProjectReflection,
  type TagString,
} from "typedoc";

/** The part of a `tsdoc.json` the plugin reads. */
interface TsdocConfig {
  readonly tagDefinitions: readonly {
    readonly tagName: TagString;
    readonly syntaxKind: "block" | "inline" | "modifier";
  }[];
}

/**
 * The site's minimal `tsdoc.json`: the custom tags of the TSDoc standard
 * (ADR 0004), declared until the library ships the workspace file (#43).
 */
const SITE_TSDOC = new URL("tsdoc.json", import.meta.url);

export function load(app: Application): void {
  app.on(Application.EVENT_BOOTSTRAP_END, () => {
    declareSiteTags(app);
  });
  gateOnValidation(app);
}

/**
 * Declares the tags of the site's `tsdoc.json` on top of TypeDoc's defaults,
 * unless the tags are already set: TypeDoc sets them from the `tsdoc.json`
 * next to the project's tsconfig, the one the workspace file reaches, and
 * that file then wins.
 */
function declareSiteTags(app: Application): void {
  const options = app.options;
  if (
    options.isSet("blockTags") ||
    options.isSet("inlineTags") ||
    options.isSet("modifierTags")
  ) {
    return;
  }
  const config = JSON.parse(readFileSync(SITE_TSDOC, "utf8")) as TsdocConfig;
  const tags = (kind: "block" | "inline" | "modifier") =>
    config.tagDefinitions
      .filter((tag) => tag.syntaxKind === kind)
      .map((tag) => tag.tagName);
  options.setValue("blockTags", [
    ...new Set([...OptionDefaults.blockTags, ...tags("block")]),
  ]);
  options.setValue("inlineTags", [
    ...new Set([...OptionDefaults.inlineTags, ...tags("inline")]),
  ]);
  options.setValue("modifierTags", [
    ...new Set([...OptionDefaults.modifierTags, ...tags("modifier")]),
  ]);
}

/**
 * Validates the project before its output is written, as TypeDoc's own
 * command does, and fails the run on an error, or on a validation warning
 * (an undocumented member, a broken `{@link}`) under
 * `treatValidationWarningsAsErrors`. TypeDoc has logged each finding, naming
 * the member, by then; the error thrown stops the Docusaurus build.
 */
function gateOnValidation(app: Application): void {
  const validated = new WeakSet<ProjectReflection>();
  app.on(Application.EVENT_VALIDATE_PROJECT, (project) => {
    validated.add(project);
  });
  app.on(Application.EVENT_GENERATE_OUTPUTS_BEGIN, (project) => {
    const logger = app.logger;
    const warningsBefore = logger.warningCount;
    if (!validated.has(project)) {
      app.validate(project);
    }
    const validationWarnings =
      logger.warningCount !== warningsBefore ||
      logger.validationWarningCount !== 0;
    const name = project.packageName ?? project.name;
    if (logger.hasErrors()) {
      throw new Error(
        `TypeDoc reported ${String(logger.errorCount)} error(s) in the reference of ${name}; see the log above.`,
      );
    }
    if (
      validationWarnings &&
      app.options.getValue("treatValidationWarningsAsErrors")
    ) {
      throw new Error(
        `TypeDoc's validation failed the reference of ${name} (strict): each validation warning above is an error.`,
      );
    }
  });
}
