/**
 * The modes a job of a workflow runs in, read from the jobs' `if`
 * conditions and their `needs`: a deciding job's outputs (`select`'s `mode`
 * and `dry-run` in `release.yml`) are the only facts, and every value a
 * condition compares one of them with is a mode. Everything else a
 * condition reads (another context, a function, another job's output) may be
 * either way, so it never rules a mode out. The happy path is drawn: a job
 * that runs succeeds, so `needs.<job>.result` is `success` when it runs and
 * `skipped` when it does not, and `failure()` and `cancelled()` are false.
 */
import { byCodePoint } from "./order.js";
import type { WorkflowJob } from "./workflows.js";

// The expressions of `if` (GitHub Actions' expression syntax), parsed.
type Expression =
  | { type: "and" | "or"; left: Expression; right: Expression }
  | { type: "not"; operand: Expression }
  | { type: "compare"; op: string; left: Expression; right: Expression }
  | { type: "call"; name: string; args: Expression[] }
  | { type: "string"; value: string }
  | { type: "literal"; value: boolean | number | null }
  | { type: "property"; path: string };

const TOKEN =
  /\s*(?:(&&|\|\||==|!=|<=|>=|<|>|!|\(|\)|,)|'((?:[^']|'')*)'|(-?\d+(?:\.\d+)?)|([A-Za-z_][\w-]*(?:\.[\w-]+|\.\*|\[\s*'[^']*'\s*\])*))/y;

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  TOKEN.lastIndex = 0;
  while (TOKEN.lastIndex < text.length) {
    if (/^\s*$/.test(text.slice(TOKEN.lastIndex))) break;
    const start = TOKEN.lastIndex;
    const match = TOKEN.exec(text);
    if (match === null) {
      throw new Error(
        `Cannot read the condition \`${text}\` at \`${text.slice(start).trim()}\`.`,
      );
    }
    tokens.push(match[0].trim());
  }
  return tokens;
}

const STATUS = new Set(["success", "always", "cancelled", "failure"]);

/** Parses the expression of an `if`. Throws on one it cannot read. */
function parse(text: string): Expression {
  const tokens = tokenize(text);
  let at = 0;
  const peek = (): string | undefined => tokens.at(at);
  const take = (expected?: string): string => {
    const token = tokens.at(at++);
    if (token === undefined || (expected !== undefined && token !== expected)) {
      throw new Error(
        `Cannot read the condition \`${text}\`: expected ${expected ?? "more"}, found ${token ?? "the end"}.`,
      );
    }
    return token;
  };

  const binary = (
    type: "and" | "or",
    op: string,
    operand: () => Expression,
  ): Expression => {
    let left = operand();
    while (peek() === op) {
      take();
      left = { type, left, right: operand() };
    }
    return left;
  };
  const or = (): Expression => binary("or", "||", and);
  const and = (): Expression => binary("and", "&&", unary);
  const unary = (): Expression => {
    if (peek() !== "!") return compare();
    take();
    return { type: "not", operand: unary() };
  };
  const compare = (): Expression => {
    const left = primary();
    const op = peek();
    if (op === undefined || !["==", "!=", "<", ">", "<=", ">="].includes(op)) {
      return left;
    }
    take();
    return { type: "compare", op, left, right: primary() };
  };
  const primary = (): Expression => {
    const token = take();
    if (token === "(") {
      const inner = or();
      take(")");
      return inner;
    }
    if (token.startsWith("'")) {
      return {
        type: "string",
        value: token.slice(1, -1).replaceAll("''", "'"),
      };
    }
    if (/^-?\d/.test(token)) return { type: "literal", value: Number(token) };
    if (token === "true" || token === "false") {
      return { type: "literal", value: token === "true" };
    }
    if (token === "null") return { type: "literal", value: null };
    if (/^[A-Za-z_]/.test(token) && peek() === "(") {
      take("(");
      const args: Expression[] = [];
      while (peek() !== ")") {
        args.push(or());
        if (peek() === ",") take(",");
      }
      take(")");
      return { type: "call", name: token.toLowerCase(), args };
    }
    if (/^[A-Za-z_]/.test(token)) {
      return {
        type: "property",
        path: token.replace(/\[\s*'([^']*)'\s*\]/g, ".$1"),
      };
    }
    throw new Error(`Cannot read the condition \`${text}\` at ${token}.`);
  };

  const expression = or();
  if (at < tokens.length) take("the end");
  return expression;
}

function* walk(expression: Expression): Generator<Expression> {
  yield expression;
  switch (expression.type) {
    case "and":
    case "or":
    case "compare":
      yield* walk(expression.left);
      yield* walk(expression.right);
      break;
    case "not":
      yield* walk(expression.operand);
      break;
    case "call":
      for (const arg of expression.args) yield* walk(arg);
      break;
    default:
      break;
  }
}

// A value a condition may hold: an unknown fact, or the value of a deciding
// output that no condition names (`select`'s mode `none`).
const UNKNOWN = Symbol("unknown");
const OTHER = Symbol("other");
type Value = string | number | boolean | null | typeof UNKNOWN | typeof OTHER;
type Truth = boolean | typeof UNKNOWN;

/** One combination of the deciding outputs' values. */
type Scenario = ReadonlyMap<string, string | typeof OTHER>;

const truth = (value: Value): Truth =>
  value === UNKNOWN
    ? UNKNOWN
    : value === OTHER
      ? true
      : typeof value === "string"
        ? value !== ""
        : typeof value === "number"
          ? value !== 0
          : value === true;

