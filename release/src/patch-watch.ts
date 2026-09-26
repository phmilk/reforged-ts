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
import {
  tagLinks,
  type JassHistoryTag,
  type TagLinks,
} from "./jass-history.js";
import { byCodePoint } from "./order.js";
import { TYPINGS_PACKAGE } from "./packages.js";
import { errorMessage, isRecord } from "./unknown.js";
import { readPublishablePackages } from "./workspace.js";

export type { JassHistoryTag } from "./jass-history.js";

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

/** The client marker of a live build. */
const LIVE_CLIENT = "w3";

/** The client markers of builds that are not live, and what they are. */
const NOT_LIVE_CLIENTS: ReadonlyMap<string, string> = new Map([
  ["w3t", "test"],
  ["w3b", "beta"],
]);

/** An abbreviated commit hash, as a tag carries one. */
const SHORT_HASH = /^[0-9a-f]{7,40}$/;

/** Why the plan ignores a tag. */
export type IgnoreReason =
  /** The name has no four-number Build. */
  | "no-build"
  /** The Build is not above the supported Patch. */
  | "not-newer"
  /** The tag is of another game line than Reforged. */
  | "not-reforged"
  /** A qualifier is neither a client marker nor a commit hash. */
  | "unknown-qualifier"
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

/** A new live Build, with what an issue about it links to. */
export interface NewBuild {
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
  /** The newest new live Build to report; `null` when there is none. */
  patch: NewBuild | null;
  /** The other new live Builds `patch` supersedes, in Build order. */
  superseded: NewBuild[];
  /** Every other tag, with its reason, in code-point order of its name. */
  ignored: IgnoredTag[];
}

/** Why a read tag is not a live Reforged one, if it is not. */
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
  const unknown = parsed.qualifiers.find(
    (qualifier) =>
      qualifier !== LIVE_CLIENT &&
      !NOT_LIVE_CLIENTS.has(qualifier) &&
      !SHORT_HASH.test(qualifier),
  );
  if (unknown !== undefined) {
    return {
      reason: "unknown-qualifier",
      message: `${tag.name} has the qualifier ${unknown}, neither a client marker (${LIVE_CLIENT} live, w3t test, w3b beta) nor a commit hash.`,
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

/** The tag the plan reads for a Build tagged more than once. */
function preferred(
  a: { tag: JassHistoryTag; parsed: ParsedTag },
  b: { tag: JassHistoryTag; parsed: ParsedTag },
): number {
  const live = (candidate: { parsed: ParsedTag }) =>
    candidate.parsed.qualifiers.includes(LIVE_CLIENT) ? 0 : 1;
  return live(a) - live(b) || byCodePoint(a.tag.name, b.tag.name);
}

function newBuild(tag: JassHistoryTag, build: string): NewBuild {
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
  const candidates = new Map<
    string,
    { tag: JassHistoryTag; parsed: ParsedTag }[]
  >();

  for (const tag of input.tags) {
    const parsed = parseTag(tag.name);
    if (parsed === null) {
      ignored.push({
        tag: tag.name,
        reason: "no-build",
        message: `${JSON.stringify(tag.name)} has no four-number Build such as Reforged-v3.0.0.24268-w3-3a9d8f2 (baseline, locale-only tags and old betas have none).`,
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
    const why = notLive(tag, parsed);
    if (why !== undefined) {
      ignored.push({ tag: tag.name, ...why });
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

  const builds: NewBuild[] = [];
  for (const [build, tags] of candidates) {
    const [chosen, ...others] = tags.sort(preferred);
    builds.push(newBuild(chosen.tag, build));
    for (const { tag } of others) {
      ignored.push({
        tag: tag.name,
        reason: "duplicate",
        message: `${tag.name}: Build ${build} is also tagged ${chosen.tag.name}, the tag the watch reads.`,
      });
    }
  }
  builds.sort((a, b) => compareBuilds(a.build, b.build));

  let patch = builds.pop() ?? null;
  let superseded = builds;
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
  const reforged = typings.manifest.reforged;
  const supported = isRecord(reforged) ? reforged.patch : undefined;
  if (!isBuild(supported)) {
    throw new WatchInputError(
      `${join(typings.absoluteDir, "package.json")}: reforged.patch is ${JSON.stringify(supported)}, not a Build such as 3.0.0.24268.`,
    );
  }

  const vendorDir = join(typings.absoluteDir, "vendor");
  let folders: string[];
  try {
    folders = (await readdir(vendorDir, { withFileTypes: true }))
      .filter((item) => item.isDirectory())
      .map((item) => item.name);
  } catch (error) {
    if (isRecord(error) && error.code === "ENOENT") folders = [];
    else throw error;
  }
  const vendored: string[] = [];
  for (const folder of folders) {
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
