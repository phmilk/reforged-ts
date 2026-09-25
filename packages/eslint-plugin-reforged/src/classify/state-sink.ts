// The state-sink classification: where a value becomes game state, for
// `no-async-value-as-state`. An expression reaches a state sink when its
// value, directly or through one `const`, is:
// - an argument of a call (or `new`) that data/local-safe.json lists
//   neither as text nor as visual (a pure entry passes the value on, see
//   below), or the value assigned to a reforged-ts accessor that is not
//   listed (a call to its setter, decision 4 of the #50 run);
// - assigned to a module-level or exported variable (an assignment or the
//   declaration's initialiser);
// - a table key: `t[value]`, read or written, or `{ [value]: ... }`.
// The sync System is the way out, not a sink: an argument of
// `new SyncRequest(...)` or of `request.start(...)` (reforged-ts) is shared
// with every client by it.
// The value flows through type assertions, `!`, optional chains, template
// literals, operators (arithmetic, comparison, logical, unary other than
// `void`/`delete`), the branches of a conditional, a spread argument,
// `String()`/`tostring()`, the functions of the global `Math` and the `pure`
// Natives of the allowlist (`R2I`, `SquareRoot`, `SubString`: local
// computation, whose result carries the value on). A call the caller names
// in `isSourceCall` (a call whose own value is checked as a source) is not a
// sink. It stops at anything else: a local `let`, a return, an object
// property, the receiver of a member access, a call's callee, the test of a
// conditional.
import {
  AST_NODE_TYPES,
  ASTUtils,
  ESLintUtils,
  type ParserServicesWithTypeInformation,
  TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

import { type Allowlist, invokedName } from "./allowlist.js";
import { libraryClassOf } from "./library-class.js";
import {
  type FlowStep,
  isStringConversion,
  type SinkRuleContext,
  through,
  type ValueDeclarator,
  walkValueFlow,
} from "./value-flow.js";

export type StateSinkKind = "argument" | "variable" | "key";

/** The state sink an expression reaches. */
export interface StateSinkHit {
  readonly kind: StateSinkKind;
  /** The call, assignment, declarator or member expression that is the sink. */
  readonly node: TSESTree.Node;
  /**
   * The sink as the message names it: the callee's text (`SetUnitX`,
   * `new Foo`) or the setter (`Frame#value`) for an argument; the variable
   * for a variable; the table's text for a key.
   */
  readonly name: string;
}

/** A call the walk does not treat as a sink (`isSourceCall` above). */
export type SourceCallTest = (call: TSESTree.CallExpression) => boolean;

const reforgedTs: ReadonlySet<string> = new Set(["reforged-ts"]);

/** `new SyncRequest(...)`, the sync System of reforged-ts. */
function isSyncRequest(
  services: ParserServicesWithTypeInformation,
  expression: TSESTree.NewExpression,
): boolean {
  return (
    expression.callee.type === AST_NODE_TYPES.Identifier &&
    expression.callee.name === "SyncRequest" &&
    libraryClassOf(services, expression.callee, reforgedTs) === "SyncRequest"
  );
}

/** `request.start(data)` on a SyncRequest of reforged-ts. */
function isSyncStart(
  services: ParserServicesWithTypeInformation,
  call: TSESTree.CallExpression,
): boolean {
  return (
    call.callee.type === AST_NODE_TYPES.MemberExpression &&
    !call.callee.computed &&
    call.callee.property.type === AST_NODE_TYPES.Identifier &&
    call.callee.property.name === "start" &&
    invokedName(services, call) === "SyncRequest#start"
  );
}

/** `Math.floor(x)` and the others, on the global `Math` of the default library. */
function isMathCall(
  services: ParserServicesWithTypeInformation,
  call: TSESTree.CallExpression,
): boolean {
  const { callee } = call;
  if (
    callee.type !== AST_NODE_TYPES.MemberExpression ||
    callee.object.type !== AST_NODE_TYPES.Identifier ||
    callee.object.name !== "Math"
  ) {
    return false;
  }
  const symbol = services.program
    .getTypeChecker()
    .getSymbolAtLocation(services.esTreeNodeToTSNodeMap.get(callee.object));
  return (symbol?.declarations ?? []).some((declaration) =>
    services.program.isSourceFileDefaultLibrary(declaration.getSourceFile()),
  );
}

function isModuleLevel(variable: TSESLint.Scope.Variable): boolean {
  const { ScopeType } = TSESLint.Scope;
  return (
    variable.scope.type === ScopeType.module ||
    variable.scope.type === ScopeType.global
  );
}

function isExported(declarator: TSESTree.VariableDeclarator): boolean {
  return (
    declarator.parent.parent.type === AST_NODE_TYPES.ExportNamedDeclaration
  );
}

/** One state-sink walk: what `step` needs besides the nodes. */
interface StateWalk {
  readonly sourceCode: SinkRuleContext["sourceCode"];
  readonly services: ParserServicesWithTypeInformation;
  readonly allowlist: Allowlist;
  readonly isSourceCall: SourceCallTest;
}

function step(
  walk: StateWalk,
  parent: TSESTree.Node,
  child: TSESTree.Node,
): FlowStep<StateSinkHit> {
  const { sourceCode, services, allowlist, isSourceCall } = walk;
  switch (parent.type) {
    case AST_NODE_TYPES.TSAsExpression:
    case AST_NODE_TYPES.TSSatisfiesExpression:
    case AST_NODE_TYPES.TSNonNullExpression:
    case AST_NODE_TYPES.TSTypeAssertion:
    case AST_NODE_TYPES.ChainExpression:
    case AST_NODE_TYPES.TemplateLiteral:
    case AST_NODE_TYPES.BinaryExpression:
    case AST_NODE_TYPES.LogicalExpression:
    case AST_NODE_TYPES.SpreadElement:
      return through;
    case AST_NODE_TYPES.UnaryExpression:
      return parent.operator === "void" || parent.operator === "delete"
        ? undefined
        : through;
    case AST_NODE_TYPES.ConditionalExpression:
      return parent.test === child ? undefined : through;
    case AST_NODE_TYPES.CallExpression: {
      if (parent.callee === child) {
        return undefined;
      }
      if (
        isStringConversion(services, parent) ||
        isMathCall(services, parent)
      ) {
        return through;
      }
      if (isSourceCall(parent) || isSyncStart(services, parent)) {
        return undefined;
      }
      const kind = allowlist.kindOf(services, parent);
      if (kind === "pure") {
        return through;
      }
      return kind === undefined
        ? {
            kind: "argument",
            node: parent,
            name: sourceCode.getText(parent.callee),
          }
        : undefined;
    }
    case AST_NODE_TYPES.NewExpression:
      return parent.callee === child || isSyncRequest(services, parent)
        ? undefined
        : {
            kind: "argument",
            node: parent,
            name: `new ${sourceCode.getText(parent.callee)}`,
          };
    case AST_NODE_TYPES.AssignmentExpression: {
      if (parent.right !== child) {
        return undefined;
      }
      if (parent.left.type === AST_NODE_TYPES.Identifier) {
        const variable = ASTUtils.findVariable(
          sourceCode.getScope(parent),
          parent.left,
        );
        return variable !== null && isModuleLevel(variable)
          ? { kind: "variable", node: parent, name: variable.name }
          : undefined;
      }
      if (allowlist.entryOf(services, parent) !== undefined) {
        return undefined;
      }
      const setter = invokedName(services, parent);
      return setter === undefined
        ? undefined
        : { kind: "argument", node: parent, name: setter };
    }
    case AST_NODE_TYPES.MemberExpression:
      return parent.computed && parent.property === child
        ? {
            kind: "key",
            node: parent,
            name: sourceCode.getText(parent.object),
          }
        : undefined;
    case AST_NODE_TYPES.Property:
      return parent.computed && parent.key === child
        ? { kind: "key", node: parent, name: "an object literal" }
        : undefined;
    default:
      return undefined;
  }
}

/** A module-level or exported variable initialised with the value is a sink. */
function declared(
  declarator: ValueDeclarator,
  variable: TSESLint.Scope.Variable,
): StateSinkHit | undefined {
  return isModuleLevel(variable) || isExported(declarator)
    ? { kind: "variable", node: declarator, name: variable.name }
    : undefined;
}

/**
 * The state sink `expression` reaches (see the rules above), or undefined.
 * Through a const read several times, the first read in source order that
 * reaches one wins. Asks the checker only for the allowlist entries and
 * setters of the calls and assignments it meets, and for `String`/`tostring`.
 */
export function reachedStateSink(
  context: SinkRuleContext,
  allowlist: Allowlist,
  expression: TSESTree.Node,
  isSourceCall: SourceCallTest = () => false,
): StateSinkHit | undefined {
  const services = ESLintUtils.getParserServices(context);
  const walk: StateWalk = {
    sourceCode: context.sourceCode,
    services,
    allowlist,
    isSourceCall,
  };
  return walkValueFlow(
    {
      context,
      services,
      step: (parent, child) => step(walk, parent, child),
      declared,
    },
    expression,
  );
}
