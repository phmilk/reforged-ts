// The plugin's language service: hover and go to definition on a Rawcode
// literal (#595), from the Rawcode lookup the lint rule calls too (#579).
// Every other request, and every request the plugin fails on, is the
// language service's own.

import fs from "node:fs";
import path from "node:path";
import type * as ts from "typescript";
import { builtinsFiles } from "../builtins.js";
import {
  DEFAULT_MIN_INTERVAL,
  openRawcodeLookup,
  type RawcodeLookup,
  type RawcodeLookupResult,
} from "../lookup.js";
import { rawcodeDefinitions } from "./definition.js";
import { rawcodeHoverText } from "./hover.js";
import { rawcodeLiteralAt, type RawcodeLiteral } from "./literal.js";

/** The prefix of every line the plugin writes to the tsserver log. */
const LOG_PREFIX = "reforged-map/typescript-plugin:";

/** The folder, under the project root, where the map folder is looked for without the option and with none at the root, until 1.0.0 (ADR 0020). */
const MAPS_FOLDER = "maps";

/** The lines already logged in this tsserver process: each is logged once. */
const logged = new Set<string>();

/** One lookup per map folder and project root, for the tsserver process. */
const lookups = new Map<string, RawcodeLookup>();

/**
 * Decorates a project's language service with hover and go to definition on
 * Rawcode literals.
 *
 * @param typescript - The `typescript` module tsserver handed the plugin.
 * @param info - The project, its language service and the plugin's tsconfig entry.
 * @returns The decorated language service, or the project's own when
 *   `reforged-builtins` is not installed.
 */
export function create(
  typescript: typeof ts,
  info: ts.server.PluginCreateInfo,
): ts.LanguageService {
  const log = (line: string): void => {
    if (logged.has(line)) return;
    logged.add(line);
    info.project.projectService.logger.info(`${LOG_PREFIX} ${line}`);
  };
  const languageService = info.languageService;
  const root = projectRoot(typescript, info.project);
  if (builtinsFiles(root) === undefined) {
    log(
      `Rawcode details are off: reforged-builtins is not installed in the project root ${root}. Install it to see Rawcode details.`,
    );
    return languageService;
  }
  const config = info.config as { mapFolder?: unknown } | undefined;
  const option = config?.mapFolder;
  if (option !== undefined && typeof option !== "string") {
    log(
      "The mapFolder option is not a string: it is ignored, and the map folder is looked for at the project root, then under maps/.",
    );
  }
  const source = rawcodeSource(
    root,
    typeof option === "string" ? option : undefined,
  );
  const first = source.mapFolder();
  log(
    "mapFolder" in first
      ? `loaded for the project root ${root}, map folder ${first.mapFolder}.`
      : `loaded for the project root ${root}, without a map folder: ${first.reason}`,
  );

  /** The literal at a position, and what the lookup says of it. */
  const resolve = (
    fileName: string,
    position: number,
  ):
    | {
        literal: RawcodeLiteral;
        result: RawcodeLookupResult;
        lookup: RawcodeLookup | undefined;
        program: ts.Program;
      }
    | undefined => {
    const program = languageService.getProgram();
    const sourceFile = program?.getSourceFile(fileName);
    if (program === undefined || sourceFile === undefined) return undefined;
    const literal = rawcodeLiteralAt(
      typescript,
      program.getTypeChecker(),
      sourceFile,
      position,
    );
    if (literal === undefined) return undefined;
    const { result, lookup } = source.lookup(literal);
    if (result.status === "unavailable") log(result.reason);
    return { literal, result, lookup, program };
  };

  // Every member of the language service, then the three requests the
  // plugin answers.
  const members = languageService as unknown as Record<string, unknown>;
  const copy: Record<string, unknown> = Object.create(null) as Record<
    string,
    unknown
  >;
  for (const key of Object.keys(members)) {
    const member = members[key];
    copy[key] =
      typeof member === "function"
        ? (...args: unknown[]) =>
            (member as (...args: unknown[]) => unknown).apply(
              languageService,
              args,
            )
        : member;
  }
  const proxy = copy as unknown as ts.LanguageService;

  proxy.getQuickInfoAtPosition = (fileName, position, ...rest) => {
    const own = languageService.getQuickInfoAtPosition(
      fileName,
      position,
      ...rest,
    );
    try {
      const found = resolve(fileName, position);
      if (found === undefined) return own;
      const text = rawcodeHoverText(
        found.literal,
        found.result,
        found.lookup?.gameVersion(),
      );
      return withText(typescript, own, found.literal.node, text);
    } catch (error) {
      log(`hover failed: ${message(error)}`);
      return own;
    }
  };

  const definitionsAt = (
    fileName: string,
    position: number,
  ): { definitions: ts.DefinitionInfo[]; span: ts.TextSpan } | undefined => {
    const found = resolve(fileName, position);
    if (found === undefined) return undefined;
    const definitions = rawcodeDefinitions(
      typescript,
      found.program,
      fileName,
      found.result,
    );
    for (const definition of definitions) {
      ensureScriptInfo(typescript, info.project, definition.fileName);
    }
    return definitions.length === 0
      ? undefined
      : { definitions, span: spanOf(found.literal.node) };
  };

  proxy.getDefinitionAtPosition = (fileName, position, ...rest) => {
    const own = languageService.getDefinitionAtPosition(
      fileName,
      position,
      ...rest,
    );
    try {
      const ours = definitionsAt(fileName, position);
      return ours === undefined ? own : [...ours.definitions, ...(own ?? [])];
    } catch (error) {
      log(`go to definition failed: ${message(error)}`);
      return own;
    }
  };

  proxy.getDefinitionAndBoundSpan = (fileName, position) => {
    const own = languageService.getDefinitionAndBoundSpan(fileName, position);
    try {
      const ours = definitionsAt(fileName, position);
      return ours === undefined
        ? own
        : {
            definitions: [...ours.definitions, ...(own?.definitions ?? [])],
            textSpan: ours.span,
          };
    } catch (error) {
      log(`go to definition failed: ${message(error)}`);
      return own;
    }
  };

  return proxy;
}

