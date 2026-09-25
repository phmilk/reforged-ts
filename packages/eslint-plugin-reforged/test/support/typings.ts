// The Typings as installed for the fixture project: every Native (a function
// declared in reforged-types) by name, read from the TypeScript program of
// the fixture's tsconfig. For the consistency tests of the data files: every
// Native a data file names must resolve here.
import * as ts from "typescript";

import { packageNameOf } from "../../src/classify/package.js";
import { fixtureFile } from "./fixture-project.js";

let natives: ReadonlyMap<string, ts.FunctionDeclaration> | undefined;
let program: ts.Program | undefined;

/** The fixture project's TypeScript program (built once), for a checker over the Typings. */
export function fixtureProgram(): ts.Program {
  program ??= loadProgram();
  return program;
}

function loadProgram(): ts.Program {
  const parsed = ts.getParsedCommandLineOfConfigFile(
    fixtureFile("tsconfig.json"),
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        );
      },
    },
  );
  if (parsed === undefined) {
    throw new Error("the fixture project's tsconfig.json did not parse");
  }
  return ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
  });
}

/** Every Native of the installed Typings, by name (read once). */
export function installedNatives(): ReadonlyMap<
  string,
  ts.FunctionDeclaration
> {
  if (natives === undefined) {
    const found = new Map<string, ts.FunctionDeclaration>();
    for (const sourceFile of fixtureProgram().getSourceFiles()) {
      if (packageNameOf(sourceFile.fileName) !== "reforged-types") {
        continue;
      }
      for (const statement of sourceFile.statements) {
        if (
          ts.isFunctionDeclaration(statement) &&
          statement.name !== undefined
        ) {
          found.set(statement.name.text, statement);
        }
      }
    }
    natives = found;
  }
  return natives;
}
