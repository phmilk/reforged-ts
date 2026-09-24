/**
 * The TSDoc header of a generated declaration: signature-derived tags plus
 * the Overlay facts, no summary sentence. Tags come in a fixed order and are
 * only standard TSDoc tags or the custom tags declared for the workspace
 * (`@native`, `@patch`, `@async`, `@bug`); a new Overlay fact is one more
 * tag in `factTags`.
 */
import { docType } from "./jass-types.js";
import type {
  ResolvedFunction,
  ResolvedGlobal,
  ResolvedType,
} from "./resolve.js";

const JASSBOT = "https://lep.duckdns.org/jassbot/doc/";

/** The Overlay facts a header shows, for any kind of declaration. */
export interface HeaderFacts {
  /** Patch build, rendered as `@patch`. */
  since?: string | undefined;
  async?: boolean | undefined;
  deprecated?: string | undefined;
  /** Rendered as `@remarks`. */
  notes?: string | undefined;
}

export function functionHeader(fn: ResolvedFunction): string[] {
  return docComment(functionTags(fn));
}

function functionTags(fn: ResolvedFunction): string[] {
  return [
    ...fn.params.map(
      (param) => `@param ${param.name} - ${docType(param.type)}`
    ),
    `@returns ${docType(fn.returns)}`,
    ...factTags(fn.overlay),
    seeTag(fn.name),
  ];
}

/** `@patch`, `@async`, `@deprecated`, `@remarks`, each when its fact is set. */
export function factTags(facts: HeaderFacts): string[] {
  const tags: string[] = [];
  if (facts.since !== undefined) tags.push(`@patch ${facts.since}`);
  if (facts.async) tags.push("@async");
  if (facts.deprecated !== undefined) {
    tags.push(`@deprecated ${facts.deprecated}`);
  }
  if (facts.notes !== undefined) tags.push(`@remarks ${facts.notes}`);
  return tags;
}

export function seeTag(name: string): string {
  return `@see {@link ${JASSBOT}${name}}`;
}

/** A tag whose text spans several lines continues on the next comment lines. */
export function docComment(tags: readonly string[]): string[] {
  const lines = tags.flatMap((tag) => tag.split(/\r?\n/));
  return [
    "/**",
    ...lines.map((line) => (line === "" ? " *" : ` * ${line}`)),
    " */",
  ];
}

/**
 * A global's header: a first line with its Jass form (`constant`, the Jass
 * type, `array`), the initializer as `@defaultValue`, the Overlay facts and
 * the reference page. The initializer is never a literal type; a `*\/` in
 * it is escaped so it cannot close the comment.
 */
export function globalHeader(global: ResolvedGlobal): string[] {
  const form = [
    ...(global.constant ? ["constant"] : []),
    docType(global.type),
    ...(global.array ? ["array"] : []),
  ].join(" ");
  const initializer = global.initializer?.replaceAll("*/", "*\\/");
  return docComment([
    `Jass: ${form}`,
    ...(initializer === undefined ? [] : [`@defaultValue \`${initializer}\``]),
    ...factTags(global.overlay),
    seeTag(global.name),
  ]);
}

/** A type's header, only when its optional entry carries a fact. */
export function typeHeader(type: ResolvedType): string[] {
  const tags = type.overlay ? factTags(type.overlay) : [];
  return tags.length === 0 ? [] : docComment(tags);
}
