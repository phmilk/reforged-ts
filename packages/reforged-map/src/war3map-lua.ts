// The reader of war3map.lua: declares every `gg_` and `udg_` Editor global
// of the map script's header in the model, typed from what the script says.
//
// Choices where the 3.0 editor's output is not fully known (notes of
// phmilk/reforged-ts-template#93, moved with the generator):
// - Only the header is read: the lines before the first `function` line at
//   column 0. The 3.0 editor writes function bodies unindented, so a column-0
//   `gg_trg_X = CreateTrigger()` inside a function must not count, and the
//   map's custom script is pasted after `InitGlobals`, so it is never read.
//   In the header only unindented `gg_*` / `udg_*` assignments count: an
//   indented or `local` assignment, or any other statement, is ignored.
// - `udg_` handle variables are declared `nil` in the header. Their type comes
//   from the Native call the editor emits for them in the body of
//   `InitGlobals` (`udg_G = CreateGroup()`, `udg_A[i] = CreateTimer()` for an
//   array), typed as `NonNullable<ReturnType<typeof Native>>` so no
//   Native-to-type table is needed. Without such a call the type is `unknown`.
// - A `gg_` global whose header value is a string literal (a music entry,
//   `gg_snd_X = ""`) is typed `string`.
// - The stub value is nil or the header literal only, so the stub calls no
//   Native.

import type { EditorGlobal, EditorGlobalsModel } from "./model.js";

/** The root of the handle types, for a `gg_` prefix the table does not know. */
const ROOT_HANDLE = "handle";

/** The editor's `gg_<prefix>_` object kinds and their handle types. */
const GG_PREFIX_TYPES: Readonly<Partial<Record<string, string>>> = {
  trg: "trigger",
  rct: "rect",
  cam: "camerasetup",
  snd: "sound",
  unit: "unit",
  dest: "destructable",
  item: "item",
};

const HEADER_ASSIGNMENT =
  /^((?:gg|udg)_[A-Za-z0-9_]+)[ \t]*=[ \t]*(.*?)[ \t]*$/;
