/**
 * A throwaway Map project that consumes reforged-types the way an installed
 * dependency is consumed: the package is packed with pnpm (so the `files`
 * list decides what ships) and unpacked into the project's node_modules. Its
 * own dependencies and the Map project's other `types` entry are linked in
 * from this package's installation.
 */
import { execFileSync, execSync } from "node:child_process";
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
import ts from "typescript";

export const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const fixturesRoot = join(packageRoot, "test", "fixtures", "map-project");

/** The `types` entries the Template lists; `common.ai` is the AI opt-in. */
export const TEMPLATE_TYPES = [
  "reforged-types/3.0.0",
  "@typescript-to-lua/language-extensions",
];
export const AI_TYPES = [...TEMPLATE_TYPES, "reforged-types/3.0.0/common.ai"];

/** Packages the Map project gets besides reforged-types (its dependency, and a Template dev dependency). */
const LINKED_PACKAGES = ["lua-types", "@typescript-to-lua/language-extensions"];

export interface Workspace {
  /** The temporary folder holding node_modules and the fixture projects. */
  root: string;
  /** The unpacked package, as the Map project's node_modules holds it. */
  installed: string;
  dispose(): Promise<void>;
}

/** Packs this package and installs it into a fresh temporary folder. */
export async function createWorkspace(): Promise<Workspace> {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "reforged-types-map-")),
  );
  const tarball = pack(root);
  const installed = join(root, "node_modules", "reforged-types");
  await unpack(await readFile(tarball), installed);

  const require = createRequire(join(packageRoot, "package.json"));
  for (const name of LINKED_PACKAGES) {
    const target = dirname(require.resolve(`${name}/package.json`));
    const link = join(root, "node_modules", ...name.split("/"));
    await mkdir(dirname(link), { recursive: true });
    await symlink(await realpath(target), link, "junction");
  }
  return {
    root,
    installed,
    dispose: () => rm(root, { recursive: true, force: true }),
  };
}

/**
 * Runs `pnpm pack` on this package into `destination`; returns the tarball
 * path. Under `pnpm test` the pnpm that runs the script is reused through
 * node; otherwise `pnpm` is looked up by the shell (pnpm.cmd on Windows).
 */
function pack(destination: string): string {
  const options = { cwd: packageRoot, encoding: "utf8" } as const;
  const execPath = process.env.npm_execpath;
  const output =
    execPath !== undefined && /pnpm\.c?js$/.test(execPath)
      ? execFileSync(
          process.execPath,
          [execPath, "pack", "--json", "--pack-destination", destination],
          options,
        )
      : execSync(
          `pnpm pack --json --pack-destination "${destination}"`,
          options,
        );
  return (JSON.parse(output) as { filename: string }).filename;
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
 * A Map project in `workspace` named `name`: the fixture folder of the same
 * name copied to `src/`, and a tsconfig.json in the shape of the Template's
 * (TypeScript 6 wants `rootDir`; bundler resolution; Lua 5.3 for tstl).
 */
export async function createMapProject(
  workspace: Workspace,
  name: string,
  types: string[],
): Promise<MapProject> {
  const dir = join(workspace.root, name);
  await cp(join(fixturesRoot, name), join(dir, "src"), { recursive: true });
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
    tstl: { luaTarget: "5.3", noHeader: true },
  };
  await writeFile(tsconfig, JSON.stringify(config, null, 2) + "\n");
  return { dir, tsconfig };
}

/** The fixture source `file` of the project `name`, as committed. */
export function readFixture(name: string, file: string): Promise<string> {
  return readFile(join(fixturesRoot, name, file), "utf8");
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
  )!;
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
  const code = `TS${diagnostic.code}`;
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
  return `${file}:${line + 1} ${code}`;
}

/** Slash-separated, lower-cased: for prefix checks on any platform. */
export function normalize(path: string): string {
  return resolve(path).replace(/\\/g, "/").toLowerCase();
}
