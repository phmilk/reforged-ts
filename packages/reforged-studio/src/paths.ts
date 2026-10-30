/**
 * Path resolution for icons and models, as #481 measured it
 * (`docs/research/studio-model-previews.md`): a path an object's field or
 * a model names is looked for in the map folder first, layered like the
 * game (`_hd.w3mod/<path>`, as HiveWE's lookup orders a map's files), then
 * in the chosen art layer of the storage (`_HD.w3mod:` or `_DE.w3mod:`),
 * then in its base layer, each layer's enUS sub-layer
 * (`_Locales/enUS.w3mod`) before it. The tileset and `_teen` sub-layers
 * HiveWE's lookup also reads are not read: a preview has no tileset, and
 * which art the World Editor shows from `_teen` was not checked. In each
 * place a `.blp` or `.tif` path falls back to the `.dds` that 3.0 stores,
 * and a path found in none of them goes through `FileAliases.json`. A path that resolves nowhere is reported as
 * missing: 2 to 5 % of Blizzard's own references dangle.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CascStorage } from "./casc/storage.js";
import { BASE_LAYER } from "./layers.js";

/** An art layer: SD, the base layer alone; HD (`_HD.w3mod:`) or DE (`_DE.w3mod:`) over it. */
export type ArtLayer = "sd" | "hd" | "de";

/** The layer of the storage each art layer reads before the base layer. */
const ART_LAYERS: Readonly<Record<ArtLayer, string | undefined>> = {
  sd: undefined,
  hd: `${BASE_LAYER}_HD.w3mod:`,
  de: `${BASE_LAYER}_DE.w3mod:`,
};

/**
 * The layer of the map folder the HD and DE art layers read before its
 * root, as HiveWE's lookup does. HiveWE reads no DE layer, and the folder
 * the World Editor writes a DE-only import to was not observed (#481): DE
 * reads the HD layer until a human checks it (#842).
 */
const MAP_HD_LAYER = "_hd.w3mod/";

/** The enUS sub-layer each layer of the map folder reads first, as HiveWE's lookup does. */
const MAP_LOCALE_LAYER = "_Locales/enUS.w3mod/";

/** The enUS sub-layer each layer of the storage reads first. */
const STORAGE_LOCALE_LAYER = "_Locales/enUS.w3mod:";

/** The aliases of the storage, in its base layer: `{ src, dest, assetType }` objects. */
export const FILE_ALIASES = `${BASE_LAYER}FileAliases.json`;

/** What to resolve against. */
export interface PathResolverOptions {
  /** The art layer chosen (`readArtLayer`). */
  artLayer: ArtLayer;
  /** The map folder whose imports come first; none when absent. */
  mapFolder?: string;
}

/** A path found. */
export interface ResolvedPath {
  found: true;
  /** The path asked for, with `/` separators and a model's `.mdx`. */
  path: string;
  /** Where it was found: the map folder, or the storage. */
  from: "map" | "storage";
  /** The file read: its path on disk in the map folder, or its path in the storage. */
  file: string;
  /** Reads the file's bytes, from disk or the storage, when asked. */
  read(): Promise<Uint8Array>;
}

/** A path found nowhere. */
export interface MissingPath {
  found: false;
  /** The path asked for, with `/` separators and a model's `.mdx`. */
  path: string;
}

/** Resolves the paths of icons and models. */
export interface PathResolver {
  /** Where `path` is, or that it is missing; never throws for a path found nowhere. */
  resolve(path: string): Promise<ResolvedPath | MissingPath>;
}

