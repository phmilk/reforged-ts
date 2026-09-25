// A throwaway Map project that consumes the library as an installed
// dependency: the declarations are emitted from the sources with the
// workspace TypeScript into node_modules/reforged-ts/dist next to the
// package's own package.json, and the Typings, lua-types and the
// typescript-to-lua language extensions are linked in from this package's
// installation. The declaration fixtures are copied to its src/.

import { readdirSync } from "node:fs";
import {
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as ts from "typescript";
import { packageRoot } from "./package-root";

const fixturesRoot = fileURLToPath(
  new URL("../fixtures/declarations/", import.meta.url),
);

/** The `types` entries of a Map project (the Template's). */
const MAP_PROJECT_TYPES = [
  "reforged-types/3.0.0",
  "@typescript-to-lua/language-extensions",
];

/** What the Map project installs besides the library, linked from here. */
const LINKED_PACKAGES = [
  "reforged-types",
  "lua-types",
  "@typescript-to-lua/language-extensions",
];

/** A trailing `// error TS2322 TS2345` comment on a negative fixture's line. */
const EXPECTATION = /\/\/\s*error((?:\s+TS\d+)+)\s*$/;

/** The fixtures of one kind, as `positive/unit-lookup.ts`, sorted. */
export function fixtureFiles(kind: "positive" | "negative"): string[] {
  return readdirSync(join(fixturesRoot, kind))
    .filter((name) => name.endsWith(".ts"))
    .sort()
    .map((name) => `${kind}/${name}`);
}

/** The errors a fixture states, as `line 7 TS2322`, in the order of `byFixture`. */
export async function expectedErrors(fixture: string): Promise<string[]> {
  const lines = (await readFile(join(fixturesRoot, fixture), "utf8")).split(
    /\r?\n/,
  );
  return lines
    .flatMap((text, index) => {
      const codes = EXPECTATION.exec(text)?.[1]?.trim().split(/\s+/) ?? [];
      return codes.map((code) => `line ${String(index + 1)} ${code}`);
    })
    .sort();
}

export interface MapProject {
  dir: string;
  tsconfig: string;
  dispose(): Promise<void>;
}

/** Creates the Map project in a fresh temporary folder. */
export async function createMapProject(): Promise<MapProject> {
  const dir = await realpath(
    await mkdtemp(join(tmpdir(), "reforged-ts-declarations-")),
  );
  const installed = join(dir, "node_modules", "reforged-ts");
  emitDeclarations(join(installed, "dist"));
  await copyFile(
    join(packageRoot, "package.json"),
    join(installed, "package.json"),
  );

  const require = createRequire(join(packageRoot, "package.json"));
  for (const name of LINKED_PACKAGES) {
    const target = dirname(require.resolve(`${name}/package.json`));
    const link = join(dir, "node_modules", ...name.split("/"));
    await mkdir(dirname(link), { recursive: true });
    await symlink(await realpath(target), link, "junction");
  }

  await cp(fixturesRoot, join(dir, "src"), {
    recursive: true,
    filter: (source) => basename(source) !== "tsconfig.json",
  });
  const tsconfig = join(dir, "tsconfig.json");
  const config = {
    compilerOptions: {
      target: "ESNext",
      lib: ["ESNext"],
      module: "ESNext",
      moduleResolution: "bundler",
      strict: true,
      rootDir: "src",
      outDir: "dist",
      types: MAP_PROJECT_TYPES,
    },
    include: ["src"],
    tstl: { luaTarget: "5.3", noHeader: true },
  };
  await writeFile(tsconfig, JSON.stringify(config, null, 2) + "\n");
  return {
    dir,
    tsconfig,
    dispose: () => rm(dir, { recursive: true, force: true }),
  };
}

/**
 * Emits the library's declarations, as `pnpm build` does, into `outDir`;
 * throws with the diagnostics when the library does not compile.
 */
function emitDeclarations(outDir: string): void {
  const config = parseConfig(join(packageRoot, "tsconfig.json"), {
    noEmit: false,
    declaration: true,
    emitDeclarationOnly: true,
    outDir,
  });
  const program = ts.createProgram({
    rootNames: config.fileNames,
    options: config.options,
  });
  const emitted = program.emit();
  const diagnostics = [
    ...config.errors,
    ...ts.getPreEmitDiagnostics(program),
    ...emitted.diagnostics,
  ];
  if (diagnostics.length > 0 || emitted.emitSkipped) {
    throw new Error(
      `The library's declarations were not emitted:\n${ts.formatDiagnostics(
        diagnostics,
        {
          getCanonicalFileName: (name) => name,
          getCurrentDirectory: () => packageRoot,
          getNewLine: () => "\n",
        },
      )}`,
    );
  }
}

export interface TypecheckResult {
  /** The files the program read the library from, relative to node_modules/reforged-ts. */
  library: string[];
  /** Diagnostics outside the fixtures, as `file:line TS1234 message`. */
  outside: string[];
  /** The diagnostics of one fixture, as `line 7 TS2322`, sorted. */
  byFixture(fixture: string): string[];
}

/** Type-checks the Map project as `tsc -p <tsconfig> --noEmit` does. */
export function typecheck(project: MapProject): TypecheckResult {
  const config = parseConfig(project.tsconfig, { noEmit: true });
  const program = ts.createProgram({
    rootNames: config.fileNames,
    options: config.options,
  });
  const byFile = new Map<string, string[]>();
  const outside: string[] = [];
  for (const diagnostic of [
    ...config.errors,
    ...ts.getPreEmitDiagnostics(program),
  ]) {
    const code = `TS${String(diagnostic.code)}`;
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      "\n",
    );
    if (diagnostic.file === undefined || diagnostic.start === undefined) {
      outside.push(`${code} ${message}`);
      continue;
    }
    const file = relative(project.dir, diagnostic.file.fileName)
      .split("\\")
      .join("/");
    const line = String(
      diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1,
    );
    if (file.startsWith("src/")) {
      const fixture = file.slice("src/".length);
      byFile.set(fixture, [
        ...(byFile.get(fixture) ?? []),
        `line ${line} ${code}`,
      ]);
    } else {
      outside.push(`${file}:${line} ${code} ${message}`);
    }
  }
  const installed = normalize(join(project.dir, "node_modules", "reforged-ts"));
  const library = program
    .getSourceFiles()
    .map((file) => normalize(file.fileName))
    .filter((name) => name.startsWith(installed + "/"))
    .map((name) => name.slice(installed.length + 1));
  return {
    library,
    outside,
    byFixture: (fixture) => [...(byFile.get(fixture) ?? [])].sort(),
  };
}

