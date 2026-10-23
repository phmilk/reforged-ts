// The loader of Object definitions (#700, "Loading definitions"): every
// .ts file under the definitions folder, transpiled to CommonJS with the
// Map project's own typescript and evaluated in Node with a require of its
// own. Synchronous, so that a tool inside tsserver or ESLint can load them.
// The transpiled text of a file is cached by path and modification time.

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import {
  definitionRecord,
  whileEvaluating,
  type DefinitionRecord,
} from "./definition-registry.js";
import {
  definitionsError,
  ObjectDefinitionsError,
} from "./definitions-error.js";
import * as authoringEntry from "./object-definitions.js";

/** Where the loader looks: the Map project's root, its definitions folder and its generated folder, each absolute. */
export interface DefinitionPaths {
  readonly projectRoot: string;
  readonly definitionsFolder: string;
  readonly generatedFolder: string;
}

/** A definition as loaded: its record, and the file it counts in. */
export interface LoadedDefinition {
  readonly record: DefinitionRecord;
  /** The definition file that exports it, an absolute path. */
  readonly file: string;
}

/** The definitions folder under the Map project's root when none is given. */
export const DEFAULT_DEFINITIONS_FOLDER = path.join("src", "objects");

/** The generated folder under the Map project's root when none is given. */
export const DEFAULT_GENERATED_FOLDER = path.join("src", "generated");

/** The module specifier of the authoring entry. */
const AUTHORING_ENTRY = "reforged-map/objects";

/** The kind entries of reforged-builtins, whose constants exist only in the map's Lua. */
const BUILTINS_KIND_ENTRY =
  /^reforged-builtins\/(?:units|items|abilities|buffs|destructables|doodads|upgrades)(?:\.js|\.lua)?$/;

/** The parameters of a definition module's function. */
const MODULE_PARAMETERS = [
  "exports",
  "require",
  "module",
  "__filename",
  "__dirname",
  "FourCC",
];

/** The transpiled text of each file, by path, with the modification time and size it was read at. */
const transpiled = new Map<
  string,
  { mtimeMs: number; size: number; typescript: string; text: string }
>();

/** The Map project's typescript, by the path of its package.json. */
const typescripts = new Map<string, TypeScript>();

/** What the loader uses of typescript. */
interface TypeScript {
  readonly version: string;
  transpileModule(
    input: string,
    options: {
      compilerOptions: Record<string, unknown>;
      fileName: string;
      reportDiagnostics: boolean;
    },
  ): {
    outputText: string;
    diagnostics?: readonly {
      category: number;
      messageText: string | { messageText: string };
    }[];
  };
  readonly ModuleKind: { readonly CommonJS: number };
  readonly ScriptTarget: { readonly ES2022: number };
  readonly DiagnosticCategory: { readonly Error: number };
}

/** The definition files under the definitions folder: every `.ts` file but a declarations file, in code-point order of their paths. */
export function definitionFiles(definitionsFolder: string): string[] {
  const files: string[] = [];
  const walk = (dir: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (
        entry.isFile() &&
        entry.name.endsWith(".ts") &&
        !entry.name.endsWith(".d.ts")
      ) {
        files.push(file);
      }
    }
  };
  walk(definitionsFolder);
  return files.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Loads every definition the files under the definitions folder export,
 * each once, in the order of their files. No file means no definition, and
 * typescript is then not needed.
 */
export function loadDefinitionFiles(
  paths: DefinitionPaths,
): LoadedDefinition[] {
  const files = definitionFiles(paths.definitionsFolder);
  if (files.length === 0) return [];
  const typescript = loadTypeScript(paths.projectRoot);
  const loader = new Loader(paths, typescript);
  const exporters = new Map<object, string[]>();
  for (const file of files) {
    const exports = loader.load(file, undefined);
    for (const value of exportedValues(exports)) {
      if (definitionRecord(value) === undefined) continue;
      const list = exporters.get(value as object) ?? [];
      if (!list.includes(file)) list.push(file);
      exporters.set(value as object, list);
    }
  }
  const definitions: LoadedDefinition[] = [];
  for (const [value, files] of exporters) {
    const record = definitionRecord(value);
    if (record === undefined) continue;
    const file =
      record.file !== undefined && files.includes(record.file)
        ? record.file
        : (files[0] ?? "");
    definitions.push({ record, file });
  }
  return definitions;
}

