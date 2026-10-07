/**
 * A throwaway Map project that consumes reforged-builtins the way an
 * installed dependency is consumed: the package is packed with pnpm (so the
 * `files` list decides what ships) and unpacked into the project's
 * node_modules. The workspace's reforged-types, reforged-ts (read from its
 * emitted declarations, so `pnpm build` runs first), reforged-test and the
 * typescript-to-lua language extensions are linked in next to it.
 */
import { execSync } from "node:child_process";
import {
  access,
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

/** The language extensions, which a Map project lists in `types` too. */
const LANGUAGE_EXTENSIONS = "@typescript-to-lua/language-extensions";

/** `types` with the Typings first, then the package's overloads. */
export const TYPES_FIRST = [
  "reforged-types/3.0.0",
  "reforged-builtins/3.0.0",
  LANGUAGE_EXTENSIONS,
];
/** `types` with the package's overloads first. */
export const BUILTINS_FIRST = [
  "reforged-builtins/3.0.0",
  "reforged-types/3.0.0",
  LANGUAGE_EXTENSIONS,
];

/** What the Map project installs besides the package, linked from this package's installation. */
const LINKED_PACKAGES = [
  "reforged-types",
  "reforged-ts",
  "reforged-test",
  LANGUAGE_EXTENSIONS,
];

export interface Workspace {
  /** The temporary folder holding node_modules and the fixture projects. */
  root: string;
  /** The unpacked package, as the Map project's node_modules holds it. */
  installed: string;
  /** The tarball's files, `/`-separated, in code-point order. */
  packed: string[];
  dispose(): Promise<void>;
}

/** Packs this package and installs it into a fresh temporary folder. */
export async function createWorkspace(): Promise<Workspace> {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "reforged-builtins-map-")),
  );
  const tarball = pack(root);
  const installed = join(root, "node_modules", "reforged-builtins");
  const packed = await unpack(await readFile(tarball), installed);

  const require = createRequire(join(packageRoot, "package.json"));
  for (const name of LINKED_PACKAGES) {
    const target = dirname(require.resolve(`${name}/package.json`));
    const link = join(root, "node_modules", ...name.split("/"));
    await mkdir(dirname(link), { recursive: true });
    await symlink(await realpath(target), link, "junction");
  }
  try {
    await access(
      join(root, "node_modules", "reforged-ts", "dist", "index.d.ts"),
    );
  } catch {
    throw new Error(
      "reforged-ts has no emitted declarations: run `pnpm build` first.",
    );
  }
  return {
    root,
    installed,
    packed,
    dispose: () => rm(root, { recursive: true, force: true }),
  };
}

/**
 * Runs `pnpm pack` on this package into `destination`; returns the tarball
 * path. `pnpm` is looked up by the shell (pnpm.exe or pnpm.cmd on Windows).
 */
function pack(destination: string): string {
  const output = execSync(
    `pnpm pack --json --pack-destination "${destination}"`,
    { cwd: packageRoot, encoding: "utf8" },
  );
  return (JSON.parse(output) as { filename: string }).filename;
}

/**
 * Writes the files of a gzipped npm tarball, minus the `package/` prefix,
 * under `into`; returns their `/`-separated paths, sorted.
 */
async function unpack(tarball: Buffer, into: string): Promise<string[]> {
  const archive = gunzipSync(tarball);
  const field = (header: Buffer, start: number, length: number) =>
    header.toString("utf8", start, start + length).replace(/\0.*$/s, "");
  const files: string[] = [];
  for (let offset = 0; offset + 512 <= archive.length;) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const prefix = field(header, 345, 155);
    const name = (prefix === "" ? "" : prefix + "/") + field(header, 0, 100);
    const size = parseInt(field(header, 124, 12).trim() || "0", 8);
    const type = field(header, 156, 1);
    offset += 512;
    if (type === "0" || type === "") {
      const file = name.replace(/^package\//, "");
      const path = join(into, ...file.split("/"));
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, archive.subarray(offset, offset + size));
      files.push(file);
    } else if (type !== "5") {
      throw new Error(`unexpected tar entry type '${type}' for ${name}`);
    }
    offset += Math.ceil(size / 512) * 512;
  }
  return files.sort();
}

export interface MapProject {
  dir: string;
  tsconfig: string;
}

/**
 * A Map project in `workspace` named `name`: the fixture folder `fixtures`
 * copied to `src/`, and a tsconfig.json in the shape of the Template's
 * (bundler resolution; Lua 5.3 for typescript-to-lua) with `types` and the
 * extra typescript-to-lua options `tstl`.
 */
export async function createMapProject(
  workspace: Workspace,
  name: string,
  fixtures: string,
  types: readonly string[],
  tstl: Record<string, unknown> = {},
): Promise<MapProject> {
  const dir = join(workspace.root, name);
  await cp(join(fixturesRoot, fixtures), join(dir, "src"), { recursive: true });
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
  const file = relative(project.dir, resolve(diagnostic.file.fileName))
    .split(/[\\/]/)
    .join("/");
  const { line } = diagnostic.file.getLineAndCharacterOfPosition(
    diagnostic.start,
  );
  return `${file}:${String(line + 1)} ${code}`;
}

/** Slash-separated, lower-cased: for prefix checks on any platform. */
export function normalize(path: string): string {
  return resolve(path).replace(/\\/g, "/").toLowerCase();
}
