// The site's own TypeDoc plugin, loaded by every reference instance (#40).
// TypeDoc imports it from source, so it is TypeScript that Node's type
// stripping runs: erasable syntax only. It shares TypeDoc's module instance,
// which a module the Docusaurus configuration imports would not: that one is
// loaded through Docusaurus' own transpiler.
//
// What it adds to TypeDoc as docusaurus-plugin-typedoc runs it:
// - the site's tag vocabulary, when the project declares none (`tsdoc.json`),
//   and typescript-to-lua's annotations left off the pages;
// - the validation gate: docusaurus-plugin-typedoc converts and renders but
//   neither validates nor fails, so the plugin does both before the output;
// - for a Typings reference (the `typingsManifest` option): the Jass files
//   side by side in one project, and every entry of the Patch's manifest on
//   the page `typings.mts` routes it to, or the run fails.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import {
  Application,
  Comment,
  CommentTag,
  Converter,
  OptionDefaults,
  ParameterType,
  type ProjectReflection,
  ReflectionKind,
  type TagString,
} from "typedoc";
import { entryPage, readTypingsManifest } from "./typings.mts";

declare module "typedoc" {
  export interface TypeDocOptionMap {
    typingsManifest: string;
  }
}

/** The kinds of tag a `tsdoc.json` defines, and TypeDoc's default tags of each. */
const DEFAULT_TAGS = {
  block: OptionDefaults.blockTags,
  inline: OptionDefaults.inlineTags,
  modifier: OptionDefaults.modifierTags,
} as const;
const TAG_KINDS = Object.keys(DEFAULT_TAGS) as (keyof typeof DEFAULT_TAGS)[];

/** The part of a `tsdoc.json` the plugin reads. */
interface TsdocConfig {
  readonly tagDefinitions: readonly {
    readonly tagName: TagString;
    readonly syntaxKind: (typeof TAG_KINDS)[number];
  }[];
}

/**
 * The site's minimal `tsdoc.json`: the custom tags of the TSDoc standard
 * (ADR 0004) and typescript-to-lua's annotations, declared until the library
 * ships the workspace file (#43). The Typings' references keep needing it:
 * TypeDoc reads a `tsdoc.json` next to the tsconfig, and theirs are written
 * by the site.
 */
const SITE_TSDOC = new URL("tsdoc.json", import.meta.url);

/** typescript-to-lua's annotations, which the site's `tsdoc.json` declares too. */
const LUA_ANNOTATIONS: readonly TagString[] = ["@noSelf", "@noSelfInFile"];

export function load(app: Application): void {
  app.options.addDeclaration({
    name: "typingsManifest",
    help: "The manifest.json of the Patch whose Typings the project documents; empty for any other project.",
    type: ParameterType.String,
    defaultValue: "",
  });
  app.on(Application.EVENT_BOOTSTRAP_END, () => {
    declareSiteTags(app);
    excludeLuaAnnotations(app);
  });
  gateOnValidation(app);
  mergeTypingsFiles(app);
  checkTypingsPages(app);
}

/**
 * Declares the tags of the site's `tsdoc.json` on top of TypeDoc's defaults,
 * unless the tags are already set: TypeDoc sets them from the `tsdoc.json`
 * next to the project's tsconfig, the one the workspace file reaches, and
 * that file then wins.
 */
function declareSiteTags(app: Application): void {
  const options = app.options;
  if (TAG_KINDS.some((kind) => options.isSet(`${kind}Tags`))) return;
  const config = JSON.parse(readFileSync(SITE_TSDOC, "utf8")) as TsdocConfig;
  for (const kind of TAG_KINDS) {
    const declared = config.tagDefinitions
      .filter((tag) => tag.syntaxKind === kind)
      .map((tag) => tag.tagName);
    options.setValue(`${kind}Tags`, [
      ...new Set([...DEFAULT_TAGS[kind], ...declared]),
    ]);
  }
}

