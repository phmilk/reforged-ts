// The explicit timeouts of the workspace's vitest tests, and whether each
// says what was measured. An explicit timeout is a test's or a hook's own
// (the numeric argument of `it`, `test`, `describe` or a hook, or the
// `timeout` of its options) or a project's (`testTimeout` or `hookTimeout`
// of a vitest configuration). CONTRIBUTING.md, "Slow tests and explicit
// timeouts", states the rule: the comment right above it gives the measured
// duration, the command and the platform.
import {
  createSourceFile,
  forEachChild,
  isCallExpression,
  isElementAccessExpression,
  isIdentifier,
  isNumericLiteral,
  isObjectLiteralExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isVariableDeclaration,
  ScriptTarget,
  type Expression,
  type Node,
  type SourceFile,
} from "typescript";

/** The functions of vitest whose argument can be a test or hook timeout. */
const TIMED = new Set([
  "it",
  "test",
  "describe",
  "suite",
  "beforeAll",
  "beforeEach",
  "afterAll",
  "afterEach",
]);

/** The configuration options that set every test's or hook's timeout. */
const CONFIG_OPTIONS = new Set(["testTimeout", "hookTimeout"]);

/**
 * The sentence a measured timeout's comment holds, in this order: the
 * measured duration with its unit, the command (`with ...`) and the
 * platform (`on ...`), e.g. `Measured 12 s with pnpm test on the windows CI
 * leg, 2026-10.`
 */
export const MEASURED =
  /\bMeasured (?:at most |up to |about |under )?\d[\d.,]*\s?(?:ms|s|min)\b.*?\bwith\s\S.*?\bon\s\S/is;

/** One explicit timeout: where it is, and the comment right above it. */
export interface Timeout {
  /** The 1-based line of the timeout's value. */
  line: number;
  /** The timeout as written, `60_000` or `testTimeout: 30_000`. */
  text: string;
  /** The comment lines right above it, or above its call, joined. */
  comment: string;
}

// The function a call ends up calling, by name: `it` for `it(...)`,
// `it.skip(...)`, `it.each(rows)(...)` and `it["concurrent"](...)`.
function calleeName(callee: Expression): string | undefined {
  let current: Expression = callee;
  for (;;) {
    if (isIdentifier(current)) return current.text;
    if (isPropertyAccessExpression(current)) current = current.expression;
    else if (isElementAccessExpression(current)) current = current.expression;
    else if (isCallExpression(current)) current = current.expression;
    else return undefined;
  }
}

// The top-level `const NAME = ...` initialisers of a file, by name: a test
// may pass its options or its timeout through one.
function constants(file: SourceFile): Map<string, Expression> {
  const found = new Map<string, Expression>();
  const visit = (node: Node): void => {
    if (
      isVariableDeclaration(node) &&
      isIdentifier(node.name) &&
      node.initializer
    ) {
      found.set(node.name.text, node.initializer);
    }
    forEachChild(node, visit);
  };
  visit(file);
  return found;
}

// The `//` comment lines right above `line` (0-based), up to the first line
// that is not one, joined with spaces.
function commentAbove(lines: readonly string[], line: number): string {
  const block: string[] = [];
  for (let index = line - 1; index >= 0; index--) {
    const text = (lines[index] ?? "").trim();
    if (!text.startsWith("//")) break;
    block.unshift(text.replace(/^\/\/\s?/, ""));
  }
  return block.join(" ");
}

/** Every explicit timeout of the TypeScript source `text`. */
export function explicitTimeouts(path: string, text: string): Timeout[] {
  const file = createSourceFile(path, text, ScriptTarget.Latest, true);
  const lines = text.split(/\r?\n/);
  const named = constants(file);
  const found = new Map<Node, Timeout>();

  const lineOf = (node: Node): number =>
    file.getLineAndCharacterOfPosition(node.getStart(file)).line;

  // A timeout's comment is the block right above its own line or, for one
  // written after the test body, right above the line its call starts on.
  const add = (value: Node, owner: Node): void => {
    const own = commentAbove(lines, lineOf(value));
    const call = commentAbove(lines, lineOf(owner));
    // A constant used by several tests is one timeout.
    if (found.has(value)) return;
    found.set(value, {
      line: lineOf(value) + 1,
      text: value.getText(file),
      comment: MEASURED.test(own) ? own : call || own,
    });
  };

  // The timeout an argument of a call sets: a number, or an options
  // object's `timeout`.
  const timeoutOf = (argument: Expression): Node | undefined => {
    if (isNumericLiteral(argument)) return argument;
    if (isObjectLiteralExpression(argument)) {
      return argument.properties.find(
        (property) =>
          isPropertyAssignment(property) &&
          property.name.getText(file) === "timeout",
      );
    }
    return undefined;
  };

  const visit = (node: Node): void => {
    if (isCallExpression(node)) {
      const name = calleeName(node.expression);
      if (name !== undefined && TIMED.has(name)) {
        for (const argument of node.arguments) {
          const direct = timeoutOf(argument);
          if (direct) {
            add(direct, node);
            continue;
          }
          // A constant passed as the timeout or the options: the timeout
          // and its comment are where the constant is declared.
          const constant = isIdentifier(argument)
            ? named.get(argument.text)
            : undefined;
          const declared = constant && timeoutOf(constant);
          if (declared) add(declared, declared);
        }
      }
    }
    if (
      isPropertyAssignment(node) &&
      CONFIG_OPTIONS.has(node.name.getText(file))
    ) {
      add(node, node);
    }
    forEachChild(node, visit);
  };
  visit(file);

  return [...found.values()];
}

/** The explicit timeouts of `text` whose comment gives no measurement. */
export function unmeasuredTimeouts(path: string, text: string): Timeout[] {
  return explicitTimeouts(path, text).filter(
    ({ comment }) => !MEASURED.test(comment),
  );
}