/** The values a module exports: `module.exports` itself, then each of its own enumerable properties. */
function exportedValues(exports: unknown): unknown[] {
  if (typeof exports !== "object" || exports === null) return [exports];
  return [exports, ...(Object.values(exports) as unknown[])];
}

/** The path of a file relative to the Map project's root, with `/` separators. */
export function displayPath(projectRoot: string, file: string): string {
  return path.relative(projectRoot, file).split(path.sep).join("/");
}

/** One load: the modules evaluated so far, each once. */
class Loader {
  readonly #paths: DefinitionPaths;
  readonly #typescript: TypeScript & { readonly manifest: string };
  readonly #modules = new Map<string, { exports: unknown }>();
  readonly #packages: NodeJS.Require;

  constructor(
    paths: DefinitionPaths,
    typescript: TypeScript & { readonly manifest: string },
  ) {
    this.#paths = paths;
    this.#typescript = typescript;
    this.#packages = createRequire(
      path.join(paths.projectRoot, "package.json"),
    );
  }

  /** The exports of a definition file, evaluated once per load. */
  load(file: string, importer: string | undefined): unknown {
    const cached = this.#modules.get(file);
    if (cached !== undefined) return cached.exports;
    const module = { exports: {} as unknown };
    this.#modules.set(file, module);
    const text = this.#transpile(file, importer);
    const where = displayPath(this.#paths.projectRoot, file);
    try {
      const evaluate = vm.compileFunction(text, MODULE_PARAMETERS, {
        filename: file,
      }) as (...parameters: unknown[]) => unknown;
      whileEvaluating(file, () =>
        evaluate(
          module.exports,
          (specifier: unknown) => this.#require(specifier, file),
          module,
          file,
          path.dirname(file),
          fourCC,
        ),
      );
    } catch (error) {
      if (error instanceof ObjectDefinitionsError) throw error;
      throw definitionsError(
        "load-failed",
        `${where} threw while loading: ${errorMessage(error)}. Fix it, then build again.`,
        { file },
      );
    }
    return module.exports;
  }

  /** The `require` of a definition module. */
  #require(specifier: unknown, importer: string): unknown {
    const where = displayPath(this.#paths.projectRoot, importer);
    if (typeof specifier !== "string") {
      throw definitionsError(
        "load-failed",
        `${where} requires ${String(specifier)}, which is not a module name.`,
        { file: importer },
      );
    }
    if (specifier === AUTHORING_ENTRY) return authoringEntry;
    if (BUILTINS_KIND_ENTRY.test(specifier)) {
      throw definitionsError(
        "load-failed",
        `${where} imports "${specifier}", whose constants exist only in the map's Lua: an Object definition runs in Node at build time. Name a Built-in object with FourCC instead, such as the Footman's, FourCC("hfoo").`,
        { file: importer },
      );
    }
    if (
      specifier.startsWith("./") ||
      specifier.startsWith("../") ||
      specifier === "." ||
      specifier === ".." ||
      path.isAbsolute(specifier)
    ) {
      return this.load(this.#resolve(specifier, importer), importer);
    }
    return this.#packages(specifier);
  }

  /** The definition file a relative import names, refused outside the definitions folder. */
  #resolve(specifier: string, importer: string): string {
    const { projectRoot, definitionsFolder, generatedFolder } = this.#paths;
    const where = displayPath(projectRoot, importer);
    const target = path.resolve(path.dirname(importer), specifier);
    const folder = displayPath(projectRoot, definitionsFolder);
    if (inside(generatedFolder, target)) {
      throw definitionsError(
        "load-failed",
        `${where} imports "${specifier}", from the generated folder ${displayPath(projectRoot, generatedFolder)}/, whose constants exist only in the map's Lua: an Object definition runs in Node at build time. Name an object with FourCC instead, such as FourCC("h000").`,
        { file: importer },
      );
    }
    if (!inside(definitionsFolder, target)) {
      throw definitionsError(
        "load-failed",
        `${where} imports "${specifier}", a file outside the definitions folder ${folder}/: a definition imports only the files of that folder, packages and Node's built-in modules. Move the file under ${folder}/.`,
        { file: importer },
      );
    }
    const candidates = [
      target,
      `${target}.ts`,
      target.replace(/\.(?:c|m)?js$/, ".ts"),
      path.join(target, "index.ts"),
    ];
    const file = candidates.find(
      (candidate) =>
        candidate.endsWith(".ts") &&
        !candidate.endsWith(".d.ts") &&
        inside(definitionsFolder, candidate) &&
        fs.statSync(candidate, { throwIfNoEntry: false })?.isFile() === true,
    );
    if (file === undefined) {
      throw definitionsError(
        "load-failed",
        `${where} imports "${specifier}", which is no .ts file of the definitions folder ${folder}/.`,
        { file: importer },
      );
    }
    return file;
  }

  /** The CommonJS text of a definition file: from the cache when its modification time and size are the ones transpiled. */
  #transpile(file: string, importer: string | undefined): string {
    let stat: fs.Stats;
    let source: string;
    try {
      stat = fs.statSync(file);
      source = fs.readFileSync(file, "utf8");
    } catch (error) {
      throw definitionsError(
        "load-failed",
        `${displayPath(this.#paths.projectRoot, file)} could not be read: ${errorMessage(error)}.`,
        { file: importer ?? file },
      );
    }
    const cached = transpiled.get(file);
    if (
      cached?.mtimeMs === stat.mtimeMs &&
      cached.size === stat.size &&
      cached.typescript === this.#typescript.manifest
    ) {
      return cached.text;
    }
    const ts = this.#typescript;
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        allowImportingTsExtensions: true,
        verbatimModuleSyntax: false,
        sourceMap: false,
        inlineSourceMap: false,
        declaration: false,
      },
      fileName: file,
      reportDiagnostics: true,
    });
    const error = output.diagnostics?.find(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    );
    if (error !== undefined) {
      const message =
        typeof error.messageText === "string"
          ? error.messageText
          : error.messageText.messageText;
      throw definitionsError(
        "load-failed",
        `${displayPath(this.#paths.projectRoot, file)} could not be transpiled: ${message}`,
        { file },
      );
    }
    transpiled.set(file, {
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      typescript: ts.manifest,
      text: output.outputText,
    });
    return output.outputText;
  }
}