/**
 * Leaves typescript-to-lua's annotations off the pages: they say nothing to a
 * reader, and the Typings' file comment, `@noSelfInFile`, would show on their
 * first declaration.
 */
function excludeLuaAnnotations(app: Application): void {
  const excluded = app.options.getValue("excludeTags");
  app.options.setValue("excludeTags", [
    ...new Set([...excluded, ...LUA_ANNOTATIONS]),
  ]);
}

/**
 * Validates the project before its output is written, as TypeDoc's own
 * command does, and fails the run on an error, before the output or while
 * writing it, or on a validation warning
 * (an undocumented member, a broken `{@link}`) under
 * `treatValidationWarningsAsErrors` or `treatWarningsAsErrors`. TypeDoc has
 * logged each finding, naming the member, by then; the error thrown stops
 * the Docusaurus build.
 */
function gateOnValidation(app: Application): void {
  // A run through TypeDoc's own command has validated already, and must not
  // report every finding twice.
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
      (app.options.getValue("treatValidationWarningsAsErrors") ||
        app.options.getValue("treatWarningsAsErrors"))
    ) {
      throw new Error(
        `TypeDoc's validation failed the reference of ${name} (strict): each validation warning above is an error.`,
      );
    }
  });
  // TypeDoc logs an error thrown while writing the output, and goes on.
  app.on(Application.EVENT_GENERATE_OUTPUTS_END, (project) => {
    const logger = app.logger;
    if (logger.hasErrors()) {
      throw new Error(
        `TypeDoc reported ${String(logger.errorCount)} error(s) writing the reference of ${project.packageName ?? project.name}; see the log above.`,
      );
    }
  });
}

/**
 * Puts the declarations of a Typings reference's Jass files side by side at
 * the project's root: TypeDoc makes a module of each global declaration file,
 * named after it, and each entry's page would then depend on its file. The
 * modules are given TypeDoc's own `@mergeModuleWith <project>` before its
 * plugin handles the tag (priority 10000).
 */
function mergeTypingsFiles(app: Application): void {
  app.converter.on(
    Converter.EVENT_RESOLVE_BEGIN,
    (context) => {
      if (app.options.getValue("typingsManifest") === "") return;
      const files = context.project.getReflectionsByKind(ReflectionKind.Module);
      for (const file of files) {
        file.comment ??= new Comment();
        file.comment.blockTags.push(
          new CommentTag("@mergeModuleWith", [
            { kind: "text", text: "<project>" },
          ]),
        );
      }
    },
    20_000,
  );
}

/**
 * Fails a Typings reference, once its pages are written, when an entry of the
 * Patch's manifest is not on the page `entryPage` routes it to: the `@native`
 * links of the library's reference are built from that route. The file names
 * are compared as written, so a page TypeDoc renamed to keep it apart from
 * another whose name differs in case alone fails too.
 */
function checkTypingsPages(app: Application): void {
  app.on(Application.EVENT_GENERATE_OUTPUTS_END, () => {
    const manifest = app.options.getValue("typingsManifest");
    if (manifest === "") return;
    const out = app.options.getValue("out");
    const folders = new Map<string, ReadonlySet<string>>();
    const written = (folder: string): ReadonlySet<string> => {
      let files = folders.get(folder);
      if (files === undefined) {
        const path = join(out, folder);
        files = new Set(existsSync(path) ? readdirSync(path) : []);
        folders.set(folder, files);
      }
      return files;
    };
    const missing = readTypingsManifest(manifest)
      .entries.map((entry) => ({ entry, page: `${entryPage(entry)}.md` }))
      .filter(({ page }) => !written(dirname(page)).has(basename(page)))
      .map(({ entry, page }) => `- ${entry.kind} ${entry.name}: ${page}`);
    if (missing.length !== 0) {
      throw new Error(
        `The Typings reference of ${manifest} has no page for ${String(missing.length)} of its entries, where the route of an entry says:\n${missing.join("\n")}`,
      );
    }
  });
}