/** A resolver over the storage and, when given, the map folder. */
export function createPathResolver(
  storage: CascStorage,
  options: PathResolverOptions,
): PathResolver {
  const listed = new Map(
    storage.paths().map((path) => [path.toLowerCase(), path]),
  );
  let aliases: Promise<ReadonlyMap<string, string>> | undefined;
  const aliasOf = async (path: string): Promise<string | undefined> => {
    aliases ??= readAliases(storage, listed);
    return (await aliases).get(path.toLowerCase());
  };

  const layers = withLocale(
    [ART_LAYERS[options.artLayer], BASE_LAYER].filter(
      (layer) => layer !== undefined,
    ),
    STORAGE_LOCALE_LAYER,
  );
  const mapLayers = withLocale(
    options.artLayer === "sd" ? [""] : [MAP_HD_LAYER, ""],
    MAP_LOCALE_LAYER,
  );

  const find = async (path: string): Promise<ResolvedPath | undefined> => {
    const candidates = extensions(path);
    if (options.mapFolder !== undefined) {
      for (const layer of mapLayers) {
        for (const candidate of candidates) {
          const file = await findOnDisk(options.mapFolder, layer + candidate);
          if (file !== undefined) {
            return {
              found: true,
              path,
              from: "map",
              file,
              read: async () => new Uint8Array(await readFile(file)),
            };
          }
        }
      }
    }
    for (const layer of layers) {
      for (const candidate of candidates) {
        const file = listed.get((layer + candidate).toLowerCase());
        if (file !== undefined) {
          return {
            found: true,
            path,
            from: "storage",
            file,
            read: async () => (await storage.read(file)).bytes,
          };
        }
      }
    }
    return undefined;
  };

  return {
    resolve: async (asked) => {
      const path = normalize(asked);
      if (path === "") return { found: false, path };
      const found = await find(path);
      if (found !== undefined) return found;
      const alias = await aliasOf(path);
      const aliased = alias === undefined ? undefined : await find(alias);
      return aliased === undefined
        ? { found: false, path }
        : { ...aliased, path };
    },
  };
}

/** Each of `layers`, its enUS sub-layer `locale` before it. */
function withLocale(layers: readonly string[], locale: string): string[] {
  return layers.flatMap((layer) => [layer + locale, layer]);
}

/**
 * A path as the resolver looks for it: `/` separators, no leading one, and
 * a model's path (`.mdl`, or no extension as the skin files write
 * `file=units\human\Footman\Footman`) as its `.mdx`.
 */
function normalize(path: string): string {
  const slashed = path.trim().replaceAll("\\", "/").replace(/^\/+/, "");
  if (slashed === "") return "";
  if (/\.mdl$/i.test(slashed)) return slashed.slice(0, -4) + ".mdx";
  return /\.[^./]+$/.test(slashed) ? slashed : `${slashed}.mdx`;
}

/** The paths tried for `path`: itself, then its `.dds` for a `.blp` or `.tif`. */
function extensions(path: string): string[] {
  return /\.(blp|tif)$/i.test(path)
    ? [path, path.slice(0, -4) + ".dds"]
    : [path];
}

/** The aliases of `FileAliases.json` by lower-cased source, none when the storage lacks it or it is unreadable. */
async function readAliases(
  storage: CascStorage,
  listed: ReadonlyMap<string, string>,
): Promise<ReadonlyMap<string, string>> {
  const aliases = new Map<string, string>();
  if (!listed.has(FILE_ALIASES.toLowerCase())) return aliases;
  let entries: unknown;
  try {
    entries = JSON.parse(
      new TextDecoder().decode((await storage.read(FILE_ALIASES)).bytes),
    );
  } catch {
    return aliases;
  }
  if (!Array.isArray(entries)) return aliases;
  for (const entry of entries as unknown[]) {
    if (typeof entry !== "object" || entry === null) continue;
    const { src, dest } = entry as { src?: unknown; dest?: unknown };
    if (typeof src === "string" && typeof dest === "string") {
      aliases.set(normalize(src).toLowerCase(), normalize(dest));
    }
  }
  return aliases;
}

/**
 * The file at `relative` under `folder`, each part matched without regard
 * to case as the game matches paths; none when a part is missing. Each
 * folder is listed and closed: no handle stays open.
 */
async function findOnDisk(
  folder: string,
  relative: string,
): Promise<string | undefined> {
  let at = folder;
  const parts = relative.split("/");
  for (const [i, part] of parts.entries()) {
    let entries;
    try {
      entries = await readdir(at, { withFileTypes: true });
    } catch {
      return undefined;
    }
    const last = i === parts.length - 1;
    const entry = entries.find(
      (candidate) =>
        candidate.name.toLowerCase() === part.toLowerCase() &&
        (last ? candidate.isFile() : candidate.isDirectory()),
    );
    if (entry === undefined) return undefined;
    at = join(at, entry.name);
  }
  return at;
}