function compare(op: string, left: Value, right: Value): Truth {
  if (left === UNKNOWN || right === UNKNOWN) return UNKNOWN;
  // An order between two values: never a mode, so never ruled on.
  if (op !== "==" && op !== "!=") return UNKNOWN;
  if (left === OTHER && right === OTHER) return UNKNOWN;
  const normal = (value: Value) =>
    typeof value === "string" ? value.toLowerCase() : value;
  const equal = normal(left) === normal(right);
  return op === "==" ? equal : !equal;
}

/**
 * The modes each of `jobs` runs in, by job id: the names of the
 * combinations of `decider`'s outputs in which its condition and its needs
 * let it run, in code-point order, or `always` when that is every
 * combination and `never` when none.
 */
export function jobModes(
  jobs: readonly WorkflowJob[],
  decider: string,
): Map<string, string> {
  const byId = new Map(jobs.map((job) => [job.id, job]));
  const conditions = new Map(
    jobs.map(({ id, if: text }) => {
      const parsed: Expression =
        text === undefined
          ? { type: "call", name: "success", args: [] }
          : parse(text);
      const hasStatus = [...walk(parsed)].some(
        (node) => node.type === "call" && STATUS.has(node.name),
      );
      const implicit: Expression = hasStatus
        ? parsed
        : {
            type: "and",
            left: { type: "call", name: "success", args: [] },
            right: parsed,
          };
      return [id, implicit];
    }),
  );

  // The deciding outputs and the values the conditions compare them with.
  const outputPath = `needs.${decider}.outputs.`;
  const outputOf = (node: Expression) =>
    node.type === "property" && node.path.startsWith(outputPath)
      ? node.path.slice(outputPath.length)
      : undefined;
  const compared = new Map<string, Set<string>>();
  for (const condition of conditions.values()) {
    for (const node of walk(condition)) {
      if (node.type !== "compare") continue;
      for (const [side, other] of [
        [node.left, node.right],
        [node.right, node.left],
      ] as const) {
        const output = outputOf(side);
        if (output === undefined || other.type !== "string") continue;
        compared.set(
          output,
          (compared.get(output) ?? new Set()).add(other.value.toLowerCase()),
        );
      }
    }
  }
  const outputs = [...compared.keys()].sort(byCodePoint);
  const isFlag = (output: string) =>
    [...(compared.get(output) ?? [])].every(
      (v) => v === "true" || v === "false",
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
  const nameOf = (scenario: Scenario): string => {
    const values = outputs
      .filter((output) => !isFlag(output))
      .map((output) => {
        const value = scenario.get(output);
        return value === OTHER || value === undefined
          ? `another ${output.replaceAll("-", " ")}`
          : value;
      });
    const flags = outputs
      .filter((output) => isFlag(output) && scenario.get(output) === "true")
      .map((output) => `(${output.replaceAll("-", " ")})`);
    return [...values, ...flags].join(" ");
  };

  // Whether each job runs in a scenario: false, true, or perhaps.
  const runs = (scenario: Scenario): ((id: string) => Truth) => {
    const memo = new Map<string, Truth | null>();
    const run = (id: string): Truth => {
      const known = memo.get(id);
      if (known === null) throw new Error(`The job ${id} needs itself.`);
      if (known !== undefined) return known;
      memo.set(id, null);
      const job = byId.get(id);
      const condition = conditions.get(id);
      if (job === undefined || condition === undefined) {
        throw new Error(`No job ${id}.`);
      }
      const value = (node: Expression): Value => {
        switch (node.type) {
          case "string":
          case "literal":
            return node.value;
          case "property": {
            const output = outputOf(node);
            if (output !== undefined) return scenario.get(output) ?? UNKNOWN;
            const result = /^needs\.([\w-]+)\.result$/.exec(node.path)?.[1];
            if (result === undefined || !byId.has(result)) return UNKNOWN;
            const ran = run(result);
            return ran === UNKNOWN ? UNKNOWN : ran ? "success" : "skipped";
          }
          case "call":
            switch (node.name) {
              case "success": {
                const needs = job.needs.map(run);
                return needs.includes(false)
                  ? false
                  : needs.includes(UNKNOWN)
                    ? UNKNOWN
                    : true;
              }
              case "always":
                return true;
              case "cancelled":
              case "failure":
                return false;
              default:
                return UNKNOWN;
            }
          case "compare":
            return compare(node.op, value(node.left), value(node.right));
          case "not": {
            const operand = truth(value(node.operand));
            return operand === UNKNOWN ? UNKNOWN : !operand;
          }
          case "and":
          case "or": {
            const left = truth(value(node.left));
            const right = truth(value(node.right));
            const decisive = node.type === "and" ? false : true;
            if (left === decisive || right === decisive) return decisive;
            return left === UNKNOWN || right === UNKNOWN ? UNKNOWN : !decisive;
          }
        }
      };
      const result = truth(value(condition));
      memo.set(id, result);
      return result;
    };
    return run;
  };

  const running = new Map(jobs.map(({ id }) => [id, new Set<string>()]));
  for (const scenario of scenarios) {
    const run = runs(scenario);
    for (const { id } of jobs) {
      if (run(id) !== false) running.get(id)?.add(nameOf(scenario));
    }
  }
  return new Map(
    [...running].map(([id, names]) => [
      id,
      names.size === scenarios.length
        ? "always"
        : names.size === 0
          ? "never"
          : [...names].sort(byCodePoint).join(", "),
    ]),
  );
}
