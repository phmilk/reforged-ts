// The live Studio on the map folder the plugin reads (#833), from the
// Studio's runtime file (`../studio-runtime-file.ts`), read again at most
// once a second, as the lookup checks its files.

import { DEFAULT_MIN_INTERVAL } from "../lookup.js";
import {
  readLiveStudio,
  type StudioRuntimeFile,
} from "../studio-runtime-file.js";

/** A live Studio on the map folder the plugin reads: its origin, without a trailing slash. */
export type LiveStudio = Pick<StudioRuntimeFile, "url">;

/**
 * The live Studio of a Map project's map folder, read again at most once
 * per second.
 *
 * @param root - The Map project's root.
 * @returns A function of the map folder giving its live Studio, undefined
 *   when none holds it.
 */
export function liveStudioReader(
  root: string,
): (mapFolder: string) => LiveStudio | undefined {
  let last:
    | { at: number; mapFolder: string; studio: LiveStudio | undefined }
    | undefined;
  return (mapFolder) => {
    const now = Date.now();
    if (
      last?.mapFolder !== mapFolder ||
      now < last.at ||
      now - last.at >= DEFAULT_MIN_INTERVAL
    ) {
      last = { at: now, mapFolder, studio: readLiveStudio(root, mapFolder) };
    }
    return last.studio;
  };
}
