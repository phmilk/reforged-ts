/**
 * Whether the jobs of a workflow run, read from their `if` conditions and
 * their `needs` under the facts a diagram knows, and the modes each runs in
 * when a deciding job's outputs (`select`'s `mode` and `dry-run` in
 * `release.yml`) set them: every value a condition compares one of those
 * outputs with is a mode. A fact no one gives (another context, a function,
 * another job's output) never rules a job out: what of its condition is
 * left undecided is kept, and the job runs when it holds. The happy path is
 * drawn: a job that may run is taken to run and succeed, so
 * `needs.<job>.result` is `success` when it may run and `skipped` when it
 * cannot, and `failure()` and `cancelled()` are false.
 */
import {
  known,
  parseExpression,
  printExpression,
  reduce,
  truthy,
  walk,
  type Expression,
  type Fact,
  type Value,
} from "./github-expression.js";
import { byCodePoint } from "./order.js";
import type { WorkflowJob } from "./workflows.js";

/** Whether a job runs: always, never, or when its residue holds. */
export type Runs = boolean | Expression;

const STATUS = new Set(["success", "always", "cancelled", "failure"]);

const SUCCESS: Expression = { type: "call", name: "success", args: [] };

/**
 * The condition of each job, by id, as GitHub reads it: `success()` when
 * it has none, and `success() && (<if>)` when its `if` calls no status
 * function.
 */
function conditionsOf(jobs: readonly WorkflowJob[]): Map<string, Expression> {
  return new Map(
    jobs.map(({ id, if: text }) => {
      if (text === undefined) return [id, SUCCESS];
      const parsed = parseExpression(text);
      const hasStatus = [...walk(parsed)].some(
        (node) => node.type === "call" && STATUS.has(node.name),
      );
      return [
        id,
        hasStatus ? parsed : { type: "and", left: SUCCESS, right: parsed },
      ];
    }),
  );
}

/**
 * Whether each of `jobs` runs, by id, when the properties `given` (by path,
 * `github.repository`) hold their values.
 */
function runsOf(
  jobs: readonly WorkflowJob[],
  conditions: ReadonlyMap<string, Expression>,
  given: ReadonlyMap<string, Value>,
): Map<string, Runs> {
  const byId = new Map(jobs.map((job) => [job.id, job]));
  const memo = new Map<string, Runs | null>();
  const mayRun = (id: string) => run(id) !== false;

  const facts = (job: WorkflowJob) => (fact: Fact) => {
    if (fact.type === "property") {
      if (given.has(fact.path)) return given.get(fact.path);
      const need = /^needs\.([\w-]+)\.result$/.exec(fact.path)?.[1];
      if (need === undefined || !byId.has(need)) return undefined;
      return mayRun(need) ? "success" : "skipped";
    }
    switch (fact.name) {
      case "success":
        return job.needs.every(mayRun);
      case "always":
        return true;
      case "cancelled":
      case "failure":
        return false;
      default:
        return undefined;
    }
  };

  function run(id: string): Runs {
    const memoized = memo.get(id);
    if (memoized === null) throw new Error(`The job ${id} needs itself.`);
    if (memoized !== undefined) return memoized;
    const job = byId.get(id);
    const condition = conditions.get(id);
    if (job === undefined || condition === undefined) {
      throw new Error(`No job ${id}.`);
    }
    memo.set(id, null);
    const reduced = reduce(condition, facts(job));
    const runs = known(reduced) ? truthy(reduced.value) : reduced.residue;
    memo.set(id, runs);
    return runs;
  }

  return new Map(jobs.map(({ id }) => [id, run(id)]));
}

/**
 * Whether each of `jobs` runs, by id, when the properties `given` (by path,
 * `github.repository`) hold their values: `false` when it cannot,
 * `true` when it does, else the residue of its condition, which it runs on.
 */
export function jobRuns(
  jobs: readonly WorkflowJob[],
  given: ReadonlyMap<string, Value>,
): Map<string, Runs> {
  return runsOf(jobs, conditionsOf(jobs), given);
}

/**
 * The value of a deciding output that no condition names, as an opaque
 * value: equal to none of the values a condition compares with, and truthy
 * (the mode `none` of the release, which no job's condition names).
 */
const OTHER = Symbol("other");

/** One combination of the deciding outputs' values, by output. */
type Scenario = ReadonlyMap<string, string | typeof OTHER>;

