/** @noSelfInFile */

// Protected callbacks: the one step every Wrapper member that hands a
// function to a Native goes through (`Timer.start`, and the Trigger, Group
// and Force members). The decision is taken when the callback is
// registered, never on the hot path (ADR 0007): with Dev mode off the
// function comes back as it was given, so the Native receives the very
// function; in Dev mode it comes back wrapped, and the wrapper runs it under
// pcall with the original arguments.
//
// A failure is reported on one line, on screen to the local player for
// thirty seconds and through `print`: the library's name, the origin (the
// Wrapper's class and id plus the registering member, `Timer#1048577
// Timer.start`) and the Lua error text unchanged, which carries the
// `war3map.lua` line without the `debug` library the game lacks. The same
// callback failing with the same message again is counted, not reported
// again; `Reforged.debug.report()` prints the counts.
//
// Package-internal: nothing here is exported from the library index.

import type { Handle } from "../handles/handle";
import { anchored, LIBRARY } from "../init/state";
import { configuration, noteRegistration } from "./configuration";

/** How long a report stays on screen, in seconds. */
const REPORT_DURATION = 30;

/** One failing callback and message, as `Reforged.debug.report()` returns it. */
export interface CallbackFailure {
  /** Where the callback was registered: `Timer#1048577 Timer.start`. */
  readonly origin: string;
  /** The Lua error text, as pcall returned it. */
  readonly message: string;
  /** How many times it failed, the reported first time included. */
  readonly count: number;
}

/** A failure row as the store keeps it: the count grows. */
interface FailureRow {
  readonly origin: string;
  readonly message: string;
  count: number;
}

/** Every failure since the last reset, in the order they first happened. */
interface FailureStore {
  rows: FailureRow[];
  /** Bumped by each reset, so a callback forgets the messages it saw. */
  generation: number;
}

/**
 * The store, anchored on the library's global so a second load of the
 * library counts into the same one. Made on first use: a release build that
 * never fails a protected callback never creates it.
 */
function store(): FailureStore {
  return anchored<FailureStore>("failures", () => ({
    rows: [],
    generation: 0,
  }));
}

/**
 * Reports one Guard line: on screen to the local player for thirty seconds,
 * through the timed-text Native, and through `print`. `line` carries the
 * `reforged-ts:` prefix already.
 */
export function reportLine(line: string): void {
  DisplayTimedTextToPlayer(GetLocalPlayer(), 0, 0, REPORT_DURATION, line);
  print(line);
}

/** The origin a report names: `Timer#1048577 Timer.start`, or the member alone. */
export function originOf(
  owner: Handle<handle> | undefined,
  member: string,
): string {
  if (owner === undefined) {
    return member;
  }
  return `${owner.constructor.name}#${String(owner.id)} ${member}`;
}

/**
 * The function to hand a Native for `callback`, registered through `member`
 * (`"Timer.start"`) of `owner`, or of no Wrapper when `owner` is undefined
 * (a descriptor's name as `member`). The decision is taken now, for the
 * callback's lifetime:
 *
 * - With Dev mode off, `callback` itself, so the Native receives the very
 *   function.
 * - In Dev mode, a new function that runs `callback` under pcall with the
 *   arguments it was called with and returns its result. On failure it
 *   reports once per distinct message (`reforged-ts: <origin> failed:
 *   <message>`), counts every failure, and returns `failed`: the value the
 *   engine produces for a crashed callback, `false` for a condition or a
 *   filter, nothing for an action or a handler.
 *
 * Either way the registration is remembered as the first one if it is, so
 * `Reforged.configure` can name it.
 */
export function protect<Args extends unknown[], R>(
  owner: Handle<handle> | undefined,
  member: string,
  callback: (...args: Args) => R,
  failed?: R,
): (...args: Args) => R {
  if (configuration.firstRegistration === undefined) {
    noteRegistration(originOf(owner, member));
  }
  if (!configuration.devMode) {
    return callback;
  }
  // Read now: the Wrapper may be destroyed by the time its callback fails.
  const origin = originOf(owner, member);
  const reported = reportedFailures();
  return (...args: Args): R => {
    const [ok, result] = pcall(callback, ...args);
    if (ok) {
      return result;
    }
    reportFailure(reported, origin, tostring(result));
    return failed as R;
  };
}

/**
 * The messages one protected callback already reported, for one generation
 * of the store: what makes a repeat a count instead of a new report.
 */
export interface ReportedFailures {
  seen: Map<string, FailureRow> | undefined;
  generation: number;
}

/** A callback's memory of its reported failures: none yet. */
export function reportedFailures(): ReportedFailures {
  return { seen: undefined, generation: 0 };
}

/**
 * Records one failure of a protected callback that `reported` remembers:
 * the first time a message is seen (since the last reset) it is reported,
 * `reforged-ts: <origin> failed: <message>`; afterwards it is only counted.
 */
export function reportFailure(
  reported: ReportedFailures,
  origin: string,
  message: string,
): void {
  const failures = store();
  if (
    reported.seen === undefined ||
    reported.generation !== failures.generation
  ) {
    reported.seen = new Map();
    reported.generation = failures.generation;
  }
  const row = reported.seen.get(message);
  if (row !== undefined) {
    row.count++;
    return;
  }
  const added: FailureRow = { origin, message, count: 1 };
  failures.rows.push(added);
  reported.seen.set(message, added);
  reportLine(`${LIBRARY}: ${origin} failed: ${message}`);
}

/** The failures since the last reset, in the order they first happened. */
export function callbackFailures(): CallbackFailure[] {
  return store().rows.map((row) => ({ ...row }));
}

/** Forgets every failure: the next one of each callback is reported again. */
export function resetCallbackFailures(): void {
  const failures = store();
  failures.rows = [];
  failures.generation++;
}
