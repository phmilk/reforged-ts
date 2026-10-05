/**
 * The coverage of the Crashing cases, in the spirit of the Wrapper coverage
 * report: `crashing-cases.json` holds one record per crashed row of the
 * Nullability sweep's report, the Native and the case's label, with the
 * Guards that keep a Map project off it, or the reason it has none. Every
 * crashed row needs a record and every record a crashed row, so a Patch
 * whose sweep finds a new Crashing case, or loses one, updates the file.
 * Every Guard a record names must exist: a rule of the lint plugin, or a
 * member of the library. Pure: the report's text, the parsed records and
 * the sources the Guards are read from in, the problems out.
 */
import * as ts from "typescript";
import { readSection } from "./section.js";

/** A crashed row of the report: the Native and its case's label. */
export interface CrashingCase {
  native: string;
  case: string;
}

/**
 * A record of `crashing-cases.json`, with exactly one of `guard` and
 * `excluded`. A Guard is a lint rule (`no-crashing-arguments`) or a
 * Wrapper's member that checks in Dev mode, `Class.member` when static
 * (`Image.create`), `Class#member` otherwise; a case with a Guard in both
 * layers lists both.
 */
export interface CrashingCaseRecord extends CrashingCase {
  guard?: string | readonly string[];
  /** Why the case has no Guard. */
  excluded?: string;
}

/** A lint rule's name, or a Wrapper's `Class.member` or `Class#member`. */
const GUARD = /^(?:[a-z][a-z0-9]*(?:-[a-z0-9]+)*|[A-Z]\w*[.#]\w+)$/;

/** The Guards that exist, which a record's Guard must be one of. */
export interface KnownGuards {
  /** The rules of eslint-plugin-reforged: `no-crashing-arguments`. */
  rules: ReadonlySet<string>;
  /** The library's class members: `Image.create` (static), `Timer#start`. */
  members: ReadonlySet<string>;
}

/**
 * The Guards that exist: the rules `rulesIndex`, the lint plugin's rule
 * registry, imports (one `import <name> from "./<rule>.js";` line each),
 * and the members of the classes the library's `sources` declare.
 */
export function knownGuards(
  rulesIndex: string,
  sources: readonly { fileName: string; text: string }[],
): KnownGuards {
  const rules = new Set(
    [...rulesIndex.matchAll(/^import \w+ from "\.\/([a-z0-9-]+)\.js";$/gm)].map(
      ([, rule]) => rule,
    ),
  );
  const members = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isClassDeclaration(node) && node.name !== undefined) {
      const owner = node.name.text;
      for (const member of node.members) {
        if (member.name === undefined || !ts.isIdentifier(member.name)) {
          continue;
        }
        const isStatic =
          (ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static) !== 0;
        members.add(`${owner}${isStatic ? "." : "#"}${member.name.text}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  for (const { fileName, text } of sources) {
    visit(ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true));
  }
  return { rules, members };
}

const FIELDS = new Set(["native", "case", "guard", "excluded"]);

/** The label a skip list and the report's `PENDING` lines give a case. */
function label({ native, case: name }: CrashingCase): string {
  return `${native} ${name}`;
}

/**
 * The crashed rows of `report`, every Slice's, in its order: each case of a
 * Native, or of a parameter of call cases, whose `Outcome` is `crashed`,
 * its label with the table's escapes undone.
 */
export function crashedCases(report: string): CrashingCase[] {
  const probes = [...report.matchAll(/^## `([^`]+)`$/gm)].map(
    ([, probe]) => probe,
  );
  return probes.flatMap((probe) => {
    const section = readSection(report, probe);
    if (section === undefined) return [];
    return [...section.natives.values(), ...section.params.values()].flatMap(
      ({ native, outcomes }) =>
        [...outcomes]
          .filter(([, outcome]) => outcome === "crashed")
          .map(([name]) => ({ native, case: name })),
    );
  });
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/** What is wrong with the fields of a record past its Native and case. */
function recordProblems(
  record: Record<string, unknown>,
  known: KnownGuards,
): string[] {
  const problems = Object.keys(record)
    .filter((field) => !FIELDS.has(field))
    .map((field) => `has an unknown field ${field}`);
  const { guard, excluded } = record;
  if (guard !== undefined && excluded !== undefined) {
    return [...problems, "has both guard and excluded: give exactly one"];
  }
  if (guard === undefined && excluded === undefined) {
    return [...problems, "has neither guard nor excluded: give exactly one"];
  }
  if (excluded !== undefined && !nonEmpty(excluded)) {
    problems.push("excluded is not a reason: give a non-empty string");
  }
  if (guard !== undefined) {
    const guards: unknown[] = Array.isArray(guard) ? guard : [guard];
    if (guards.length === 0) {
      problems.push("guard is an empty list: give one Guard or more");
    }
    const seen = new Set<unknown>();
    for (const name of guards) {
      if (typeof name !== "string" || !GUARD.test(name)) {
        problems.push(
          `guard ${JSON.stringify(name)} is neither a rule (no-crashing-arguments) nor a Class.member or Class#member (Image.create)`,
        );
      } else if (/^[a-z]/.test(name) && !known.rules.has(name)) {
        problems.push(
          `guard ${JSON.stringify(name)} is not a rule of eslint-plugin-reforged`,
        );
      } else if (/^[A-Z]/.test(name) && !known.members.has(name)) {
        problems.push(
          `guard ${JSON.stringify(name)} is not a member of the reforged-ts library`,
        );
      } else if (seen.has(name)) {
        problems.push(`guard ${JSON.stringify(name)} is named twice`);
      }
      seen.add(name);
    }
  }
  return problems;
}

/**
 * Every problem of `records`, the parsed `crashing-cases.json`, against the
 * crashed rows of `report` and the Guards that exist, one line each: a
 * record of the wrong shape or naming a Guard that does not exist, a case
 * recorded twice, a crashed row with no record, then a record whose case is
 * no longer a crashed row. Empty when they agree.
 */
export function crashingCaseProblems(
  report: string,
  records: unknown,
  guards: KnownGuards,
): string[] {
  if (!Array.isArray(records)) {
    return ["crashing-cases.json is not a list of records"];
  }
  const problems: string[] = [];
  const recorded = new Set<string>();
  for (const [index, record] of (records as unknown[]).entries()) {
    const where = `record ${String(index + 1)}`;
    if (
      typeof record !== "object" ||
      record === null ||
      Array.isArray(record)
    ) {
      problems.push(`${where} is not an object`);
      continue;
    }
    const fields = record as Record<string, unknown>;
    if (!nonEmpty(fields.native) || !nonEmpty(fields.case)) {
      problems.push(
        `${where} has no native and case: give both as non-empty strings`,
      );
      continue;
    }
    const name = label({ native: fields.native, case: fields.case });
    if (recorded.has(name)) problems.push(`${name}: recorded twice`);
    recorded.add(name);
    for (const problem of recordProblems(fields, guards)) {
      problems.push(`${name}: ${problem}`);
    }
  }
  const crashed = new Set(crashedCases(report).map(label));
  for (const name of crashed) {
    if (!recorded.has(name)) {
      problems.push(
        `${name}: a crashed row of the report with no record: add one with a Guard or a reason it is excluded`,
      );
    }
  }
  for (const name of recorded) {
    if (!crashed.has(name)) {
      problems.push(
        `${name}: recorded, but no longer a crashed row of the report: remove its record`,
      );
    }
  }
  return problems;
}