/**
 * The values the conditions compare each output of `decider` with, by
 * output, in lower case.
 */
function comparedValues(
  conditions: Iterable<Expression>,
  decider: string,
): Map<string, Set<string>> {
  const prefix = `needs.${decider}.outputs.`;
  const compared = new Map<string, Set<string>>();
  for (const condition of conditions) {
    for (const node of walk(condition)) {
      if (node.type !== "compare") continue;
      for (const [side, other] of [
        [node.left, node.right],
        [node.right, node.left],
      ] as const) {
        if (side.type !== "property" || !side.path.startsWith(prefix)) continue;
        if (other.type !== "string") continue;
        const output = side.path.slice(prefix.length);
        compared.set(
          output,
          (compared.get(output) ?? new Set()).add(other.value.toLowerCase()),
        );
      }
    }
  }
  return compared;
}

/**
 * Every combination of the values of the outputs `compared` holds, each
 * with its name: a flag (an output compared with `true` and `false` only)
 * is `true` or `false`, and named `(<output>)` when true; any other output
 * takes each value compared with, or another one, named `another <output>`.
 */
function scenariosOf(
  compared: ReadonlyMap<string, ReadonlySet<string>>,
): { scenario: Scenario; name: string }[] {
  const outputs = [...compared.keys()].sort(byCodePoint);
  const isFlag = (output: string) =>
    [...(compared.get(output) ?? [])].every(
      (value) => value === "true" || value === "false",
    );
  const valuesOf = (output: string): (string | typeof OTHER)[] =>
    isFlag(output)
      ? ["true", "false"]
      : [...[...(compared.get(output) ?? [])].sort(byCodePoint), OTHER];
  let scenarios: Scenario[] = [new Map()];
  for (const output of outputs) {
    scenarios = scenarios.flatMap((scenario) =>
      valuesOf(output).map((value) => new Map(scenario).set(output, value)),
    );
  }
  const words = (output: string) => output.replaceAll("-", " ");
  return scenarios.map((scenario) => {
    const values = outputs
      .filter((output) => !isFlag(output))
      .map((output) => {
        const value = scenario.get(output);
        return value === OTHER || value === undefined
          ? `another ${words(output)}`
          : value;
      });
    const flags = outputs
      .filter((output) => isFlag(output) && scenario.get(output) === "true")
      .map((output) => `(${words(output)})`);
    return { scenario, name: [...values, ...flags].join(" ") };
  });
}

/**
 * The label of a job that runs in the modes `names` (of `total`), each
 * with the residue of its condition there (empty when none): the modes in
 * code-point order, `always` for every one, then ` if <residue>`; the
 * groups of one residue apart, joined by `; `; `never` for none.
 */
function modesLabel(
  modes: readonly { name: string; residue: string }[],
  total: number,
): string {
  if (modes.length === 0) return "never";
  const groups = new Map<string, string[]>();
  for (const { name, residue } of modes) {
    groups.set(residue, [...(groups.get(residue) ?? []), name]);
  }
  return [...groups]
    .sort(([a], [b]) => byCodePoint(a, b))
    .map(([residue, names]) => {
      const which =
        names.length === total ? "always" : names.sort(byCodePoint).join(", ");
      return residue === "" ? which : `${which} if ${residue}`;
    })
    .join("; ");
}

/**
 * The modes each of `jobs` runs in, by job id: the names of the
 * combinations of `decider`'s outputs in which its condition and its needs
 * let it run, each with what else its condition reads there (see
 * {@link modesLabel}).
 */
export function jobModes(
  jobs: readonly WorkflowJob[],
  decider: string,
): Map<string, string> {
  const conditions = conditionsOf(jobs);
  const scenarios = scenariosOf(comparedValues(conditions.values(), decider));
  const modes = new Map(
    jobs.map(({ id }) => [id, [] as { name: string; residue: string }[]]),
  );
  for (const { scenario, name } of scenarios) {
    const given = new Map<string, Value>(
      [...scenario].map(([output, value]) => [
        `needs.${decider}.outputs.${output}`,
        value,
      ]),
    );
    for (const [id, runs] of runsOf(jobs, conditions, given)) {
      if (runs === false) continue;
      const residue = runs === true ? "" : printExpression(runs);
      modes.get(id)?.push({ name, residue });
    }
  }
  return new Map(
    [...modes].map(([id, list]) => [id, modesLabel(list, scenarios.length)]),
  );
}