const FUNCTION_LINE = /^function\b/;
const INIT_GLOBALS_LINE = /^function[ \t]+InitGlobals[ \t]*\(/;
const NATIVE_ASSIGNMENT =
  /^[ \t]*(udg_[A-Za-z0-9_]+)[ \t]*(\[[^\]]*\])?[ \t]*=[ \t]*([A-Za-z_][A-Za-z0-9_]*)[ \t]*\(/;
const NUMBER = /^-?(?:0[xX][0-9a-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)$/;
const STRING = /^(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')$/;
const BOOLEAN = /^(?:true|false)$/;
const JARRAY = /^__jarray[ \t]*\([ \t]*(.*?)[ \t]*\)$/;
const CALL = /^([A-Za-z_][A-Za-z0-9_]*)[ \t]*\(.*\)$/;

/**
 * Declares the Editor globals of war3map.lua's text, its byte order mark
 * already removed by `readMapScript`, in the model; the first header
 * assignment of a name wins.
 */
export function readWar3mapLua(text: string, model: EditorGlobalsModel): void {
  const lines = text.split(/\r?\n/);
  const headerEnd = lines.findIndex((line) => FUNCTION_LINE.test(line));
  const header = headerEnd === -1 ? lines : lines.slice(0, headerEnd);
  const natives = initGlobalsNatives(lines);

  const seen = new Set<string>();
  for (const line of header) {
    const match = HEADER_ASSIGNMENT.exec(line);
    if (!match || seen.has(match[1])) continue;
    const [, name, value] = match as unknown as [string, string, string];
    seen.add(name);
    model.globals.push(
      name.startsWith("gg_")
        ? editorObject(name, value, model.warnings)
        : variable(name, value, natives, model.warnings),
    );
  }
}

/** A `gg_<prefix>_<name>` object placed or created in the editor. */
function editorObject(
  name: string,
  value: string,
  warnings: string[],
): EditorGlobal {
  const global = { name, origin: "gg", array: false } as const;
  if (STRING.test(value))
    return { ...global, type: "string", stubValue: value };
  const prefix = name.slice("gg_".length).split("_")[0];
  let type = GG_PREFIX_TYPES[prefix];
  if (type === undefined) {
    type = ROOT_HANDLE;
    warnings.push(
      `${name}: unknown editor prefix gg_${prefix}_, declared as ${ROOT_HANDLE}.`,
    );
  }
  return { ...global, type, stubValue: "nil" };
}

/** A `udg_` variable of the Variable Editor, typed from its initializer. */
function variable(
  name: string,
  value: string,
  natives: InitGlobalsNatives,
  warnings: string[],
): EditorGlobal {
  const scalar = { name, origin: "udg", array: false } as const;
  const array = { name, origin: "udg", array: true } as const;
  const nativeReturn = (native: string) =>
    `NonNullable<ReturnType<typeof ${native}>>`;
  const nativeType = (native: string | undefined): string | undefined =>
    native === undefined ? undefined : nativeReturn(native);

  const literal = literalType(value);
  if (literal) return { ...scalar, type: literal, stubValue: value };
  if (value === "nil")
    return {
      ...scalar,
      type: nativeType(natives.plain.get(name)) ?? "unknown",
      stubValue: "nil",
    };

  const jarray = JARRAY.exec(value);
  const element = jarray ? literalType(jarray[1]) : undefined;
  if (jarray && element) {
    const type = nativeType(natives.indexed.get(name)) ?? element;
    return {
      ...array,
      type: `Record<number, ${type}>`,
      stubValue: `__jarray(${jarray[1]})`,
    };
  }
  if (value === "{}") {
    return {
      ...array,
      type: `Record<number, ${nativeType(natives.indexed.get(name)) ?? "unknown"}>`,
      stubValue: "{}",
    };
  }

  const call = CALL.exec(value);
  if (call && !jarray)
    return { ...scalar, type: nativeReturn(call[1]), stubValue: "nil" };

  warnings.push(
    `${name}: initializer \`${value}\` not recognized, declared as unknown.`,
  );
  return { ...scalar, type: "unknown", stubValue: "nil" };
}

function literalType(value: string): string | undefined {
  if (NUMBER.test(value)) return "number";
  if (STRING.test(value)) return "string";
  if (BOOLEAN.test(value)) return "boolean";
  return undefined;
}

interface InitGlobalsNatives {
  /** `udg_X = Native(...)`: the Native per variable, first one wins. */
  readonly plain: Map<string, string>;
  /** `udg_X[i] = Native(...)`: the Native per array variable. */
  readonly indexed: Map<string, string>;
}

/**
 * The Native calls the editor assigns to `udg_` variables in the body of
 * `InitGlobals`. The body ends at its matching `end` (block keywords counted,
 * since 3.0 does not indent) or at the next column-0 `function`.
 */
function initGlobalsNatives(lines: readonly string[]): InitGlobalsNatives {
  const natives: InitGlobalsNatives = { plain: new Map(), indexed: new Map() };
  const start = lines.findIndex((line) => INIT_GLOBALS_LINE.test(line));
  if (start === -1) return natives;
  let depth = 1;
  for (const line of lines.slice(start + 1)) {
    if (FUNCTION_LINE.test(line)) break;
    const match = NATIVE_ASSIGNMENT.exec(line);
    if (match) {
      const [, name, index, native] = match as unknown as [
        string,
        string,
        string | undefined,
        string,
      ];
      const target = index === undefined ? natives.plain : natives.indexed;
      if (!target.has(name)) target.set(name, native);
    }
    depth += blockDelta(line);
    if (depth <= 0) break;
  }
  return natives;
}

/** Blocks a line opens minus blocks it closes, strings and comments removed. */
function blockDelta(line: string): number {
  const code = line
    .replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""')
    .replace(/--.*$/, "");
  const count = (word: string): number =>
    code.match(new RegExp(`\\b${word}\\b`, "g"))?.length ?? 0;
  return (
    count("function") +
    count("do") +
    count("then") +
    count("repeat") -
    count("elseif") -
    count("end") -
    count("until")
  );
}
