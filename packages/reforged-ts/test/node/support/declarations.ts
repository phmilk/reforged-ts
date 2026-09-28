// A throwaway Map project that consumes the library as an installed
// dependency: the declarations are emitted from the sources with the
// workspace TypeScript into node_modules/reforged-ts/dist next to the
// package's own package.json, their `{@includeCode}` expanded as the build
// expands them, and the Typings, lua-types and the typescript-to-lua language
// extensions are linked in from this package's installation. The declaration
// fixtures are copied to its src/.

import { readdirSync } from "node:fs";
import {
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  readdir,
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
import {
  declarationResolver,
  type DeclarationResolver,
} from "../../../../../release/src/rename-map";
import { expandDeclarations } from "../../../scripts/include-code.mts";
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
  await emitDeclarations(join(installed, "dist"));
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
 * Emits the library's declarations, as `pnpm build` does, into `outDir`,
 * and expands their includes; throws with the diagnostics when the library
 * does not compile, and on an include that cannot be expanded.
 */
async function emitDeclarations(outDir: string): Promise<void> {
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
  await expandDeclarations(outDir, join(packageRoot, "src"));
}

/**
 * The Map project's installed declaration files, as `dist/handles/unit.d.ts`,
 * sorted, with their text.
 */
export async function installedDeclarations(
  project: MapProject,
): Promise<Map<string, string>> {
  const installed = join(project.dir, "node_modules", "reforged-ts");
  const files = (await readdir(join(installed, "dist"), { recursive: true }))
    .map((file) => `dist/${file.split("\\").join("/")}`)
    .filter((file) => file.endsWith(".d.ts"))
    .sort();
  return new Map(
    await Promise.all(
      files.map(
        async (file) =>
          [file, await readFile(join(installed, file), "utf8")] as const,
      ),
    ),
  );
}

/**
 * The `@example` tags of a class member in one of the Map project's
 * installed declaration files, as the editor's hover reads them.
 */
export async function hoverExamples(
  project: MapProject,
  file: string,
  className: string,
  member: string,
): Promise<string[]> {
  const path = join(project.dir, "node_modules", "reforged-ts", file);
  const source = ts.createSourceFile(
    path,
    await readFile(path, "utf8"),
    ts.ScriptTarget.ESNext,
    true,
  );
  const declaration = source.statements
    .filter(ts.isClassDeclaration)
    .find((node) => node.name?.text === className)
    ?.members.find((node) => node.name?.getText(source) === member);
  if (declaration === undefined) {
    throw new Error(`${file} declares no ${className}.${member}`);
  }
  return ts
    .getJSDocTags(declaration)
    .filter((tag) => tag.tagName.text === "example")
    .map((tag) => ts.getTextOfJSDocComment(tag.comment) ?? "");
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

/**
 * The public API the Map project reads from the library's entry file,
 * resolved with the Map project's compiler options.
 */
export function publicApi(project: MapProject): DeclarationResolver {
  const config = parseConfig(project.tsconfig, { noEmit: true });
  const entry = join(
    project.dir,
    "node_modules",
    "reforged-ts",
    "dist",
    "index.d.ts",
  );
  return declarationResolver(entry, config.options);
}
