// Go to definition on a Rawcode literal: the declaration of each object's
// constant, resolved as the project resolves an import of its module, else
// the object's FourCC overload.

import path from "node:path";
import type * as ts from "typescript";
import { OBJECTS_DECLARATIONS_FILE } from "../index.js";
import type { RawcodeConstant, RawcodeLookupResult } from "../lookup.js";
import { isGlobalFourCCDeclaration } from "./literal.js";

/**
 * The definitions of the objects a lookup result names, in its order: each
 * object's constant, else its `FourCC` overload; empty for a result that
 * names no object, or whose objects have neither.
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
      continue;
    }
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
  return definitions;
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
