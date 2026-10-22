// From #582, the decision #466 (pitfall C1): a Rawcode literal that names no
// Built-in object of the Patch and no object of the map. `FourCC` with an
// unknown literal compiles, since it returns an `UnknownRawcode` every
// Rawcode parameter accepts (ADR 0012), and fails only in game: the creator
// returns nothing, which reaches the next Native as a nil Handle, and
// `Unit.create` throws (ADR 0003).
//
// Order: the syntax (a `FourCC` call with one string or template literal
// without substitutions, a number literal cast to a type), then the checker
// for the matched node (the global `FourCC`, a Rawcode type), then the
// four-character check, which needs no list, then the Rawcode lookup of the
// Map project's reforged-map (#579), which reads the map folder and
// reforged-builtins' index and follows a World Editor save on its own.
// Without the lookup, or while it is unavailable, only the four-character
// check runs, and the reason is warned once.
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";
import * as ts from "typescript";

import {
  decodeRawcode,
  encodeRawcode,
  isGlobalFourCC,
  isRawcodeShape,
  isRawcodeType,
} from "../classify/rawcode.js";
import { createRule } from "../create-rule.js";
import type {
  OpenRawcodeLookup,
  RawcodeLookup,
  RawcodeLookupResult,
  RawcodeObject,
} from "../data/index.js";
import { pluginMeta } from "../meta.js";
import { defineRuleEntry } from "../rule-entry.js";

export const name = "no-unknown-rawcodes";

type Options = [];
type MessageIds =
  "unknownRawcode" | "notInGameDataSet" | "malformedRawcode" | "replaceRawcode";

/** The folder, under the project root, where the map folder is looked for without the setting and with none at the root, until 1.0.0 (ADR 0020). */
const MAPS_FOLDER = "maps";

/** How often the map folder is looked for again, as the lookup checks its files: once a second. */
const DISCOVERY_INTERVAL = 1000;

/** The setting that names the map folder. */
const SETTING = "settings.reforged.mapFolder";

/** A Rawcode literal the rule checks, in its form. */
type RawcodeLiteral =
  | {
      readonly form: "string";
      readonly node: TSESTree.Literal | TSESTree.TemplateLiteral;
      readonly text: string;
    }
  | {
      readonly form: "number";
      readonly node: TSESTree.Literal;
      readonly value: number;
    };

/** The map folder, or why there is none. */
type MapFolder = { readonly mapFolder: string } | { readonly reason: string };

/**
 * The map folders directly in `folder`: the folders whose names end in
 * `.w3x` or `.w3m`, ignoring case, sorted; none when `folder` cannot be read.
 */
function mapFoldersIn(folder: string): string[] {
  try {
    return readdirSync(folder)
      .filter(
        (entry) =>
          /\.w3[xm]$/i.test(entry) &&
          statSync(path.join(folder, entry), {
            throwIfNoEntry: false,
          })?.isDirectory() === true,
      )
      .sort();
  } catch {
    return [];
  }
}

/**
 * The one map folder directly at `<root>`, or with none there the one
 * directly under `<root>/maps/`, until 1.0.0 (ADR 0020): a folder whose name
 * ends in `.w3x` or `.w3m`, ignoring case. None or several is a reason
 * naming what was found, where it looked and the setting to add.
 */
export function discoverMapFolder(root: string): MapFolder {
  const setting = `set ${SETTING} in the ESLint config to the map folder, absolute or relative to ${root}.`;
  const atRoot = mapFoldersIn(root);
  if (atRoot.length === 1) {
    return { mapFolder: path.join(root, atRoot[0]) };
  }
  if (atRoot.length > 1) {
    return {
      reason: `${String(atRoot.length)} map folders at ${root} (${atRoot.join(", ")}): ${setting}`,
    };
  }
  const maps = path.join(root, MAPS_FOLDER);
  const names = mapFoldersIn(maps);
  if (names.length === 1) {
    return { mapFolder: path.join(maps, names[0]) };
  }
  return {
    reason:
      names.length === 0
        ? `no map folder (a folder whose name ends in .w3x or .w3m) at ${root} or under ${maps}: ${setting}`
        : `${String(names.length)} map folders under ${maps} (${names.join(", ")}): ${setting}`,
  };
}

