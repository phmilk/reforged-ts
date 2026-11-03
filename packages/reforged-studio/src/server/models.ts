/**
 * The models' paths the model picker searches: the install's, in an art
 * layer and the base layer beneath it, each path once whatever layer holds
 * it; and the map folder's imports, its `_hd.w3mod/` layer read as the
 * same paths. Each comes with backslashes, as a field holds it.
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import type { CascStorage } from "../casc/storage.js";
import { BASE_LAYER } from "../layers.js";
import type { ArtLayer } from "../paths.js";
import type { ListedModel } from "./api-types.js";

/** The layers of the storage each art layer's models are listed from, the enUS sub-layer of each with it. */
const MODEL_LAYERS: Readonly<Record<ArtLayer, readonly string[]>> = {
  sd: [BASE_LAYER],
  hd: [`${BASE_LAYER}_HD.w3mod:`, BASE_LAYER],
  de: [`${BASE_LAYER}_DE.w3mod:`, BASE_LAYER],
};

/** The enUS sub-layer of a layer of the storage. */
const LOCALE_LAYER = "_Locales/enUS.w3mod:";

/** The map folder's HD layer, read as its root's paths. */
const MAP_HD_LAYER = "_hd.w3mod";

/** The deepest folder of the map folder the listing enters. */
const MAP_DEPTH = 8;

/** A model's file: `.mdx`, or `.mdl` as an import may be. */
const MODEL_FILE = /\.md[xl]$/i;

/** A path with backslashes, as a field holds it. */
const backslashed = (path: string): string => path.replaceAll("/", "\\");

/**
 * The install's models in an art layer: every `.mdx` path of its layers
 * and the base layer, once each without regard to case, sorted.
 *
 * @param storage - The install's storage.
 * @param artLayer - The art layer.
 * @returns The paths, with backslashes.
 */
export function installModels(
  storage: CascStorage,
  artLayer: ArtLayer,
): string[] {
  const layers = MODEL_LAYERS[artLayer].flatMap((layer) => [
    layer + LOCALE_LAYER,
    layer,
  ]);
  const found = new Map<string, string>();
  for (const file of storage.paths()) {
    if (!/\.mdx$/i.test(file)) continue;
    const split = file.lastIndexOf(":") + 1;
    if (!layers.includes(file.slice(0, split))) continue;
    const model = file.slice(split);
    const key = model.toLowerCase();
    if (!found.has(key)) found.set(key, backslashed(model));
  }
  return [...found.values()].sort((a, b) =>
    a.toLowerCase() < b.toLowerCase() ? -1 : 1,
  );
}

/**
 * The map folder's imported models: every `.mdx` and `.mdl` file under it,
 * by its path from the map folder, a path under `_hd.w3mod/` as the path
 * beneath it; each once without regard to case, sorted. Each folder is
 * listed and closed, and a folder that cannot be listed is passed over.
 *
 * @param mapFolder - The map folder.
 * @returns The paths, with backslashes.
 */
export async function mapModels(mapFolder: string): Promise<string[]> {
  const found = new Map<string, string>();
  const walk = async (folder: string, depth: number): Promise<void> => {
    let entries;
    try {
      entries = await readdir(folder, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) {
        if (depth < MAP_DEPTH) await walk(file, depth + 1);
      } else if (entry.isFile() && MODEL_FILE.test(entry.name)) {
        let relative = path.relative(mapFolder, file).split(path.sep).join("/");
        const [first, ...rest] = relative.split("/");
        if (first.toLowerCase() === MAP_HD_LAYER && rest.length > 0) {
          relative = rest.join("/");
        }
        const key = relative.toLowerCase();
        if (!found.has(key)) found.set(key, backslashed(relative));
      }
    }
  };
  await walk(mapFolder, 0);
  return [...found.values()].sort((a, b) =>
    a.toLowerCase() < b.toLowerCase() ? -1 : 1,
  );
}

/**
 * The models whose path holds `query`, without regard to case: the map's
 * first, then the install's that the map does not import.
 *
 * @param map - The map folder's models.
 * @param install - The install's models.
 * @param query - The text searched; every model when empty.
 * @returns The models found, each with where it is.
 */
export function searchModels(
  map: readonly string[],
  install: readonly string[],
  query: string,
): ListedModel[] {
  const lower = query.trim().toLowerCase().replaceAll("/", "\\");
  const matches = (model: string): boolean =>
    lower === "" || model.toLowerCase().includes(lower);
  const imported = new Set(map.map((model) => model.toLowerCase()));
  return [
    ...map
      .filter(matches)
      .map((model) => ({ path: model, from: "map" as const })),
    ...install
      .filter((model) => !imported.has(model.toLowerCase()) && matches(model))
      .map((model) => ({ path: model, from: "install" as const })),
  ];
}
