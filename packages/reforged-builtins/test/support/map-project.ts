/**
 * A throwaway Map project that consumes reforged-builtins the way an
 * installed dependency is consumed: the package is packed with pnpm (so the
 * `files` list and the `exports` decide what ships and what resolves) and
 * unpacked into the project's node_modules. The workspace's reforged-types,
 * reforged-ts and the typescript-to-lua language extensions are linked in
 * from this package's installation; reforged-ts is read from its emitted
 * declarations (dist/), so `pnpm build` runs first.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
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
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import * as ts from "typescript";

export const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const fixturesRoot = join(packageRoot, "test", "fixtures", "map-project");

/** The Template's `types` with the package's overloads after the Typings. */
export const TYPES = [
  "reforged-types/3.0.0",
  "reforged-builtins/3.0.0",
  "@typescript-to-lua/language-extensions",
];
/** The same, the package's overloads first. */
export const TYPES_REVERSED = [
  "reforged-builtins/3.0.0",
  "reforged-types/3.0.0",
  "@typescript-to-lua/language-extensions",
];

/** What the Map project installs besides this package. */
const LINKED_PACKAGES = [
  "reforged-types",
  "reforged-ts",
  "@typescript-to-lua/language-extensions",
];

export interface Workspace {
  /** The temporary folder holding node_modules and the Map projects. */
  root: string;
  /** The unpacked package, as the Map project's node_modules holds it. */
  installed: string;
  dispose(): Promise<void>;
}

/** Packs this package and installs it into a fresh temporary folder. */
export async function createWorkspace(): Promise<Workspace> {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "reforged-builtins-map-")),
  );
  const tarball = execSync(`pnpm pack --json --pack-destination "${root}"`, {
    cwd: packageRoot,
    encoding: "utf8",
  });
  const installed = join(root, "node_modules", "reforged-builtins");
  await unpack(
    await readFile((JSON.parse(tarball) as { filename: string }).filename),
    installed,
  );

  const require = createRequire(join(packageRoot, "package.json"));
  for (const name of LINKED_PACKAGES) {
    const target = dirname(require.resolve(`${name}/package.json`));
    const link = join(root, "node_modules", ...name.split("/"));
    await mkdir(dirname(link), { recursive: true });
    await symlink(await realpath(target), link, "junction");
  }
  if (!existsSync(join(root, "node_modules", "reforged-ts", "dist"))) {
    throw new Error(
      "reforged-ts has no emitted declarations: run `pnpm build` first.",
    );
  }
  return {
    root,
    installed,
    dispose: () => rm(root, { recursive: true, force: true }),
  };
}

/** Writes the files of a gzipped npm tarball, minus the `package/` prefix, under `into`. */
async function unpack(tarball: Buffer, into: string): Promise<void> {
  const archive = gunzipSync(tarball);
  const field = (header: Buffer, start: number, length: number) =>
    header.toString("utf8", start, start + length).replace(/\0.*$/s, "");
  for (let offset = 0; offset + 512 <= archive.length;) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const prefix = field(header, 345, 155);
    const name = (prefix === "" ? "" : prefix + "/") + field(header, 0, 100);
    const size = parseInt(field(header, 124, 12).trim() || "0", 8);
    const type = field(header, 156, 1);
    offset += 512;
    if (type === "0" || type === "") {
      const path = join(into, ...name.replace(/^package\//, "").split("/"));
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, archive.subarray(offset, offset + size));
    } else if (type !== "5") {
      throw new Error(`unexpected tar entry type '${type}' for ${name}`);
    }
    offset += Math.ceil(size / 512) * 512;
  }
}

export interface MapProject {
  dir: string;
  tsconfig: string;
}

/**
 * A Map project in `workspace` named `name`: the fixture folder `fixture`
 * copied to `src/`, and a tsconfig.json in the shape of the Template's with
 * `types` and the `tstl` options given.
 */
export async function createMapProject(
  workspace: Workspace,
  name: string,
  fixture: string,
  types: string[],
  tstl: Record<string, unknown> = {},
): Promise<MapProject> {
  const dir = join(workspace.root, name);
  await cp(join(fixturesRoot, fixture), join(dir, "src"), { recursive: true });
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
      types,
    },
    include: ["src"],
    tstl: { luaTarget: "5.3", noHeader: true, ...tstl },
  };
  await writeFile(tsconfig, JSON.stringify(config, null, 2) + "\n");
  return { dir, tsconfig };
}

/** The program `tsc -p <tsconfig> --noEmit` builds, and its diagnostics. */
export function typecheck(project: MapProject): {
  program: ts.Program;
  diagnostics: ts.Diagnostic[];
} {
  const config = ts.getParsedCommandLineOfConfigFile(
    project.tsconfig,
    { noEmit: true },
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        );
      },
    },
  );
  if (config === undefined) {
    throw new Error(`${project.tsconfig} could not be read`);
  }
  const program = ts.createProgram({
    rootNames: config.fileNames,
    options: config.options,
  });
  return {
    program,
    diagnostics: [...config.errors, ...ts.getPreEmitDiagnostics(program)],
  };
}

/** `src/<file>:<line> TS<code>`, with `/` separators on every platform. */
export function locate(project: MapProject, diagnostic: ts.Diagnostic): string {
  const code = `TS${String(diagnostic.code)}`;
  if (diagnostic.file === undefined || diagnostic.start === undefined) {
    return `${code} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`;
  }
  const file = relative(project.dir, resolve(diagnostic.file.fileName)).replace(
    /\\/g,
    "/",
  );
  const { line } = diagnostic.file.getLineAndCharacterOfPosition(
    diagnostic.start,
  );
  return `${file}:${String(line + 1)} ${code}`;
}

/** Slash-separated, lower-cased: for prefix checks on any platform. */
export function normalize(path: string): string {
  return resolve(path).replace(/\\/g, "/").toLowerCase();
}
