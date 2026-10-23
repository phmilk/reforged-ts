// Go to definition on a Rawcode literal: the declaration of each object's
// constant, resolved as the project resolves an import of its module, else
// the object's FourCC overload; then, for an object an Object definition
// defines, the definition's Rawcode literal in its file, else its start.

import path from "node:path";
import type * as ts from "typescript";
import { OBJECTS_DECLARATIONS_FILE } from "../index.js";
import type { RawcodeConstant, RawcodeLookupResult } from "../lookup.js";
import { isGlobalFourCCDeclaration } from "./literal.js";

/**
 * The definitions of the objects a lookup result names, in its order: each
 * object's constant, else its `FourCC` overload, then its Object
 * definition when one defines it; empty for a result that names no object,
 * or whose objects have none of these.
 */
export function rawcodeDefinitions(
  typescript: typeof ts,
  program: ts.Program,
  containingFile: string,
  result: RawcodeLookupResult,
): ts.DefinitionInfo[] {
  if (result.status !== "known" && result.status !== "not-in-game-data-set") {
    return [];
  }
  const overloads = fourCCOverloads(typescript, program);
  const definitions: ts.DefinitionInfo[] = [];
  for (const object of result.objects) {
    const constant =
      object.constant === undefined
        ? undefined
        : constantDefinition(
            typescript,
            program,
            containingFile,
            object.constant,
            overloads,
          );
    if (constant !== undefined) {
      definitions.push(constant);
    } else {
      const overload = overloads.find(
        (declaration) =>
          overloadRawcode(typescript, declaration) === object.rawcode,
      );
      if (overload?.name !== undefined) {
        definitions.push({
          fileName: overload.getSourceFile().fileName,
          textSpan: spanOf(overload.name),
          kind: typescript.ScriptElementKind.functionElement,
          name: "FourCC",
          containerKind: typescript.ScriptElementKind.unknown,
          containerName: "",
        });
      }
    }
    if (object.origin !== "builtin" && object.definitionFile !== undefined) {
      const definition = objectDefinition(
        typescript,
        program,
        object.definitionFile,
        object.kind,
        object.rawcode,
      );
      if (definition !== undefined) definitions.push(definition);
    }
  }
  return definitions;
}

/**
 * The Object definition of an object, in the file that defines it: its
 * Rawcode literal when the file holds one, else the file's start; undefined
 * when the file cannot be read.
 */
function objectDefinition(
  typescript: typeof ts,
  program: ts.Program,
  file: string,
  kind: string,
  rawcode: string,
): ts.DefinitionInfo | undefined {
  const fileName = file.split(path.sep).join("/");
  const sourceFile =
    program.getSourceFile(fileName) ?? parse(typescript, fileName);
  if (sourceFile === undefined) return undefined;
  const literal = rawcodeLiteralIn(typescript, sourceFile, kind, rawcode);
  return {
    fileName: sourceFile.fileName,
    textSpan: literal === undefined ? { start: 0, length: 0 } : spanOf(literal),
    kind: typescript.ScriptElementKind.string,
    name: rawcode,
    containerKind: typescript.ScriptElementKind.moduleElement,
    containerName: path.basename(fileName),
  };
}

/**
 * The literal of a Rawcode in a definition file, the first of the best
 * place: the `rawcode` of the define function of its Object kind
 * (`defineUnit({ rawcode: "h002" })`), else any `rawcode` property, else any
 * string or template literal without substitutions holding it.
 */
function rawcodeLiteralIn(
  typescript: typeof ts,
  sourceFile: ts.SourceFile,
  kind: string,
  rawcode: string,
): ts.Node | undefined {
  const defineName = `define${kind.charAt(0).toUpperCase()}${kind.slice(1)}`;
  let best: { node: ts.Node; score: number } | undefined;
  const score = (literal: ts.Node): number => {
    const property = literal.parent;
    if (
      !typescript.isPropertyAssignment(property) ||
      property.initializer !== literal ||
      propertyName(typescript, property.name) !== "rawcode"
    ) {
      return 0;
    }
    const call = property.parent.parent;
    if (!typescript.isCallExpression(call)) return 1;
    const callee = call.expression;
    const name = typescript.isIdentifier(callee)
      ? callee.text
      : typescript.isPropertyAccessExpression(callee)
        ? callee.name.text
        : undefined;
    return name === defineName ? 2 : 1;
  };
  const visit = (node: ts.Node): void => {
    if (
      (typescript.isStringLiteral(node) ||
        typescript.isNoSubstitutionTemplateLiteral(node)) &&
      node.text === rawcode
    ) {
      const found = score(node);
      if (best === undefined || found > best.score) {
        best = { node, score: found };
      }
    }
    typescript.forEachChild(node, visit);
  };
  visit(sourceFile);
  return best?.node;
}

/** The text of a property's name, when it is an identifier or a string. */
function propertyName(
  typescript: typeof ts,
  name: ts.PropertyName,
): string | undefined {
  return typescript.isIdentifier(name) || typescript.isStringLiteral(name)
    ? name.text
    : undefined;
}

