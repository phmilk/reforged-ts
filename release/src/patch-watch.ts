/**
 * The Patch watch's plan, programmatic entry point: given the jass-history
 * tag list, whether a live game Patch newer than the supported one exists,
 * which older new ones it supersedes, and why every other tag is ignored.
 * `planPatchWatch` is pure: the CLI fetches the tags and reads the
 * repository (`readWatchRepository`), the workflow opens the issue and the
 * pull request.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { compareBuilds, gameVersion, isBuild } from "./build.js";
import { declaredPatch } from "./check-patches.js";
import {
  tagLinks,
  type JassHistoryTag,
  type TagLinks,
} from "./jass-history.js";
import { byCodePoint } from "./order.js";
import { TYPINGS_PACKAGE } from "./packages.js";
import { errorMessage, isRecord } from "./unknown.js";
import { readPublishablePackages } from "./workspace.js";

/** A jass-history tag name, read. */
export interface ParsedTag {
  /** `Reforged`, `TFT`: the game line. */
  prefix: string;
  build: string;
  /** The dash-separated words after the Build, in order. */
  qualifiers: string[];
}

const TAG = /^([A-Za-z][A-Za-z-]*?)-v(\d+\.\d+\.\d+\.\d+)((?:-[A-Za-z0-9]+)*)$/;

/**
 * Reads a jass-history tag name as observed on its tag list: a prefix, `v`,
 * the four numbers of the Build, then optional dash-separated qualifiers
 * (`Reforged-v3.0.0.24268-w3-3a9d8f2`). `null` when the name has no such
 * Build (`baseline`, the locale-only `TFT-v1.27b-ru`, anything malformed).
 */
export function parseTag(name: string): ParsedTag | null {
  const match = TAG.exec(name);
  if (!match) return null;
  const [, prefix = "", build = "", rest = ""] = match;
  return { prefix, build, qualifiers: rest.split("-").slice(1) };
}

/** The game line the Typings vendor tags of. */
const LIVE_PREFIX = "Reforged";

/** The client marker of the live game. */
const LIVE_CLIENT = "w3";

/**
 * The client markers of the clients that are not the live game, and what
 * they are. Any other qualifier (none, a commit hash, a word the watch does
 * not know) leaves the tag live: a needless issue is closed by a human, a
 * missed Patch is not noticed at all.
 */
const NOT_LIVE_CLIENTS: ReadonlyMap<string, string> = new Map([
  ["w3t", "test"],
  ["w3b", "beta"],
]);

/** Why the plan ignores a tag. */
export type IgnoreReason =
  /** The name has no four-number Build. */
  | "no-build"
  /** The Build is not above the supported Patch. */
  | "not-newer"
  /** The tag is of another game line than Reforged. */
  | "not-reforged"
  /** The tag is of a test or beta client. */
  | "test-client"
  /** The Build is vendored in the repository already. */
  | "vendored"
  /** Another tag of the same Build is the one the plan reads. */
  | "duplicate"
  /** The Build is the newest new one, and reported already. */
  | "reported"
  /** A newer new Build is reported already. */
  | "superseded-by-reported";

export interface IgnoredTag {
  tag: string;
  reason: IgnoreReason;
  /** The reason in one sentence, naming the values. */
  message: string;
}

/** A new live Patch, with what an issue about it links to. */
export interface NewPatch {
  build: string;
  gameVersion: string;
  tag: string;
  commit: string;
  links: TagLinks;
}

export interface PatchWatchInput {
  /** The jass-history tags, in any order. */
  tags: readonly JassHistoryTag[];
  /** The supported Patch: the Typings' `reforged.patch`, or its override. */
  supported: string;
  /** The Builds vendored in the repository, never reported. */
  vendored: readonly string[];
  /** The Builds an issue already reports. */
  reported: readonly string[];
}

export interface PatchWatchPlan {
  supported: string;
  /** The newest new live Patch to report; `null` when there is none. */
  patch: NewPatch | null;
  /** The other new live Patches `patch` supersedes, in Build order. */
  superseded: NewPatch[];
  /** Every other tag, with its reason, in code-point order of its name. */
  ignored: IgnoredTag[];
}

/** A tag that names a new live Build. */
interface Candidate {
  tag: JassHistoryTag;
  parsed: ParsedTag;
}

/** Why a read tag is not of the live Reforged game, if it is not. */
function notLive(
  tag: JassHistoryTag,
  parsed: ParsedTag,
): Omit<IgnoredTag, "tag"> | undefined {
  if (parsed.prefix !== LIVE_PREFIX) {
    return {
      reason: "not-reforged",
      message: `${tag.name} is a ${parsed.prefix} tag; the Typings vendor ${LIVE_PREFIX} tags only.`,
    };
  }
  for (const qualifier of parsed.qualifiers) {
    const client = NOT_LIVE_CLIENTS.get(qualifier);
    if (client !== undefined) {
      return {
        reason: "test-client",
        message: `${tag.name} is of the ${client} client (${qualifier}), not a live Patch.`,
      };
    }
  }
  return undefined;
}

/**
 * Orders the tags of one Build, the one the plan reads first: the tag
 * marked live, then code-point order.
 */
function byPreference(a: Candidate, b: Candidate): number {
  const rank = ({ parsed }: Candidate) =>
    parsed.qualifiers.includes(LIVE_CLIENT) ? 0 : 1;
  return rank(a) - rank(b) || byCodePoint(a.tag.name, b.tag.name);
}

