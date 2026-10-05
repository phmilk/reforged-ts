// The Crashing cases of `no-crashing-arguments` (data/crashing-arguments.json),
// owned by the plugin: one entry per Crashing case of the Nullability sweep
// guarded at lint level. An entry names a Native (or a library member), the
// library members backed by it that it also covers, listed explicitly, and
// the literal arguments, by parameter name, that crashed the game on its
// Build. A Crashing case a later Patch's sweep finds is one more entry, not
// a rule.
import {
  DataFileError,
  elements,
  expectArray,
  expectObject,
  expectString,
  type FieldPath,
} from "./schema.js";

/** A literal argument value, as the code writes it. */
export type ArgumentValue = string | number | boolean;

export interface CrashingArguments {
  /** A Native, or a library member: `Class.member` (static), `Class#member`. */
  readonly name: string;
  /**
   * The library members backed by the Native that the entry also covers,
   * named explicitly (`Frame.createType`); empty when it covers none.
   */
  readonly members: readonly string[];
  /**
   * The crashing arguments, by the callee's parameter name: a call matches
   * when every listed parameter's argument is a literal among its values.
   */
  readonly arguments: ReadonlyMap<string, readonly ArgumentValue[]>;
  /** The Crashing case, as the sweep report words it. */
  readonly case: string;
  /** The Build the game crashed on (`3.0.0.24268`). */
  readonly build: string;
  /** The consequence, one sentence without the callee, starting with a verb. */
  readonly reason: string;
  /** What to write instead, one sentence. */
  readonly replacement: string;
}

const nativeNamePattern = /^[A-Za-z_][A-Za-z0-9_]*$/;
const memberNamePattern = /^[A-Z][A-Za-z0-9_]*[#.][A-Za-z_][A-Za-z0-9_]*$/;
const buildPattern = /^\d+\.\d+\.\d+\.\d+$/;

function field(path: FieldPath, key: string): FieldPath {
  return { file: path.file, field: `${path.field}.${key}` };
}

function parseMembers(entry: Record<string, unknown>, path: FieldPath) {
  if (entry.members === undefined) {
    return [];
  }
  return elements(entry.members, field(path, "members")).map(
    ({ value, path: each }) => {
      if (typeof value !== "string" || !memberNamePattern.test(value)) {
        throw new DataFileError(
          each.file,
          each.field,
          "Class#member or Class.member",
        );
      }
      return value;
    },
  );
}

function parseArguments(entry: Record<string, unknown>, path: FieldPath) {
  const at = field(path, "arguments");
  const object = expectObject(entry.arguments, at);
  const parameters = Object.keys(object);
  if (parameters.length === 0) {
    throw new DataFileError(at.file, at.field, "an object with a parameter");
  }
  return new Map(
    parameters.map((parameter) => {
      if (!nativeNamePattern.test(parameter)) {
        throw new DataFileError(
          at.file,
          at.field,
          `an object keyed by parameter names (${JSON.stringify(parameter)} is not one)`,
        );
      }
      const values = field(at, parameter);
      if (expectArray(object[parameter], values).length === 0) {
        throw new DataFileError(values.file, values.field, "a non-empty array");
      }
      return [
        parameter,
        elements(object[parameter], values).map(({ value, path: each }) => {
          if (!["string", "number", "boolean"].includes(typeof value)) {
            throw new DataFileError(
              each.file,
              each.field,
              "a string, a number or a boolean",
            );
          }
          return value as ArgumentValue;
        }),
      ] as const;
    }),
  );
}

export function parseCrashingArguments(
  json: unknown,
  file: string,
): CrashingArguments[] {
  return elements(json, { file, field: "" }).map(({ value, path }) => {
    const entry = expectObject(value, path);
    const name = expectString(entry, "name", path);
    if (!nativeNamePattern.test(name) && !memberNamePattern.test(name)) {
      throw new DataFileError(
        file,
        `${path.field}.name`,
        "a Native name, Class#member or Class.member",
      );
    }
    const members = parseMembers(entry, path);
    const parsedArguments = parseArguments(entry, path);
    const build = expectString(entry, "build", path);
    if (!buildPattern.test(build)) {
      throw new DataFileError(
        file,
        `${path.field}.build`,
        "a Build (3.0.0.24268)",
      );
    }
    return {
      name,
      members,
      arguments: parsedArguments,
      case: expectString(entry, "case", path),
      build,
      reason: expectString(entry, "reason", path),
      replacement: expectString(entry, "replacement", path),
    };
  });
}
