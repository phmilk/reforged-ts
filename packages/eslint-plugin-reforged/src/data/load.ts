// Reading the data files. The plugin's own files ship in data/ (one level
// above both src/ and dist/); a file is read once, at plugin load.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { DataFileError } from "./schema.js";

/** The path of one of the plugin's own data files. */
export function ownDataFile(name: string): string {
  return fileURLToPath(new URL(`../../data/${name}`, import.meta.url));
}

/**
 * Reads a JSON file and hands it to its parser, which checks the shape.
 * Throws a DataFileError when the file is not valid JSON.
 */
export function readDataFile<T>(
  file: string,
  parse: (json: unknown, file: string) => T,
): T {
  const text = readFileSync(file, "utf8");
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new DataFileError(
      file,
      "the content",
      `valid JSON (${error instanceof Error ? error.message : String(error)})`,
    );
  }
  return parse(json, file);
}