/** Where the plugin's lookups come from: the map folder, found or named, and its lookup. */
interface RawcodeSource {
  /** The map folder, or why there is none. */
  mapFolder(): { mapFolder: string } | { reason: string };
  /** What the lookup says of a literal, and the lookup that said it. */
  lookup(literal: RawcodeLiteral): {
    result: RawcodeLookupResult;
    lookup: RawcodeLookup | undefined;
  };
}

/**
 * The map folder named by the option, against the project root, or found as
 * the one map folder at the project root or else under its `maps/`, looked for again at most
 * once per second; and the lookup over it, shared by every project with the
 * same map folder and project root.
 */
function rawcodeSource(
  root: string,
  option: string | undefined,
): RawcodeSource {
  let found: { mapFolder: string } | { reason: string } | undefined;
  let foundAt = 0;
  const mapFolder = (): { mapFolder: string } | { reason: string } => {
    if (option !== undefined) return { mapFolder: path.resolve(root, option) };
    const now = Date.now();
    if (
      found === undefined ||
      now < foundAt ||
      now - foundAt >= DEFAULT_MIN_INTERVAL
    ) {
      found = discoverMapFolder(root);
      foundAt = now;
    }
    return found;
  };
  return {
    mapFolder,
    lookup(literal) {
      const rawcode =
        literal.form === "string" ? literal.rawcode : (literal.rawcode ?? "");
      const folder = mapFolder();
      if (!("mapFolder" in folder)) {
        // A malformed literal is malformed even without a map folder, as the
        // lookup answers it.
        return {
          result: /^[\x20-\x7e]{4}$/.test(rawcode)
            ? { status: "unavailable", reason: folder.reason }
            : { status: "malformed", rawcode },
          lookup: undefined,
        };
      }
      const key = `${folder.mapFolder}\0${root}`;
      let lookup = lookups.get(key);
      if (lookup === undefined) {
        lookup = openRawcodeLookup({
          mapFolder: folder.mapFolder,
          projectRoot: root,
        });
        lookups.set(key, lookup);
      }
      try {
        return { result: lookup.lookup(rawcode), lookup };
      } catch (error) {
        return {
          result: { status: "unavailable", reason: message(error) },
          lookup,
        };
      }
    },
  };
}

