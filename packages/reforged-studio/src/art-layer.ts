/**
 * The art layer the Studio previews in, as #481 settled it: the World
 * Editor's Asset Mode preference (`[Misc] assetMode` of
 * `Documents\Warcraft III\WorldEditPreferences.txt`), limited by the map's
 * Supported Modes (`war3map.w3i`), and HD when the preference cannot be
 * read.
 *
 * Neither the meaning of the preference's values nor that of the Supported
 * Modes was checked in the World Editor; both are the human checks of #842.
 * The preference reads 0, 1 and 2 as SD, HD and DE, the order of the
 * editor's strings `WESTRING_PREFS_ASSETMODE_SD`, `_HD` and `_DE`, and -1
 * as Default, which takes the same section's `hd` (the research's sample
 * file holds `assetMode=-1` with `hd=1`). The Supported Modes read 1 to 4
 * in the order of `WESTRING_ASSET_MODE_SD`, `_HD`, `_HYBRID` ("All Modes")
 * and `_DE`: every map the 3.0 World Editor saved in the workspace's
 * fixtures stores 3.
 */
import { readFile } from "node:fs/promises";
import type { ArtLayer } from "./paths.js";
import { Profile } from "./profile.js";

/** The art layers each value of a map's Supported Modes allows. */
export const SUPPORTED_MODES: Readonly<
  Partial<Record<number, readonly ArtLayer[]>>
> = {
  1: ["sd"],
  2: ["hd"],
  3: ["sd", "hd", "de"],
  4: ["de"],
};

/** The art layer of each value of the Asset Mode preference and its `hd`. */
const ASSET_MODES: Readonly<Partial<Record<string, ArtLayer>>> = {
  "0": "sd",
  "1": "hd",
  "2": "de",
};

/** The art layer when the preference cannot be read. */
const DEFAULT_ART_LAYER: ArtLayer = "hd";

/** The section of the World Editor's preferences that holds the Asset Mode. */
const PREFERENCES_SECTION = "Misc";

/** What the art layer is read from. */
export interface ArtLayerOptions {
  /** The World Editor's preferences file; none read when absent. */
  preferencesFile?: string;
  /** The map's Supported Modes, as `war3map.w3i` stores them; no limit when absent. */
  supportedModes?: number;
}

/**
 * The art layer: the World Editor's Asset Mode preference, HD when the file
 * or its value cannot be read, limited by the map's Supported Modes. A
 * value of the Supported Modes outside 1 to 4 limits nothing.
 */
export async function readArtLayer(
  options: ArtLayerOptions,
): Promise<ArtLayer> {
  let preferred = DEFAULT_ART_LAYER;
  if (options.preferencesFile !== undefined) {
    let text: string | undefined;
    try {
      text = await readFile(options.preferencesFile, "utf8");
    } catch {
      text = undefined;
    }
    if (text !== undefined) {
      const preferences = new Profile("last");
      preferences.add(text, options.preferencesFile);
      const mode = preferences.get(PREFERENCES_SECTION, "assetMode");
      const layer =
        mode === "-1"
          ? ASSET_MODES[preferences.get(PREFERENCES_SECTION, "hd") ?? ""]
          : ASSET_MODES[mode ?? ""];
      if (layer !== undefined) preferred = layer;
    }
  }
  const allowed =
    options.supportedModes === undefined
      ? undefined
      : SUPPORTED_MODES[options.supportedModes];
  if (allowed === undefined || allowed.includes(preferred)) return preferred;
  return allowed[0] ?? preferred;
}
