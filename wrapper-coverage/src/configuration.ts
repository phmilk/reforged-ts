/**
 * The two committed inputs besides the manifest and the sources: the Wrapper
 * configuration and the exclusions list. Both are validated for shape here;
 * whether they agree with the manifest and the sources is the report's
 * business.
 */
import { InputError, isRecord } from "./input-error.js";
import { isHandleType } from "./manifest.js";

/** One Wrapper class and the handle type it owns. */
export interface WrapperEntry {
  wrapper: string;
  type: string;
}

/**
 * The Wrapper configuration from its parsed JSON: an object with one line
 * per Wrapper, the class name to its handle type (`"Unit": "unit"`), in the
 * order the report lists them.
 */
export function readWrappers(json: unknown): WrapperEntry[] {
  const invalid = (detail: string) =>
    new InputError(`The Wrapper configuration is invalid: ${detail}.`);
  if (!isRecord(json))
    throw invalid("expected an object of class names to handle types");
  const owners = new Map<string, string>();
  return Object.entries(json).map(([wrapper, type]) => {
    if (typeof type !== "string" || !isHandleType(type))
      throw invalid(`${wrapper} names no handle type`);
    const other = owners.get(type);
    if (other !== undefined)
      throw invalid(`${other} and ${wrapper} both own ${type}`);
    owners.set(type, wrapper);
    return { wrapper, type };
  });
}

/** One excluded Native: why it has no member, where that is shown, and when. */
export interface Exclusion {
  native: string;
  /** Why the Native has no member. */
  reason: string;
  /** Where the reason is shown: a jassdoc bug note or a probe-map measurement. */
  source: string;
  /** When the exclusion was decided, `YYYY-MM-DD`. */
  date: string;
}

const EXCLUSION_KEYS = ["native", "reason", "source", "date"] as const;

function isDate(text: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(text) &&
    new Date(`${text}T00:00:00Z`).toISOString().startsWith(text)
  );
}

/**
 * The exclusions from their parsed JSON: an array of entries, each with
 * exactly the keys of `Exclusion`, every value a non-empty string, `date` a
 * calendar date, and no Native twice.
 */
export function readExclusions(json: unknown): Exclusion[] {
  const invalid = (detail: string) =>
    new InputError(`The exclusions file is invalid: ${detail}.`);
  if (!Array.isArray(json)) throw invalid("expected an array of exclusions");
  const seen = new Set<string>();
  return (json as unknown[]).map((entry, index) => {
    const at = `entry ${String(index)}`;
    if (!isRecord(entry)) throw invalid(`${at} is not an object`);
    const keys = Object.keys(entry).sort();
    if (keys.join() !== [...EXCLUSION_KEYS].sort().join())
      throw invalid(
        `${at} must have exactly the keys ${EXCLUSION_KEYS.join(", ")}`,
      );
    const text = (key: (typeof EXCLUSION_KEYS)[number]) => {
      const value = entry[key];
      if (typeof value !== "string" || value.trim() === "")
        throw invalid(`${at} has no ${key}`);
      return value;
    };
    const exclusion: Exclusion = {
      native: text("native"),
      reason: text("reason"),
      source: text("source"),
      date: text("date"),
    };
    if (!isDate(exclusion.date))
      throw invalid(`${at} has the date ${exclusion.date}, not YYYY-MM-DD`);
    if (seen.has(exclusion.native))
      throw invalid(`${exclusion.native} is excluded twice`);
    seen.add(exclusion.native);
    return exclusion;
  });
}
