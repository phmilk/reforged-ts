/**
 * Placing the Template's map folder for its new owner (ADR 0020): its one
 * map folder, at the root or else under `maps/`, renamed after the package
 * and moved to the project root, and `mapFolder` in `reforged.config.ts`
 * pointed at it. Like the Seeds, a missing anchor throws, naming it.
 */
import {
  readdir,
  readFile,
  rename,
  rmdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";

/** The file whose `mapFolder` names the map folder. */
export const CONFIG_FILE = "reforged.config.ts";

/** The folder the Template kept its map folder in before ADR 0020. */
const MAPS_FOLDER = "maps";

/** A map folder's name: its suffix, ignoring case. */
const MAP_FOLDER = /\.w3[mx]$/i;

/** The `mapFolder` field of the config: its key, its quote and its value. */
const MAP_FOLDER_FIELD = /^(\s*mapFolder\s*:\s*)(["'`])([^"'`\r\n]*)\2/m;

/**
 * Moves the one map folder of the Template written into `folder`, directly
 * at its root or with none there directly under `maps/`, to
 * `<name>.<suffix>` at its root, the suffix as the Template ships it; the
 * part after the scope of a scoped `name`. Removes `maps/` when that leaves
 * it empty, and sets `mapFolder` in the config to the new path. Resolves
 * with that path, relative to `folder`. Throws when the Template has no
 * single map folder, or a config without a `mapFolder` field, with nothing
 * changed.
 */
export async function placeMapFolder(
  folder: string,
  name: string,
): Promise<string> {
  const atRoot = await mapFoldersIn(folder);
  const underMaps =
    atRoot.length === 0 ? await mapFoldersIn(join(folder, MAPS_FOLDER)) : [];
  const found = atRoot.length > 0 ? atRoot : underMaps;
  if (found.length !== 1) {
    throw new Error(
      found.length === 0
        ? `the Template has no map folder (a folder ending in .w3m or .w3x) at its root or under ${MAPS_FOLDER}/.`
        : `the Template has ${String(found.length)} map folders (${found.join(", ")}), where a Map project has one.`,
    );
  }
  const [current] = found as [string];
  const from = atRoot.length > 0 ? current : `${MAPS_FOLDER}/${current}`;
  const placed = `${name.slice(name.lastIndexOf("/") + 1)}${current.slice(-4)}`;

  const configPath = join(folder, CONFIG_FILE);
  const config = await readFile(configPath, "utf8").catch((error: unknown) => {
    throw new Error(`the Template has no ${CONFIG_FILE}.`, { cause: error });
  });
  if (!MAP_FOLDER_FIELD.test(config)) {
    throw new Error(
      `the Template's ${CONFIG_FILE} has no \`mapFolder\` field, which the map folder's new path replaces.`,
    );
  }
  if (from !== placed) {
    if ((await stat(join(folder, placed)).catch(() => null)) !== null) {
      throw new Error(
        `the Template already has a ${placed} at its root, where its map folder goes.`,
      );
    }
    await rename(join(folder, ...from.split("/")), join(folder, placed));
  }
  if (
    from !== current &&
    (await readdir(join(folder, MAPS_FOLDER))).length === 0
  ) {
    await rmdir(join(folder, MAPS_FOLDER));
  }
  await writeFile(
    configPath,
    config.replace(
      MAP_FOLDER_FIELD,
      (_, key: string, quote: string) => `${key}${quote}${placed}${quote}`,
    ),
  );
  return placed;
}

/** The map folders directly in `folder`, sorted; none when it cannot be read. */
async function mapFoldersIn(folder: string): Promise<string[]> {
  const entries = await readdir(folder, { withFileTypes: true }).catch(
    () => [],
  );
  return entries
    .filter((entry) => entry.isDirectory() && MAP_FOLDER.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}