/** The literal as the messages show it: a string in backticks, a number with the Rawcode it decodes to. */
function shown(literal: RawcodeLiteral, raw: string): string {
  if (literal.form === "string") {
    return `\`${literal.text}\``;
  }
  const decoded = decodeRawcode(literal.value);
  if (decoded === undefined) {
    return `\`${raw}\``;
  }
  if (isRawcodeShape(decoded)) {
    return `\`${raw}\` (\`${decoded}\`)`;
  }
  // Four bytes, each one UTF-16 code unit below 0x100.
  const bytes = Array.from({ length: 4 }, (_, index) =>
    decoded.charCodeAt(index).toString(16).padStart(2, "0"),
  ).join(" ");
  return `\`${raw}\` (bytes ${bytes})`;
}

/** An object as a suggestion names it: `Paladin, unit`, or its kind alone. */
function described(object: RawcodeObject): string {
  return object.name === undefined
    ? object.kind
    : `${object.name}, ${object.kind}`;
}

/** The source text of `rawcode` in the literal's own form: its quotes, its backticks, or its decimal integer. */
function rewritten(
  literal: RawcodeLiteral,
  raw: string,
  rawcode: string,
): string {
  if (literal.form === "number") {
    return String(encodeRawcode(rawcode));
  }
  const quote = raw[0];
  let body = rawcode.replaceAll("\\", "\\\\").replaceAll(quote, `\\${quote}`);
  if (quote === "`") {
    body = body.replaceAll("${", "\\${");
  }
  return `${quote}${body}${quote}`;
}

