/**
 * The TSDoc header of a generated declaration: signature-derived tags only,
 * no summary sentence. Tags come in a fixed order; a new Overlay fact is one
 * more tag in `functionTags`.
 */
import { docType } from "./jass-types.js";
import type { ResolvedFunction } from "./resolve.js";

const JASSBOT = "https://lep.duckdns.org/jassbot/doc/";

export function functionHeader(fn: ResolvedFunction): string[] {
  return docComment(functionTags(fn));
}

function functionTags(fn: ResolvedFunction): string[] {
  return [
    ...fn.params.map(
      (param) => `@param ${param.name} - ${docType(param.type)}`
    ),
    `@returns ${docType(fn.returns)}`,
    seeTag(fn.name),
  ];
}

function seeTag(name: string): string {
  return `@see {@link ${JASSBOT}${name}}`;
}

function docComment(tags: readonly string[]): string[] {
  return ["/**", ...tags.map((tag) => ` * ${tag}`), " */"];
}
