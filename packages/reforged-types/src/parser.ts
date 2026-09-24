/**
 * Hand-written, line-oriented parser for the Jass declaration grammar present
 * in the Patch files. Any line it does not understand is an error with file
 * and line; nothing is skipped silently.
 *
 * The parser is a small state machine over regions: top level, a function
 * body (skipped up to `endfunction`) and a `globals` block. Each region has
 * one handler; a new region is one more handler and one more top-level rule.
 */
import type { Diagnostic } from "./diagnostics.js";
import type {
  Declaration,
  FunctionDeclaration,
  Parameter,
  SourceName,
} from "./model.js";

export interface ParseResult {
  declarations: Declaration[];
  diagnostics: Diagnostic[];
}

type Region =
  | { kind: "top" }
  | { kind: "function"; declaration: FunctionDeclaration }
  | { kind: "globals"; line: number };

interface Context {
  source: SourceName;
  declarations: Declaration[];
  diagnostics: Diagnostic[];
  region: Region;
}

const IDENT = "[A-Za-z_][A-Za-z0-9_]*";
const TYPE = new RegExp(`^type\\s+(${IDENT})\\s+extends\\s+(${IDENT})$`);
const NATIVE = new RegExp(
  `^(constant\\s+)?native\\s+(${IDENT})\\s+takes\\s+(.+?)\\s+returns\\s+(${IDENT})$`
);
const FUNCTION = new RegExp(
  `^function\\s+(${IDENT})\\s+takes\\s+(.+?)\\s+returns\\s+(${IDENT})$`
);
const PARAMETER = new RegExp(`^(${IDENT})\\s+(${IDENT})$`);

export function parseJass(source: SourceName, text: string): ParseResult {
  const context: Context = {
    source,
    declarations: [],
    diagnostics: [],
    region: { kind: "top" },
  };
  // A last line without a final newline is an ordinary line.
  const lines = text.split("\n");
  lines.forEach((raw, index) => {
    const code = stripComment(raw).trim();
    const line = index + 1;
    switch (context.region.kind) {
      case "top":
        return topLevel(context, code, line);
      case "function":
        return functionBody(context, code);
      case "globals":
        return globalsBlock(context, code);
    }
  });
  endOfFile(context);
  return {
    declarations: context.declarations,
    diagnostics: context.diagnostics,
  };
}

function topLevel(context: Context, code: string, line: number): void {
  if (code === "") return;
  const { source } = context;

  const type = TYPE.exec(code);
  if (type) {
    context.declarations.push({
      kind: "type",
      name: type[1]!,
      parent: type[2]!,
      source,
      line,
    });
    return;
  }

  const native = NATIVE.exec(code);
  if (native) {
    const params = parseTakes(native[3]!);
    if (params) {
      context.declarations.push({
        kind: "native",
        constant: native[1] !== undefined,
        name: native[2]!,
        params,
        returns: native[4]!,
        source,
        line,
      });
      return;
    }
  }

  const fn = FUNCTION.exec(code);
  if (fn) {
    const params = parseTakes(fn[2]!);
    if (params) {
      const declaration: FunctionDeclaration = {
        kind: "function",
        constant: false,
        name: fn[1]!,
        params,
        returns: fn[3]!,
        source,
        line,
      };
      context.declarations.push(declaration);
      context.region = { kind: "function", declaration };
      return;
    }
  }

  if (code === "globals") {
    report(context, line, "globals blocks are not supported yet");
    context.region = { kind: "globals", line };
    return;
  }

  report(context, line, `unknown line: ${code}`);
}

function functionBody(context: Context, code: string): void {
  if (code === "endfunction") context.region = { kind: "top" };
}

function globalsBlock(context: Context, code: string): void {
  if (code === "endglobals") context.region = { kind: "top" };
}

function endOfFile(context: Context): void {
  const { region } = context;
  if (region.kind === "function") {
    const { name, line } = region.declaration;
    report(context, line, `function ${name} has no endfunction`);
  } else if (region.kind === "globals") {
    report(context, region.line, "globals block has no endglobals");
  }
}

/** `nothing` or `<type> <name>, ...`; undefined when malformed. */
function parseTakes(takes: string): Parameter[] | undefined {
  if (takes === "nothing") return [];
  const params: Parameter[] = [];
  for (const part of takes.split(",")) {
    const match = PARAMETER.exec(part.trim());
    if (!match) return undefined;
    params.push({ type: match[1]!, name: match[2]! });
  }
  return params;
}

/** Drops a `//` comment, ignoring `//` inside string and rawcode literals. */
function stripComment(line: string): string {
  let quote: string | undefined;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quote) {
      if (char === "\\") i++;
      else if (char === quote) quote = undefined;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "/" && line[i + 1] === "/") {
      return line.slice(0, i);
    }
  }
  return line;
}

function report(context: Context, line: number, text: string): void {
  context.diagnostics.push({
    severity: "error",
    kind: "parse",
    file: context.source,
    line,
    message: `${context.source}:${line}: ${text}`,
  });
}
