// A real tsserver over a throwaway Map project, for the tests of
// reforged-map/typescript-plugin (#595): the workspace's TypeScript, the
// plugin loaded by name from the package as `pnpm pack` writes it, unpacked
// under a node_modules tsserver reaches through --pluginProbeLocations, and
// driven through its protocol. The package is read from dist/, so
// `pnpm build` runs first.

import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { generateObjects } from "../../src/index.js";
import { PACKAGE_ROOT, makeTempDir } from "./map-folder.js";

const require = createRequire(path.join(PACKAGE_ROOT, "package.json"));

/** The workspace's tsserver. */
const TSSERVER = path.join(
  path.dirname(require.resolve("typescript/package.json")),
  "lib",
  "tsserver.js",
);

/**
 * Packs reforged-map with `pnpm pack`, its lifecycle scripts skipped as the
 * tarball test does, and unpacks it as `<folder>/node_modules/reforged-map`.
 * Returns the folder, a plugin probe location.
 */
export function packPlugin(): string {
  const dir = makeTempDir();
  const destination = path.join(dir, "tarball");
  fs.mkdirSync(destination);
  execFileSync(
    "pnpm",
    ["pack", "--config.ignore-scripts=true", "--pack-destination", destination],
    { cwd: PACKAGE_ROOT, stdio: "ignore", shell: process.platform === "win32" },
  );
  const tarball = fs
    .readdirSync(destination)
    .find((file) => file.endsWith(".tgz"));
  if (tarball === undefined) throw new Error("pnpm pack wrote no tarball");
  const probe = path.join(dir, "probe");
  const target = path.join(probe, "node_modules", "reforged-map");
  fs.mkdirSync(target, { recursive: true });
  execFileSync("tar", [
    "-xzf",
    path.join(destination, tarball),
    "-C",
    target,
    "--strip-components=1",
  ]);
  return probe;
}

/** How {@link createPluginProject} sets the Map project up. */
export interface PluginProjectOptions {
  /** The map folders to copy at the project root, by their name there. */
  atRoot?: Readonly<Record<string, string>>;
  /** The map folders to copy under `maps/`, by their name there. */
  maps?: Readonly<Record<string, string>>;
  /** The map folder the generated code is generated from: the first at the root, or else under `maps/`, by default. */
  generateFrom?: string;
  /** The plugin's tsconfig entry beyond its name. */
  plugin?: Readonly<Record<string, unknown>>;
  /** Whether reforged-builtins is installed; true by default. */
  builtins?: boolean;
  /** The source files, by their path under the project. */
  files: Readonly<Record<string, string>>;
}

/** What the Map project installs, linked from this package's installation. */
const LINKED_PACKAGES = ["reforged-types"];

/**
 * A Map project in a new temporary directory, in the Template's shape: a
 * package.json, a tsconfig.base.json holding the plugin's entry, which
 * tsconfig.json extends, the map folders at its root and under `maps/`, the code generated
 * from one of them in `src/generated/`, and reforged-types and
 * reforged-builtins installed. Returns its folder.
 */
export function createPluginProject(options: PluginProjectOptions): string {
  const dir = makeTempDir();
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name: "map-project", private: true, type: "module" }) +
      "\n",
  );
  const builtins = options.builtins ?? true;
  for (const name of [
    ...LINKED_PACKAGES,
    ...(builtins ? ["reforged-builtins"] : []),
  ]) {
    const target = path.dirname(require.resolve(`${name}/package.json`));
    const link = path.join(dir, "node_modules", ...name.split("/"));
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(fs.realpathSync(target), link, "junction");
  }
  for (const [name, source] of Object.entries(options.atRoot ?? {})) {
    fs.cpSync(source, path.join(dir, name), { recursive: true });
  }
  for (const [name, source] of Object.entries(options.maps ?? {})) {
    fs.cpSync(source, path.join(dir, "maps", name), { recursive: true });
  }
  const generateFrom =
    options.generateFrom ??
    Object.values(options.atRoot ?? {}).at(0) ??
    Object.values(options.maps ?? {}).at(0);
  if (generateFrom !== undefined) {
    const generated = path.join(dir, "src", "generated");
    fs.mkdirSync(generated, { recursive: true });
    for (const file of generateObjects(generateFrom, {
      projectRoot: PACKAGE_ROOT,
    }).files) {
      fs.writeFileSync(path.join(generated, file.name), file.contents);
    }
  }
  for (const [name, contents] of Object.entries(options.files)) {
    const file = path.join(dir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
  }
  const base = {
    compilerOptions: {
      target: "ESNext",
      lib: ["ESNext"],
      module: "ESNext",
      moduleResolution: "bundler",
      strict: true,
      noEmit: true,
      types: [
        "reforged-types/3.0.1",
        ...(builtins ? ["reforged-builtins/3.0.1"] : []),
      ],
      plugins: [{ name: "reforged-map/typescript-plugin", ...options.plugin }],
    },
  };
  fs.writeFileSync(
    path.join(dir, "tsconfig.base.json"),
    JSON.stringify(base, null, 2) + "\n",
  );
  fs.writeFileSync(
    path.join(dir, "tsconfig.json"),
    JSON.stringify(
      { extends: "./tsconfig.base.json", include: ["src"] },
      null,
      2,
    ) + "\n",
  );
  return dir;
}