/** One lookup per map folder, and the warnings already printed, for one plugin. */
function createLookups(
  open: OpenRawcodeLookup | undefined,
  projectRoot: string,
) {
  const lookups = new Map<string, RawcodeLookup>();
  const warned = new Set<string>();
  let discovered: MapFolder | undefined;
  let discoveredAt = 0;

  /** Warns once per line: the reason the existence check is off, or a note that leaves it on. */
  function warn(reason: string, off = true): void {
    const line = off
      ? `${pluginMeta.name}: reforged/${name} checks only that a Rawcode is four characters: ${reason}`
      : `${pluginMeta.name}: reforged/${name}: ${reason}`;
    if (warned.has(line)) {
      return;
    }
    warned.add(line);
    console.warn(line);
  }

  function mapFolder(setting: unknown): MapFolder {
    if (typeof setting === "string") {
      return { mapFolder: path.resolve(projectRoot, setting) };
    }
    if (setting !== undefined) {
      warn(
        `${SETTING} is not a string, so the map folder is looked for at the project root, then under ${MAPS_FOLDER}/.`,
        false,
      );
    }
    const now = Date.now();
    // A clock set back counts as the interval passed.
    if (
      discovered === undefined ||
      now < discoveredAt ||
      now - discoveredAt >= DISCOVERY_INTERVAL
    ) {
      discovered = discoverMapFolder(projectRoot);
      discoveredAt = now;
    }
    return discovered;
  }

  /**
   * What the lookup says of a well-formed Rawcode, with the Game version;
   * undefined, warned once, when there is no lookup to ask.
   */
  return function lookUp(
    setting: unknown,
    rawcode: string,
  ):
    | { readonly result: RawcodeLookupResult; readonly gameVersion: string }
    | undefined {
    if (open === undefined) {
      // The plugin warned at load.
      return undefined;
    }
    const folder = mapFolder(setting);
    if (!("mapFolder" in folder)) {
      warn(folder.reason);
      return undefined;
    }
    try {
      let lookup = lookups.get(folder.mapFolder);
      if (lookup === undefined) {
        lookup = open({ mapFolder: folder.mapFolder, projectRoot });
        lookups.set(folder.mapFolder, lookup);
      }
      const result = lookup.lookup(rawcode);
      if (result.status === "unavailable") {
        warn(result.reason);
        return undefined;
      }
      for (const warning of lookup.warnings()) {
        warn(warning, false);
      }
      return { result, gameVersion: lookup.gameVersion() ?? "(unknown)" };
    } catch (error) {
      // The lookup never throws (#579); one that does counts as unavailable.
      warn(
        `the Rawcode lookup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  };
}

export function createNoUnknownRawcodes(
  open: OpenRawcodeLookup | undefined,
  projectRoot: string,
) {
  const lookUp = createLookups(open, projectRoot);
  return createRule<Options, MessageIds>({
    name,
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow a Rawcode literal that names no Built-in object and no object of the map",
      },
      hasSuggestions: true,
      messages: {
        unknownRawcode:
          "{{rawcode}} is neither a Built-in object of Patch {{gameVersion}} nor an object of this map: creating it gives nothing in game, a nil Handle the next Native gets, and `Unit.create` throws. Pick the Rawcode you meant from a suggestion or from the Object Editor.",
        notInGameDataSet:
          "{{rawcode}}{{name}} is a Built-in {{kind}} of Patch {{gameVersion}} but not of this map's Game data set ({{set}}): the game finds no such object in this map, so creating it gives nothing. Use an object of that Game data set, or change the map's Game data set in the World Editor's Map Options.",
        malformedRawcode:
          "{{rawcode}} is not a Rawcode: a Rawcode is exactly four ASCII characters, so the number it gives names no object and creating it gives nothing in game. Write the object's four-character Rawcode, as the Object Editor shows it.",
        replaceRawcode: "Replace with `{{rawcode}}` ({{object}})",
      },
      schema: [],
      defaultOptions: [],
    },
    create(context) {
      const services = ESLintUtils.getParserServices(context);
      const checker = services.program.getTypeChecker();
      const { sourceCode } = context;
      // A shared setting holds whatever the config wrote.
      const reforged: unknown = context.settings.reforged;
      const setting =
        typeof reforged === "object" && reforged !== null
          ? (reforged as { mapFolder?: unknown }).mapFolder
          : undefined;

      function check(literal: RawcodeLiteral): void {
        const raw = sourceCode.getText(literal.node);
        const rawcode =
          literal.form === "string"
            ? literal.text
            : decodeRawcode(literal.value);
        const display = shown(literal, raw);
        if (rawcode === undefined || !isRawcodeShape(rawcode)) {
          context.report({
            node: literal.node,
            messageId: "malformedRawcode",
            data: { rawcode: display },
          });
          return;
        }
        const found = lookUp(setting, rawcode);
        if (found === undefined) {
          return;
        }
        const { result, gameVersion } = found;
        if (result.status === "unknown") {
          const suggest: TSESLint.SuggestionReportDescriptor<MessageIds>[] =
            result.suggestions.map((suggestion) => ({
              messageId: "replaceRawcode",
              data: {
                rawcode: suggestion.rawcode,
                object: described(suggestion),
              },
              fix: (fixer) =>
                fixer.replaceText(
                  literal.node,
                  rewritten(literal, raw, suggestion.rawcode),
                ),
            }));
          context.report({
            node: literal.node,
            messageId: "unknownRawcode",
            data: { rawcode: display, gameVersion },
            suggest,
          });
        } else if (result.status === "not-in-game-data-set") {
          const [first] = result.objects;
          context.report({
            node: literal.node,
            messageId: "notInGameDataSet",
            data: {
              rawcode: display,
              name: first.name === undefined ? "" : ` (${first.name})`,
              kind: result.objects.map((object) => object.kind).join(" and "),
              gameVersion,
              set: result.gameDataSet.label,
            },
          });
        }
      }

      function checkCast(
        node: TSESTree.TSAsExpression | TSESTree.TSTypeAssertion,
      ): void {
        const { expression } = node;
        if (
          expression.type !== AST_NODE_TYPES.Literal ||
          typeof expression.value !== "number" ||
          expression.value === 0
        ) {
          return;
        }
        const assertion = services.esTreeNodeToTSNodeMap.get(node);
        if (!isRawcodeType(checker.getTypeFromTypeNode(assertion.type))) {
          return;
        }
        check({ form: "number", node: expression, value: expression.value });
      }

      return {
        CallExpression(node) {
          const [argument] = node.arguments;
          if (
            node.callee.type !== AST_NODE_TYPES.Identifier ||
            node.callee.name !== "FourCC" ||
            node.arguments.length !== 1
          ) {
            return;
          }
          let text: string | undefined;
          if (
            argument.type === AST_NODE_TYPES.Literal &&
            typeof argument.value === "string"
          ) {
            text = argument.value;
          } else if (
            argument.type === AST_NODE_TYPES.TemplateLiteral &&
            argument.expressions.length === 0
          ) {
            // `cooked` is null in a tagged template with an invalid escape.
            text = argument.quasis[0]?.value.cooked ?? undefined;
          }
          if (text === undefined) {
            return;
          }
          const callee = services.esTreeNodeToTSNodeMap.get(node.callee);
          if (!ts.isIdentifier(callee) || !isGlobalFourCC(checker, callee)) {
            return;
          }
          check({
            form: "string",
            node: argument as TSESTree.Literal | TSESTree.TemplateLiteral,
            text,
          });
        },
        TSAsExpression: checkCast,
        TSTypeAssertion: checkCast,
      };
    },
  });
}

export default defineRuleEntry({
  name,
  severity: "warn",
  reduced: {
    without: ["reforged-map"],
    off: "the check that a Rawcode names an object; the four-character check still runs",
  },
  create: (data) =>
    createNoUnknownRawcodes(data.openRawcodeLookup, data.projectRoot),
});