/**
 * The map folders directly in `folder`: the folders, or links to one, whose
 * names end in `.w3x` or `.w3m`, ignoring case, sorted; none when `folder`
 * cannot be read.
 */
function mapFoldersIn(folder: string): string[] {
  try {
    return fs
      .readdirSync(folder, { withFileTypes: true })
      .filter(
        (entry) =>
          (entry.isDirectory() ||
            (entry.isSymbolicLink() &&
              fs
                .statSync(path.join(folder, entry.name), {
                  throwIfNoEntry: false,
                })
                ?.isDirectory() === true)) &&
          /\.w3[xm]$/i.test(entry.name),
      )
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

/**
 * The one map folder directly at `<root>`, or with none there the one
 * directly under `<root>/maps/`, until 1.0.0 (ADR 0020): a folder whose name
 * ends in `.w3x` or `.w3m`, ignoring case. None or several is a reason
 * naming what was found, where it looked and the option to set.
 */
export function discoverMapFolder(
  root: string,
): { mapFolder: string } | { reason: string } {
  const option =
    'set the mapFolder option of reforged-map/typescript-plugin in tsconfig.json ({ "name": "reforged-map/typescript-plugin", "mapFolder": "<path>" })';
  const atRoot = mapFoldersIn(root);
  if (atRoot.length === 1) return { mapFolder: path.join(root, atRoot[0]) };
  if (atRoot.length > 1) {
    return {
      reason: `${String(atRoot.length)} map folders at ${root} (${atRoot.join(", ")}): ${option} to the one to read.`,
    };
  }
  const maps = path.join(root, MAPS_FOLDER);
  const names = mapFoldersIn(maps);
  if (names.length === 1) return { mapFolder: path.join(maps, names[0]) };
  return {
    reason:
      names.length === 0
        ? `no map folder (a folder whose name ends in .w3x or .w3m) at ${root} or under ${maps}: ${option}.`
        : `${String(names.length)} map folders under ${maps} (${names.join(", ")}): ${option} to the one to read.`,
  };
}

/**
 * The Map project's root: the nearest folder holding a package.json, from
 * the folder of the project's tsconfig (or the inferred project's
 * directory); that folder itself when none above has one.
 */
function projectRoot(
  typescript: typeof ts,
  project: ts.server.Project,
): string {
  const start =
    project.projectKind === typescript.server.ProjectKind.Configured
      ? path.dirname(project.getProjectName())
      : project.getCurrentDirectory();
  let dir = path.resolve(start);
  for (;;) {
    if (
      fs
        .statSync(path.join(dir, "package.json"), { throwIfNoEntry: false })
        ?.isFile()
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(start);
    dir = parent;
  }
}

/**
 * Makes tsserver know a file a definition points to, which a constants
 * module the program does not import is not, so that it can map the span to
 * lines.
 */
function ensureScriptInfo(
  typescript: typeof ts,
  project: ts.server.Project,
  fileName: string,
): void {
  const service = project.projectService;
  const normalized = typescript.server.toNormalizedPath(fileName);
  if (service.getScriptInfoForNormalizedPath(normalized) === undefined) {
    service.getOrCreateScriptInfoForNormalizedPath(normalized, false);
  }
}

/** TypeScript's own quick info with the plugin's text after it, or a quick info of the plugin's own. */
function withText(
  typescript: typeof ts,
  own: ts.QuickInfo | undefined,
  node: ts.Node,
  text: string,
): ts.QuickInfo {
  const part: ts.SymbolDisplayPart = { kind: "text", text };
  if (own === undefined) {
    return {
      kind: typescript.ScriptElementKind.unknown,
      kindModifiers: "",
      textSpan: spanOf(node),
      displayParts: [],
      documentation: [part],
      tags: [],
    };
  }
  const documentation = own.documentation ?? [];
  return {
    ...own,
    documentation:
      documentation.length === 0
        ? [part]
        : [...documentation, { kind: "lineBreak", text: "\n\n" }, part],
  };
}

function spanOf(node: ts.Node): ts.TextSpan {
  const start = node.getStart(node.getSourceFile());
  return { start, length: node.end - start };
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
