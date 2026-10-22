/**
 * The expressions of a workflow's `if` (GitHub Actions' expression syntax):
 * parsed, printed back, and reduced by the facts a caller knows, so that
 * what the facts do not decide is left as an expression of its own.
 */

/** An `if` expression, parsed. A function's name is in lower case. */
export type Expression =
  | { type: "and" | "or"; left: Expression; right: Expression }
  | { type: "not"; operand: Expression }
  | { type: "compare"; op: string; left: Expression; right: Expression }
  | { type: "call"; name: string; args: Expression[] }
  | { type: "string"; value: string }
  | { type: "literal"; value: boolean | number | null }
  | { type: "property"; path: string };

/** A context property (`github.repository`) or a function call. */
export type Fact = Extract<Expression, { type: "property" | "call" }>;

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

const COMPARISONS = ["==", "!=", "<", ">", "<=", ">="];

/** Parses the expression of an `if`. Throws on one it cannot read. */
export function parseExpression(text: string): Expression {
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
    if (peek() !== "!") return comparison();
    take();
    return { type: "not", operand: unary() };
  };
  const comparison = (): Expression => {
    const left = primary();
    const op = peek();
    if (op === undefined || !COMPARISONS.includes(op)) return left;
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

/** `expression` and every expression inside it, outermost first. */
export function* walk(expression: Expression): Generator<Expression> {
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

const PRECEDENCE = { or: 1, and: 2, not: 3, compare: 4 } as const;

const precedence = (expression: Expression): number =>
  expression.type in PRECEDENCE
    ? PRECEDENCE[expression.type as keyof typeof PRECEDENCE]
    : 5;

/**
 * `expression` written back in the syntax of an `if`, with the parentheses
 * its structure needs and no others. A function's name is in lower case.
 */
export function printExpression(expression: Expression): string {
  const inner = (operand: Expression, least: number) =>
    precedence(operand) < least
      ? `(${printExpression(operand)})`
      : printExpression(operand);
  switch (expression.type) {
    case "and":
    case "or": {
      const op = expression.type === "and" ? "&&" : "||";
      const level = PRECEDENCE[expression.type];
      return `${inner(expression.left, level)} ${op} ${inner(expression.right, level)}`;
    }
    case "not":
      return `!${inner(expression.operand, PRECEDENCE.not)}`;
    case "compare":
      return `${inner(expression.left, 5)} ${expression.op} ${inner(expression.right, 5)}`;
    case "call":
      return `${expression.name}(${expression.args.map(printExpression).join(", ")})`;
    case "string":
      return `'${expression.value.replaceAll("'", "''")}'`;
    case "literal":
      return String(expression.value);
    case "property":
      return expression.path;
  }
}

/**
 * A value no condition names: equal to none of the values a condition
 * compares with, and truthy (the mode `none` of the release, which no job's
 * condition names).
 */
export const OTHER = Symbol("other");

/** A value an expression may hold. */
export type Value =
  string | number | boolean | null | typeof OTHER | readonly Value[];

/** What `facts` tell of a property or a call; undefined when unknown. */
export type Facts = (fact: Fact) => Value | undefined;

/**
 * An expression reduced by facts: its value when they decide it, else the
 * residue, the part they leave undecided.
 */
export type Reduced = { value: Value } | { residue: Expression };

const isList = (value: Value): value is readonly Value[] =>
  Array.isArray(value);

/** Whether `value` passes an `if`. */
export function truthy(value: Value): boolean {
  if (value === OTHER || isList(value)) return true;
  if (typeof value === "string") return value !== "";
  if (typeof value === "number") return value !== 0;
  return value === true;
}

/** `left op right` when the values decide it; never an order. */
function compareValues(
  op: string,
  left: Value,
  right: Value,
): boolean | undefined {
  if (op !== "==" && op !== "!=") return undefined;
  if (isList(left) || isList(right)) return undefined;
  if (left === OTHER && right === OTHER) return undefined;
  const normal = (value: Value) =>
    typeof value === "string" ? value.toLowerCase() : value;
  const equal = normal(left) === normal(right);
  return op === "==" ? equal : !equal;
}

/** The functions whose value their arguments decide, by lower-case name. */
const FUNCTIONS = new Map<
  string,
  (args: readonly Value[]) => Value | undefined
>([
  [
    "contains",
    (args) => {
      if (args.length !== 2) return undefined;
      const [search, item] = args as [Value, Value];
      if (isList(search)) {
        return search.some(
          (entry) => compareValues("==", entry, item) === true,
        );
      }
      return typeof search === "string" && typeof item === "string"
        ? search.toLowerCase().includes(item.toLowerCase())
        : undefined;
    },
  ],
  [
    "fromjson",
    (args) => {
      const [text] = args;
      if (typeof text !== "string") return undefined;
      try {
        return JSON.parse(text) as Value;
      } catch {
        return undefined;
      }
    },
  ],
]);

const known = (reduced: Reduced): reduced is { value: Value } =>
  "value" in reduced;

/**
 * `expression` reduced by `facts`: each property and call they know is put
 * in, and each comparison, negation, `&&`, `||`, `contains` and `fromJSON`
 * whose operands are known is worked out. What is left is the residue, with
 * the known operands of an `&&` or `||` taken out.
 */
export function reduce(expression: Expression, facts: Facts): Reduced {
  switch (expression.type) {
    case "string":
    case "literal":
      return { value: expression.value };
    case "property": {
      const value = facts(expression);
      return value === undefined ? { residue: expression } : { value };
    }
    case "call": {
      const args = expression.args.map((arg) => reduce(arg, facts));
      const evaluate = FUNCTIONS.get(expression.name);
      const value =
        evaluate !== undefined && args.every(known)
          ? evaluate(args.map(({ value: arg }) => arg))
          : facts(expression);
      return value === undefined ? { residue: expression } : { value };
    }
    case "compare": {
      const left = reduce(expression.left, facts);
      const right = reduce(expression.right, facts);
      const value =
        known(left) && known(right)
          ? compareValues(expression.op, left.value, right.value)
          : undefined;
      return value === undefined ? { residue: expression } : { value };
    }
    case "not": {
      const operand = reduce(expression.operand, facts);
      return known(operand)
        ? { value: !truthy(operand.value) }
        : { residue: { type: "not", operand: operand.residue } };
    }
    case "and":
    case "or": {
      const decisive = expression.type === "or";
      const sides = [expression.left, expression.right].map((side) =>
        reduce(side, facts),
      );
      if (
        sides.some((side) => known(side) && truthy(side.value) === decisive)
      ) {
        return { value: decisive };
      }
      const residues = sides.flatMap((side) =>
        known(side) ? [] : [side.residue],
      );
      if (residues.length === 0) return { value: !decisive };
      const [left, right] = residues as [Expression, Expression?];
      return right === undefined
        ? { residue: left }
        : { residue: { type: expression.type, left, right } };
    }
  }
}
