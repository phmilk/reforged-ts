// Shape checks for the data files the plugin reads. A file with an unexpected
// shape throws at plugin load, naming the file and the field that failed; a
// rule never degrades silently on a schema change in another package.

/** Thrown at plugin load for a data file whose shape is not the expected one. */
export class DataFileError extends Error {
  public constructor(file: string, field: string, expected: string) {
    super(`eslint-plugin-reforged: ${file}: ${field} must be ${expected}`);
    this.name = "DataFileError";
  }
}

/** Where a value sits in a data file, for the error message. */
export interface FieldPath {
  /** The file, as the error names it (a path or a package-relative name). */
  readonly file: string;
  /** The field, as a JSON path from the file's root (`[3].reason`). */
  readonly field: string;
}

function describe(path: FieldPath): string {
  return path.field === "" ? "the root" : path.field;
}

/** The value as an array; throws unless it is one. */
export function expectArray(value: unknown, path: FieldPath): unknown[] {
  if (!Array.isArray(value)) {
    throw new DataFileError(path.file, describe(path), "an array");
  }
  return value as unknown[];
}

/** The value as a plain object; throws unless it is one. */
export function expectObject(
  value: unknown,
  path: FieldPath,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new DataFileError(path.file, describe(path), "an object");
  }
  return value as Record<string, unknown>;
}

/** A property of an object as a non-empty string; throws unless it is one. */
export function expectString(
  object: Record<string, unknown>,
  key: string,
  path: FieldPath,
): string {
  const value = object[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new DataFileError(
      path.file,
      `${path.field}.${key}`,
      "a non-empty string",
    );
  }
  return value;
}

/** A property of an object as a boolean; throws unless it is one. */
export function expectBoolean(
  object: Record<string, unknown>,
  key: string,
  path: FieldPath,
): boolean {
  const value = object[key];
  if (typeof value !== "boolean") {
    throw new DataFileError(path.file, `${path.field}.${key}`, "a boolean");
  }
  return value;
}

/** Each element of an array field, with its path (`[i]`). */
export function elements(
  value: unknown,
  path: FieldPath,
): { value: unknown; path: FieldPath }[] {
  return expectArray(value, path).map((element, index) => ({
    value: element,
    path: { file: path.file, field: `${path.field}[${String(index)}]` },
  }));
}

/** Throws when two entries share a key (a name listed twice). */
export function expectUnique(
  keys: readonly string[],
  path: FieldPath,
  key: string,
): void {
  const seen = new Set<string>();
  keys.forEach((value, index) => {
    if (seen.has(value)) {
      throw new DataFileError(
        path.file,
        `[${String(index)}].${key}`,
        `unique (${JSON.stringify(value)} is listed twice)`,
      );
    }
    seen.add(value);
  });
}
