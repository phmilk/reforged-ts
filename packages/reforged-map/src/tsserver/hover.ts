// The hover text of a Rawcode literal, built from the lookup's result in the
// words of the generated TSDoc (#579) and of the lint rule's messages (#582).
// The one function that builds it, so that a later line (the Studio's link)
// has one place to go.

import type {
  RawcodeLookupResult,
  RawcodeObject,
  RawcodeConstant,
} from "../lookup.js";
import { displayPath } from "../definitions-loader.js";
import { UNNAMED } from "../names.js";
import type { RawcodeLiteral } from "./literal.js";

/**
 * The hover text of a Rawcode literal, in Markdown: what the lookup says it
 * names, or why it names nothing.
 *
 * @param literal - The literal, in its form.
 * @param result - What the lookup returned for it.
 * @param gameVersion - The Game version of the index the lookup read.
 * @param projectRoot - The Map project's root, which the file of an
 *   Object definition is shown relative to.
 * @returns Paragraphs separated by blank lines.
 */
export function rawcodeHoverText(
  literal: RawcodeLiteral,
  result: RawcodeLookupResult,
  gameVersion: string | undefined,
  projectRoot: string,
): string {
  const patch = `Patch ${gameVersion ?? "(unknown)"}`;
  const paragraphs: string[] = [];
  if (result.status === "unavailable") {
    return `Rawcode details are unavailable: ${result.reason}`;
  }
  if (literal.form === "number") {
    paragraphs.push(
      numberLine(literal.node.getText(), literal.value, literal.rawcode),
    );
  }
  switch (result.status) {
    case "known": {
      if (result.objects.length > 1) {
        paragraphs.push(
          `${code(result.rawcode)} names ${andList(result.objects.map((object) => `a ${originWord(object)} ${object.kind}`))}, so \`FourCC\` gives no single kind.`,
        );
      }
      for (const object of result.objects) {
        paragraphs.push(objectBlock(object, patch, projectRoot));
      }
      break;
    }
    case "not-in-game-data-set": {
      for (const object of result.objects) {
        paragraphs.push(objectBlock(object, patch, projectRoot));
      }
      for (const object of result.objects) {
        const name = object.name === undefined ? "" : ` (${object.name})`;
        paragraphs.push(
          `${code(object.rawcode)}${name} is a Built-in ${object.kind} of ${patch} but not of this map's Game data set (${result.gameDataSet.label}).`,
        );
      }
      break;
    }
    case "unknown": {
      paragraphs.push(
        `${code(result.rawcode)} is neither a Built-in object of ${patch} nor an object of this map.`,
      );
      if (result.suggestions.length > 0) {
        paragraphs.push(
          [
            "One edit away:",
            ...result.suggestions.map(
              (suggestion) =>
                `- ${code(suggestion.rawcode)} (${suggestion.name === undefined ? "" : `${suggestion.name}, `}${suggestion.kind})`,
            ),
          ].join("\n"),
        );
      }
      break;
    }
    case "malformed": {
      // A cast number's line already says which bytes it gives.
      if (literal.form === "string") {
        paragraphs.push(
          `${code(result.rawcode)} is not a Rawcode: a Rawcode is exactly four ASCII characters.`,
        );
      }
      break;
    }
  }
  return paragraphs.join("\n\n");
}

/** What a cast number decodes to: a Rawcode, or bytes that are not one. */
function numberLine(
  source: string,
  value: number,
  rawcode: string | undefined,
): string {
  const number =
    source === String(value)
      ? code(source)
      : `${code(source)} (${String(value)})`;
  if (rawcode === undefined) {
    return `${number} is not a Rawcode: it does not fit in four bytes.`;
  }
  if (!/^[\x20-\x7e]{4}$/.test(rawcode)) {
    const bytes = Array.from({ length: rawcode.length }, (_, index) =>
      rawcode.charCodeAt(index).toString(16).padStart(2, "0"),
    ).join(" ");
    return `${number} is not a Rawcode: its four bytes, ${bytes}, are not four ASCII characters.`;
  }
  return `${number} is the Rawcode ${code(rawcode)}.`;
}

/**
 * One object: its sentence, the Object definition that defines it, then its
 * race, its Game data sets and its constant, in the order of the generated
 * TSDoc.
 */
function objectBlock(
  object: RawcodeObject,
  patch: string,
  projectRoot: string,
): string {
  const lines = [objectSentence(object, patch)];
  if (object.origin !== "builtin" && object.definitionFile !== undefined) {
    lines.push(
      `Defined in code, by the Object definition in ${code(displayPath(projectRoot, object.definitionFile))}.`,
    );
  }
  if (object.race !== undefined) lines.push(`Race: ${object.race}.`);
  if (object.origin !== "custom" && object.gameDataSets.length > 0) {
    const sets = object.gameDataSets.map((set) => set.label);
    lines.push(
      `In the ${andList(sets)} Game data set${sets.length > 1 ? "s" : ""}.`,
    );
  }
  if (object.constant !== undefined) lines.push(constantLine(object.constant));
  return lines.join("\n\n");
}

/** The sentence the generated TSDoc opens with. */
function objectSentence(object: RawcodeObject, patch: string): string {
  const rawcode = code(object.rawcode);
  if (object.origin === "custom") {
    const base =
      object.base.name === undefined
        ? code(object.base.rawcode)
        : `${object.base.name} (${code(object.base.rawcode)})`;
    return `**${object.name ?? UNNAMED}** (${rawcode}), a Custom ${object.kind} of this map, derived from ${base}.`;
  }
  const builtinName =
    object.origin === "builtin" ? object.name : object.builtinName;
  const game =
    builtinName === undefined
      ? `${rawcode}, a Built-in ${object.kind} of ${patch}`
      : `**${builtinName}** (${rawcode}), a Built-in ${object.kind} of ${patch}`;
  if (object.origin === "builtin") return `${game}.`;
  return object.mapName === undefined
    ? `${game}, which this map modifies.`
    : `${game}, named ${object.mapName} in this map.`;
}

function constantLine(constant: RawcodeConstant): string {
  const from = constant.generated
    ? `the generated ${code(constant.module)}`
    : code(constant.module);
  return `Its constant is ${code(`${constant.object}.${constant.member}`)}, from ${from}.`;
}

function originWord(object: RawcodeObject): string {
  return object.origin === "custom" ? "Custom" : "Built-in";
}

/** `a`, `a and b`, `a, b and c`. */
function andList(items: readonly string[]): string {
  return items.length < 2
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items.at(-1) ?? ""}`;
}

/** Inline code, fenced by two backticks when the text holds one. */
function code(text: string): string {
  return text.includes("`") ? `\`\` ${text} \`\`` : `\`${text}\``;
}