function newPatch(tag: JassHistoryTag, build: string): NewPatch {
  return {
    build,
    gameVersion: gameVersion(build),
    tag: tag.name,
    commit: tag.commit,
    links: tagLinks(tag),
  };
}

/**
 * The plan of the Patch watch: the newest live Reforged Build above the
 * supported Patch that is neither vendored nor reported, the other new
 * Builds it supersedes, and every other tag with the reason it is ignored.
 * Builds compare as four integers. Never throws on a tag name.
 */
export function planPatchWatch(input: PatchWatchInput): PatchWatchPlan {
  const ignored: IgnoredTag[] = [];
  const candidates = new Map<string, Candidate[]>();

  for (const tag of input.tags) {
    const parsed = parseTag(tag.name);
    if (parsed === null) {
      ignored.push({
        tag: tag.name,
        reason: "no-build",
        // Quoted: a malformed name may be empty or hold a line break.
        message: `${JSON.stringify(tag.name)} is not <prefix>-v<four-number Build>[-<qualifier>]... (baseline, locale-only tags and old betas have no Build).`,
      });
      continue;
    }
    const { build } = parsed;
    if (compareBuilds(build, input.supported) <= 0) {
      ignored.push({
        tag: tag.name,
        reason: "not-newer",
        message: `${tag.name}: Build ${build} is not above the supported Patch ${input.supported}.`,
      });
      continue;
    }
    const reason = notLive(tag, parsed);
    if (reason !== undefined) {
      ignored.push({ tag: tag.name, ...reason });
      continue;
    }
    if (input.vendored.includes(build)) {
      ignored.push({
        tag: tag.name,
        reason: "vendored",
        message: `${tag.name}: Build ${build} is vendored already.`,
      });
      continue;
    }
    candidates.set(build, [...(candidates.get(build) ?? []), { tag, parsed }]);
  }

  const patches: NewPatch[] = [];
  for (const [build, tags] of candidates) {
    const [chosen, ...others] = tags.sort(byPreference);
    patches.push(newPatch(chosen.tag, build));
    for (const { tag } of others) {
      ignored.push({
        tag: tag.name,
        reason: "duplicate",
        message: `${tag.name}: Build ${build} is also tagged ${chosen.tag.name}, the tag the watch reads.`,
      });
    }
  }
  patches.sort((a, b) => compareBuilds(a.build, b.build));

  let patch = patches.pop() ?? null;
  let superseded = patches;
  if (patch !== null && input.reported.includes(patch.build)) {
    const newest = patch.build;
    ignored.push({
      tag: patch.tag,
      reason: "reported",
      message: `${patch.tag}: Build ${newest} is reported already.`,
    });
    for (const older of superseded) {
      ignored.push({
        tag: older.tag,
        reason: "superseded-by-reported",
        message: `${older.tag}: Build ${older.build} is superseded by ${newest}, reported already.`,
      });
    }
    patch = null;
    superseded = [];
  }

  ignored.sort((a, b) => byCodePoint(a.tag, b.tag));
  return { supported: input.supported, patch, superseded, ignored };
}

/** Repository inputs the watch cannot read, naming the file at fault. */
export class WatchInputError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "WatchInputError";
  }
}

/** The names of the Build folders in `dir`; none when it does not exist. */
async function buildFolders(dir: string): Promise<string[]> {
  try {
    return (await readdir(dir, { withFileTypes: true }))
      .filter((item) => item.isDirectory() && isBuild(item.name))
      .map((item) => item.name);
  } catch (error) {
    if (isRecord(error) && error.code === "ENOENT") return [];
    throw new WatchInputError(`${dir}: ${errorMessage(error)}`, {
      cause: error,
    });
  }
}

/**
 * What the watch reads from the workspace at `root`: the supported Patch
 * (the Typings' `reforged.patch`) and the vendored Builds (the `patch` of
 * each `vendor/<Build>/provenance.json` of the Typings), in Build order.
 * Throws a `WatchInputError` when either cannot be read.
 */
export async function readWatchRepository(
  root: string,
): Promise<{ supported: string; vendored: string[] }> {
  const typings = (await readPublishablePackages(root)).find(
    (pkg) => pkg.name === TYPINGS_PACKAGE,
  );
  if (typings === undefined) {
    throw new WatchInputError(
      `No publishable package is named ${TYPINGS_PACKAGE} in ${root}.`,
    );
  }
  const supported = declaredPatch(typings.manifest);
  if (!isBuild(supported)) {
    throw new WatchInputError(
      `${join(typings.absoluteDir, "package.json")}: reforged.patch is ${JSON.stringify(supported)}, not a Build such as 3.0.0.24268.`,
    );
  }

  const vendorDir = join(typings.absoluteDir, "vendor");
  const vendored: string[] = [];
  for (const folder of await buildFolders(vendorDir)) {
    const file = join(vendorDir, folder, "provenance.json");
    let patch: unknown;
    try {
      const provenance = JSON.parse(await readFile(file, "utf8")) as unknown;
      patch = isRecord(provenance) ? provenance.patch : undefined;
    } catch (error) {
      throw new WatchInputError(`${file}: ${errorMessage(error)}`, {
        cause: error,
      });
    }
    if (!isBuild(patch)) {
      throw new WatchInputError(
        `${file}: patch is ${JSON.stringify(patch)}, not a Build such as 3.0.0.24268.`,
      );
    }
    vendored.push(patch);
  }
  return { supported, vendored: vendored.sort(compareBuilds) };
}