/** The declarations of the global `FourCC` in the program's declaration files. */
function fourCCOverloads(
  typescript: typeof ts,
  program: ts.Program,
): ts.FunctionDeclaration[] {
  return program
    .getSourceFiles()
    .filter((file) => file.isDeclarationFile)
    .flatMap((file) =>
      file.statements.filter((statement) =>
        isGlobalFourCCDeclaration(typescript, statement),
      ),
    );
}

/** The Rawcode of an overload whose parameter is a string literal type, `FourCC(id: "h000")`. */
function overloadRawcode(
  typescript: typeof ts,
  declaration: ts.FunctionDeclaration,
): string | undefined {
  const type = declaration.parameters.at(0)?.type;
  return type !== undefined &&
    typescript.isLiteralTypeNode(type) &&
    typescript.isStringLiteral(type.literal)
    ? type.literal.text
    : undefined;
}

function constantDefinition(
  typescript: typeof ts,
  program: ts.Program,
  containingFile: string,
  constant: RawcodeConstant,
  overloads: readonly ts.FunctionDeclaration[],
): ts.DefinitionInfo | undefined {
  const fileName = constant.generated
    ? generatedModule(program, constant.module, overloads)
    : typescript.resolveModuleName(
        constant.module,
        containingFile,
        program.getCompilerOptions(),
        typescript.sys,
      ).resolvedModule?.resolvedFileName;
  if (fileName === undefined) return undefined;
  const sourceFile =
    program.getSourceFile(fileName) ?? parse(typescript, fileName);
  const member =
    sourceFile === undefined
      ? undefined
      : constantMember(typescript, sourceFile, constant);
  if (member === undefined) return undefined;
  return {
    fileName: member.getSourceFile().fileName,
    textSpan: spanOf(member),
    kind: typescript.ScriptElementKind.memberVariableElement,
    name: constant.member,
    containerKind: typescript.ScriptElementKind.constElement,
    containerName: constant.object,
  };
}

/**
 * The file of a generated constants module (`custom-units.ts`): the
 * program's file of that name, else the one beside the generated overloads
 * (`map-objects.d.ts`), which the build writes to the same folder.
 */
function generatedModule(
  program: ts.Program,
  name: string,
  overloads: readonly ts.FunctionDeclaration[],
): string | undefined {
  const inProgram = program
    .getSourceFiles()
    .find((file) => path.basename(file.fileName) === name);
  if (inProgram !== undefined) return inProgram.fileName;
  const declarations = overloads
    .map((overload) => overload.getSourceFile().fileName)
    .find((fileName) => path.basename(fileName) === OBJECTS_DECLARATIONS_FILE);
  return declarations === undefined
    ? undefined
    : path.join(path.dirname(declarations), name).split(path.sep).join("/");
}

function parse(
  typescript: typeof ts,
  fileName: string,
): ts.SourceFile | undefined {
  const text = typescript.sys.readFile(fileName);
  return text === undefined
    ? undefined
    : typescript.createSourceFile(
        fileName,
        text,
        typescript.ScriptTarget.Latest,
        true,
      );
}

/**
 * The name of a constant's member in its module: a property of the type of
 * `export declare const Units: { … }`, or of the object literal of
 * `export const CustomUnits = { … } as const`.
 */
function constantMember(
  typescript: typeof ts,
  sourceFile: ts.SourceFile,
  constant: RawcodeConstant,
): ts.Node | undefined {
  for (const statement of sourceFile.statements) {
    if (!typescript.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        !typescript.isIdentifier(declaration.name) ||
        declaration.name.text !== constant.object
      ) {
        continue;
      }
      const members =
        declaration.type !== undefined &&
        typescript.isTypeLiteralNode(declaration.type)
          ? declaration.type.members
          : objectLiteral(typescript, declaration.initializer)?.properties;
      const member = members?.find(
        (candidate) =>
          candidate.name !== undefined &&
          (typescript.isIdentifier(candidate.name) ||
            typescript.isStringLiteral(candidate.name)) &&
          candidate.name.text === constant.member,
      );
      if (member?.name !== undefined) return member.name;
    }
  }
  return undefined;
}

/** The object literal of an initializer, through `as const`, `satisfies` and parentheses. */
function objectLiteral(
  typescript: typeof ts,
  node: ts.Expression | undefined,
): ts.ObjectLiteralExpression | undefined {
  let expression = node;
  while (
    expression !== undefined &&
    (typescript.isAsExpression(expression) ||
      typescript.isSatisfiesExpression(expression) ||
      typescript.isParenthesizedExpression(expression))
  ) {
    expression = expression.expression;
  }
  return expression !== undefined &&
    typescript.isObjectLiteralExpression(expression)
    ? expression
    : undefined;
}

function spanOf(node: ts.Node): ts.TextSpan {
  const start = node.getStart(node.getSourceFile());
  return { start, length: node.end - start };
}
