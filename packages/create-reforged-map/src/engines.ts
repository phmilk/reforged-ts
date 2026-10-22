/**
 * The Node versions a package's `engines.node` range admits, read without a
 * dependency: the Template's requirement, which the running Node is held to
 * once the Template is written. It reads the ranges npm documents for
 * `engines`: comparators (`>=24`, `<25.1`, `=24.0.0`), caret and tilde
 * ranges (`^22.13`, `~24.1`), x-ranges (`24`, `24.x`, `*`) and hyphen
 * ranges (`22.13 - 24`), sets of space-separated comparators joined by `||`.
 */

/** A version's three numbers; a prerelease or build suffix is left out. */
type Version = readonly [number, number, number];

/**
 * The versions from `low` (included) to `high` (excluded); a missing bound
 * is open.
 */
interface Interval {
  low?: Version;
  high?: Version;
}

const PARTIAL =
  /^v?(\d+|[xX*])(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(?:[-+][0-9A-Za-z.-]*)?$/;

/** Admits no version: `<*`, `>*`. */
const NONE: Interval = { high: [0, 0, 0] };

/**
 * Whether the Node `version` (`process.version`, `v24.1.0`) satisfies the
 * `engines.node` range `range`; `undefined` when either cannot be read. A
 * prerelease of Node counts as its release.
 */
export function satisfies(version: string, range: string): boolean | undefined {
  const numbers = readPartial(version);
  if (numbers?.length !== 3) return undefined;
  const node: Version = [numbers[0] ?? 0, numbers[1] ?? 0, numbers[2] ?? 0];
  const sets: Interval[][] = [];
  for (const set of range.split("||")) {
    const intervals = readSet(set.trim());
    if (intervals === undefined) return undefined;
    sets.push(intervals);
  }
  return sets.some((set) => set.every((interval) => within(node, interval)));
}

/** The intervals a version must all be in for one space-separated set. */
function readSet(set: string): Interval[] | undefined {
  const hyphen = /^(\S+)\s+-\s+(\S+)$/.exec(set);
  if (hyphen !== null) {
    const from = readPartial(hyphen[1]);
    const to = readPartial(hyphen[2]);
    if (from === undefined || to === undefined) return undefined;
    return [interval(">=", from), interval("<=", to)];
  }
  // `>= 24` is `>=24`: an operator may stand apart from its version.
  const tokens = set
    .replace(/(<=|>=|<|>|=|\^|~)\s+/g, "$1")
    .split(/\s+/)
    .filter((token) => token !== "");
  const intervals: Interval[] = [];
  for (const token of tokens) {
    const match = /^(<=|>=|<|>|=|\^|~)?(.*)$/.exec(token);
    const numbers = readPartial(match?.[2] ?? "");
    if (numbers === undefined) return undefined;
    intervals.push(interval(match?.[1] ?? "=", numbers));
  }
  return intervals;
}

/**
 * The numbers of `text`, a version whose missing or wildcard numbers are
 * left out (`24.x` is `[24]`), or `undefined` when it is not one.
 */
function readPartial(text: string): number[] | undefined {
  const match = PARTIAL.exec(text);
  if (match === null) return undefined;
  // The optional groups are undefined when absent, which the type omits.
  const groups: (string | undefined)[] = match.slice(1, 4);
  const numbers: number[] = [];
  for (const group of groups) {
    if (group === undefined || !/^\d+$/.test(group)) break;
    numbers.push(Number(group));
  }
  return numbers;
}

/** The versions `operator` and the partial version `numbers` admit. */
function interval(operator: string, numbers: readonly number[]): Interval {
  const [major = 0, minor = 0, patch = 0] = numbers;
  if (numbers.length === 0) {
    return operator === "<" || operator === ">" ? NONE : {};
  }
  const low: Version = [major, minor, patch];
  // The first version past every one `numbers` matches.
  const next: Version =
    numbers.length === 1
      ? [major + 1, 0, 0]
      : numbers.length === 2
        ? [major, minor + 1, 0]
        : [major, minor, patch + 1];
  switch (operator) {
    case ">=":
      return { low };
    case ">":
      return { low: next };
    case "<":
      return { high: low };
    case "<=":
      return { high: next };
    case "^":
      return {
        low,
        high:
          major > 0 || numbers.length === 1
            ? [major + 1, 0, 0]
            : minor > 0 || numbers.length === 2
              ? [0, minor + 1, 0]
              : [0, 0, patch + 1],
      };
    case "~":
      return {
        low,
        high: numbers.length === 1 ? [major + 1, 0, 0] : [major, minor + 1, 0],
      };
    default:
      // `=` and a bare version: every version `numbers` matches.
      return { low, high: next };
  }
}

function within(version: Version, { low, high }: Interval): boolean {
  return (
    (low === undefined || compare(version, low) >= 0) &&
    (high === undefined || compare(version, high) < 0)
  );
}

function compare(a: Version, b: Version): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}