/** Absolute and slash-separated, on every platform. */
function normalize(path: string): string {
  return resolve(path).split("\\").join("/");
}

function parseConfig(
  tsconfig: string,
  overrides: ts.CompilerOptions,
): ts.ParsedCommandLine {
  const config = ts.getParsedCommandLineOfConfigFile(tsconfig, overrides, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      throw new Error(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      );
    },
  });
  if (config === undefined) {
    throw new Error(`${tsconfig} could not be read`);
  }
  return config;
}

export interface PublicApi {
  /**
   * Whether the library exports a symbol of that name and, when a member is
   * named, whether the export is a class with a public static or instance
   * member of that name (its own or inherited) or a value (`Init`,
   * `Reforged`) whose type has a public property of that name.
   */
  has(symbol: { className: string; member: string | undefined }): boolean;
}

/** The public API the Map project reads from the library's entry file. */
export function publicApi(project: MapProject): PublicApi {
  const config = parseConfig(project.tsconfig, { noEmit: true });
  const entry = join(
    project.dir,
    "node_modules",
    "reforged-ts",
    "dist",
    "index.d.ts",
  );
  const program = ts.createProgram({
    rootNames: [entry],
    options: config.options,
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entry);
  const entryModule =
    source === undefined ? undefined : checker.getSymbolAtLocation(source);
  if (entryModule === undefined) {
    throw new Error(`${entry} is not a module`);
  }
  const exported = new Map(
    checker
      .getExportsOfModule(entryModule)
      .map((symbol) => [
        symbol.name,
        symbol.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(symbol)
          : symbol,
      ]),
  );
  const isPublic = (member: ts.Symbol) =>
    (member.declarations ?? []).every(
      (declaration) =>
        (ts.getCombinedModifierFlags(declaration) &
          (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) ===
        0,
    );
  return {
    has({ className, member }) {
      const symbol = exported.get(className);
      if (symbol === undefined) return false;
      if (member === undefined) return true;
      const types: ts.Type[] = [];
      if (symbol.flags & ts.SymbolFlags.Class) {
        types.push(
          checker.getTypeOfSymbol(symbol),
          checker.getDeclaredTypeOfSymbol(symbol),
        );
      } else if (symbol.flags & ts.SymbolFlags.Variable) {
        types.push(checker.getTypeOfSymbol(symbol));
      } else {
        return false;
      }
      return types
        .map((type) => type.getProperty(member))
        .some((found) => found !== undefined && isPublic(found));
    },
  };
}