/** Whether `file` is `folder` or under it. */
function inside(folder: string, file: string): boolean {
  const relative = path.relative(folder, file);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

/** The message of a thrown value. */
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * The game's `FourCC`, as a definition module calls it: the integer of a
 * four-character Rawcode, its first character the most significant byte.
 */
export function fourCC(id: unknown): number {
  if (
    typeof id !== "string" ||
    id.length !== 4 ||
    [0, 1, 2, 3].some((index) => id.charCodeAt(index) > 0xff)
  ) {
    throw new TypeError(
      `FourCC takes a Rawcode of four characters, such as "hfoo": ${typeof id === "string" ? JSON.stringify(id) : typeof id} is not one`,
    );
  }
  return (
    (id.charCodeAt(0) << 24) |
    (id.charCodeAt(1) << 16) |
    (id.charCodeAt(2) << 8) |
    id.charCodeAt(3)
  );
}

/**
 * The Map project's typescript, resolved from its root as reforged-builtins
 * is: a `node_modules/typescript` in the root or an ancestor, never through
 * `NODE_PATH`.
 */
function loadTypeScript(
  projectRoot: string,
): TypeScript & { readonly manifest: string } {
  const manifest = findPackage(projectRoot, "typescript");
  if (manifest === undefined) {
    throw definitionsError(
      "peer-missing",
      `typescript is not installed in the Map project (${projectRoot}): Object definitions are transpiled with the Map project's own typescript. Install typescript in the Map project.`,
    );
  }
  let typescript = typescripts.get(manifest);
  if (typescript === undefined) {
    try {
      typescript = createRequire(manifest)(
        path.dirname(manifest),
      ) as TypeScript;
    } catch (error) {
      throw definitionsError(
        "peer-missing",
        `typescript could not be loaded from ${path.dirname(manifest)}: ${errorMessage(error)}. Install typescript in the Map project again.`,
      );
    }
    if (typeof typescript.transpileModule !== "function") {
      throw definitionsError(
        "peer-missing",
        `typescript ${typescript.version} in ${path.dirname(manifest)} has no transpileModule: Object definitions need a typescript with its JavaScript API, such as typescript 5 or 6.`,
      );
    }
    typescripts.set(manifest, typescript);
  }
  return Object.assign(Object.create(typescript) as TypeScript, { manifest });
}

/** The package.json of `node_modules/<name>` in `from` or its nearest ancestor that has one. */
function findPackage(from: string, name: string): string | undefined {
  let dir = path.resolve(from);
  for (;;) {
    const manifest = path.join(dir, "node_modules", name, "package.json");
    if (fs.statSync(manifest, { throwIfNoEntry: false })?.isFile()) {
      return manifest;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}