/** A position in a file, 1-based, as tsserver's protocol counts it. */
export interface Location {
  readonly line: number;
  readonly offset: number;
}

/** A span in a file, as tsserver's protocol gives it. */
export interface FileSpan {
  readonly file: string;
  readonly start: Location;
  readonly end: Location;
}

/** The body of a `quickinfo` response. */
export interface QuickInfo {
  readonly displayString: string;
  readonly documentation: string;
  readonly start: Location;
  readonly end: Location;
}

/** One tsserver process, which the tests drive through its protocol. */
export class TsServer {
  readonly log: string;
  readonly #process: ChildProcess;
  readonly #pending = new Map<
    number,
    { resolve: (body: unknown) => void; reject: (error: Error) => void }
  >();
  #seq = 0;
  #buffer = Buffer.alloc(0);

  /** Starts tsserver with `probe` as its plugin probe location. */
  constructor(probe: string) {
    this.log = path.join(makeTempDir(), "tsserver.log");
    this.#process = spawn(
      process.execPath,
      [
        TSSERVER,
        "--pluginProbeLocations",
        probe,
        "--logFile",
        this.log,
        "--logVerbosity",
        "normal",
        "--disableAutomaticTypingAcquisition",
        "--suppressDiagnosticEvents",
      ],
      { stdio: ["pipe", "pipe", "inherit"] },
    );
    this.#process.stdout?.on("data", (chunk: Buffer) => {
      this.#buffer = Buffer.concat([this.#buffer, chunk]);
      this.#read();
    });
  }

  /** Opens a file, which makes tsserver load its project. */
  async open(file: string): Promise<void> {
    await this.request("open", { file });
  }

  /** The quick info at a location, undefined when tsserver gives none. */
  async quickinfo(file: string, at: Location): Promise<QuickInfo | undefined> {
    return (await this.request("quickinfo", { file, ...at }, true)) as
      QuickInfo | undefined;
  }

  /** The definitions at a location, through the `definition` request. */
  async definition(file: string, at: Location): Promise<FileSpan[]> {
    return ((await this.request("definition", { file, ...at }, true)) ??
      []) as FileSpan[];
  }

  /** The definitions and the bound span at a location, through `definitionAndBoundSpan`. */
  async definitionAndBoundSpan(
    file: string,
    at: Location,
  ): Promise<{
    definitions: FileSpan[];
    textSpan: { start: Location; end: Location };
  }> {
    return (await this.request("definitionAndBoundSpan", { file, ...at })) as {
      definitions: FileSpan[];
      textSpan: { start: Location; end: Location };
    };
  }

  /** The lines the plugin wrote to the log, without their prefix. */
  pluginLog(): string[] {
    const prefix = "reforged-map/typescript-plugin: ";
    return fs
      .readFileSync(this.log, "utf8")
      .split(/\r?\n/)
      .flatMap((line) => {
        const at = line.indexOf(prefix);
        return at === -1 ? [] : [line.slice(at + prefix.length)];
      });
  }

  /**
   * Sends a request and resolves with its response's body. A failed
   * response rejects, unless `optional`, which resolves with undefined
   * (tsserver fails a quickinfo with no info).
   */
  request(command: string, args: object, optional = false): Promise<unknown> {
    const seq = ++this.#seq;
    return new Promise((resolve, reject) => {
      this.#pending.set(seq, {
        resolve,
        reject: (error) => {
          if (optional) resolve(undefined);
          else reject(error);
        },
      });
      this.#process.stdin?.write(
        JSON.stringify({ seq, type: "request", command, arguments: args }) +
          "\n",
      );
    });
  }

  /** Stops tsserver. */
  close(): void {
    this.#process.kill();
  }

  #read(): void {
    for (;;) {
      const text = this.#buffer.toString("latin1");
      // tsserver counts one byte of newline after each message, but writes
      // its host's: on Windows, "\r\n" leaves a "\n" before the next header.
      const header = /^\s*Content-Length: (\d+)\r\n\r\n/.exec(text);
      if (header === null) return;
      const start = header[0].length;
      const length = Number(header[1]);
      if (this.#buffer.length < start + length) return;
      const message = JSON.parse(
        this.#buffer.subarray(start, start + length).toString("utf8"),
      ) as {
        type: string;
        request_seq?: number;
        success?: boolean;
        body?: unknown;
        message?: string;
      };
      this.#buffer = this.#buffer.subarray(start + length);
      if (message.type !== "response" || message.request_seq === undefined) {
        continue;
      }
      const pending = this.#pending.get(message.request_seq);
      this.#pending.delete(message.request_seq);
      if (message.success === true) pending?.resolve(message.body);
      else pending?.reject(new Error(message.message ?? "request failed"));
    }
  }
}

/**
 * The location of `needle`'s `index`-th character in a file, where `needle`
 * occurs once.
 */
export function locate(file: string, needle: string, index = 0): Location {
  const text = fs.readFileSync(file, "utf8");
  const at = text.indexOf(needle);
  if (at === -1 || text.includes(needle, at + 1)) {
    throw new Error(`${needle} does not occur once in ${file}`);
  }
  const before = text.slice(0, at + index).split("\n");
  return { line: before.length, offset: (before.at(-1)?.length ?? 0) + 1 };
}
