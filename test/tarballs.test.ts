/**
 * The publishable packages as npm receives them. Each package is packed with
 * `pnpm pack` into a temporary folder, and the tarball itself is read: its
 * file list, and the manifest pnpm wrote into it after rewriting the
 * workspace ranges. Run after `pnpm build` (as `pnpm check` does): the build
 * output is what the tarballs are checked for.
 */
import { execFile, exec } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { gunzipSync } from "node:zlib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const workspaceRoot = fileURLToPath(new URL("..", import.meta.url));

interface Manifest {
  name: string;
  version: string;
  license?: string;
  engines?: { node?: string };
  homepage?: string;
  repository?: { type?: string; url?: string; directory?: string };
  bugs?: { url?: string };
  keywords?: string[];
  publishConfig?: { access?: string };
  sideEffects?: boolean;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  [field: string]: unknown;
}

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const;

interface Expected {
  /** The folder under packages/. */
  readonly dir: string;
  /** Every file of the tarball matches one of these (paths relative to the package root). */
  readonly allowed: readonly RegExp[];
  /** Files the tarball must hold: build output and data files. */
  readonly required: readonly string[];
  /**
   * `sideEffects: false` is set only where loading a module does nothing a
   * bundler could drop: the Typings have no runtime module and the harness
   * glue only declares functions. The library's Init machinery acts at
   * require time, and the plugin creates itself (reading data files, warning
   * about missing packages) when its entry is loaded.
   */
  readonly sideEffectsFree: boolean;
  /** Peer dependencies on workspace packages, and whether each is optional. */
  readonly workspacePeers: Readonly<Record<string, boolean>>;
}

// Every tarball holds its manifest, LICENSE and README.md.
const COMMON = [/^package\.json$/, /^LICENSE$/, /^README\.md$/];

const PACKAGES: readonly Expected[] = [
  {
    dir: "reforged-ts",
    allowed: [
      /^dist\/.+\.(lua|d\.ts)$/,
      /^migration\/(renames\.json|renames\.schema\.json|behaviour-changes\.md)$/,
    ],
    required: [
      "dist/index.lua",
      "dist/index.d.ts",
      "dist/lualib_bundle.lua",
      "migration/renames.json",
    ],
    sideEffectsFree: false,
    workspacePeers: { "reforged-types": false, "reforged-test": true },
  },
  {
    dir: "reforged-types",
    allowed: [
      /^\d+\.\d+\.\d+\.d\.ts$/,
      /^\d+\.\d+\.\d+\/[^/]+\.d\.ts$/,
      /^lua-runtime\.d\.ts$/,
      /^async-natives\.json$/,
    ],
    required: [
      "3.0.0.d.ts",
      "3.0.0/common.j.d.ts",
      "3.0.0/blizzard.j.d.ts",
      "3.0.0/common.ai.d.ts",
      "lua-runtime.d.ts",
      "async-natives.json",
    ],
    sideEffectsFree: true,
    workspacePeers: {},
  },
  {
    dir: "reforged-test",
    allowed: [
      /^dist\/[^/]+\.(js|d\.ts)$/,
      /^lua\/[^/]+\.(lua|d\.ts)$/,
      /^stubs\/[^/]+\.lua$/,
    ],
    required: [
      "dist/index.js",
      "dist/index.d.ts",
      "lua/index.lua",
      "lua/index.d.ts",
      "stubs/base.lua",
    ],
    sideEffectsFree: true,
    workspacePeers: {},
  },
  {
    dir: "eslint-plugin-reforged",
    allowed: [
      /^dist\/.+\.(js|d\.ts)$/,
      /^data\/[^/]+\.json$/,
      /^docs\/[^/]+\.md$/,
    ],
    required: [
      "dist/index.js",
      "dist/index.d.ts",
      "data/creation-natives.json",
      "data/local-safe.json",
      "data/unsafe-natives.json",
    ],
    sideEffectsFree: false,
    // Optional: the plugin warns and disables the rules that need a missing
    // package (#50).
    workspacePeers: { "reforged-ts": true, "reforged-types": true },
  },
];

/** Folders and files that are sources, tests or tooling, never published. */
const UNPUBLISHED =
  /^(src|test|runner|scripts|templates|examples|overlay|vendor|build|dist-test|node_modules)\/|^tsconfig[^/]*\.json$|^AGENTS\.md$|(?<!\.d)\.ts$/;

const KEYWORDS = ["warcraft", "wc3", "reforged", "typescript-to-lua"];

interface Packed {
  readonly files: string[];
  readonly manifest: Manifest;
  readonly manifestText: string;
  readonly read: (path: string) => string;
}

const packed = new Map<string, Packed>();
const sources = new Map<string, Manifest>();
let rootManifest: Manifest;
let temp: string;

beforeAll(async () => {
  rootManifest = await readManifest(join(workspaceRoot, "package.json"));
  for (const dir of await readdir(join(workspaceRoot, "packages"))) {
    sources.set(
      dir,
      await readManifest(join(workspaceRoot, "packages", dir, "package.json")),
    );
  }
  temp = await mkdtemp(join(tmpdir(), "reforged-tarballs-"));
  await Promise.all(
    PACKAGES.map(async ({ dir }) => {
      packed.set(dir, await pack(dir, join(temp, dir)));
    }),
  );
}, 180_000);

afterAll(async () => {
  await rm(temp, { recursive: true, force: true });
});

describe("the workspace manifests", () => {
  it("range every workspace package with workspace:^", () => {
    const names = new Set([...sources.values()].map((m) => m.name));
    const ranges = [...sources.values()].flatMap((manifest) =>
      DEPENDENCY_FIELDS.flatMap((field) =>
        Object.entries(dependencies(manifest, field))
          .filter(([name]) => names.has(name))
          .map(([name, range]) => `${manifest.name} ${field} ${name} ${range}`),
      ),
    );
    expect(ranges.length).toBeGreaterThan(0);
    expect(
      ranges.filter((line) => !line.endsWith(" workspace:^")),
      "a hand-written range or another workspace protocol",
    ).toEqual([]);
  });
});

describe.each(PACKAGES)("the $dir tarball", (expected) => {
  const tarball = () => {
    const result = packed.get(expected.dir);
    if (result === undefined) throw new Error(`${expected.dir} was not packed`);
    return result;
  };

  it("holds the build output and the data files", () => {
    const { files } = tarball();
    expect(
      expected.required.filter((path) => !files.includes(path)),
      "missing from the tarball (run `pnpm build` first)",
    ).toEqual([]);
  });

  it("holds nothing but the build output, the data files, LICENSE and README", () => {
    const allowed = [...COMMON, ...expected.allowed];
    const { files } = tarball();
    expect(
      files.filter((path) => !allowed.some((pattern) => pattern.test(path))),
    ).toEqual([]);
    expect(files.filter((path) => UNPUBLISHED.test(path))).toEqual([]);
  });

  it("rewrites every workspace range to a caret on the same major", () => {
    const { manifest, manifestText } = tarball();
    expect(manifestText).not.toMatch(/"(workspace|catalog):/);
    const expectedRanges: Record<string, string> = {};
    const actualRanges: Record<string, string> = {};
    for (const field of DEPENDENCY_FIELDS) {
      const source = dependencies(sourceOf(expected.dir), field);
      for (const [name, range] of Object.entries(source)) {
        if (!range.startsWith("workspace:")) continue;
        const key = `${field} ${name}`;
        expectedRanges[key] = `^${versionOf(name)}`;
        actualRanges[key] = dependencies(manifest, field)[name] ?? "(absent)";
      }
    }
    expect(actualRanges).toEqual(expectedRanges);
  });

  it("declares its workspace peers, required or optional", () => {
    const { manifest } = tarball();
    const peers = Object.fromEntries(
      Object.keys(manifest.peerDependencies ?? {})
        .filter((name) => [...sources.values()].some((m) => m.name === name))
        .map((name) => [
          name,
          manifest.peerDependenciesMeta?.[name]?.optional === true,
        ]),
    );
    expect(peers).toEqual(expected.workspacePeers);
  });

  it("carries the package metadata npm shows", () => {
    const { manifest } = tarball();
    expect(manifest.name).toBe(expected.dir);
    expect(manifest.license).toBe("MIT");
    expect(manifest.engines?.node).toBe(rootManifest.engines?.node);
    expect(manifest.publishConfig).toEqual({ access: "public" });
    expect(manifest.homepage).toBe("https://phmilk.github.io/reforged-ts");
    expect(manifest.repository).toEqual({
      type: "git",
      url: "git+https://github.com/phmilk/reforged-ts.git",
      directory: `packages/${expected.dir}`,
    });
    expect(manifest.bugs).toEqual({
      url: "https://github.com/phmilk/reforged-ts/issues",
    });
    expect(manifest.keywords).toEqual(expect.arrayContaining(KEYWORDS));
    expect(manifest.sideEffects).toBe(
      expected.sideEffectsFree ? false : undefined,
    );
  });

  it("keeps the upstream copyright line above the fork's in LICENSE", () => {
    const lines = tarball().read("LICENSE").split(/\r?\n/);
    const upstream = lines.indexOf("Copyright (c) 2019 trigger");
    const fork = lines.findIndex((line) => line.includes("Paulo H. A. Leite"));
    expect(lines[0]).toBe("MIT License");
    expect(upstream).toBeGreaterThan(0);
    expect(fork).toBe(upstream + 1);
  });

  it("points AI agents at the documentation of its version", () => {
    expect(tarball().read("README.md")).toMatch(
      /^\*\*For AI agents:\*\* .*\[llms\.txt\]\(https:\/\/[^)]+\)/m,
    );
  });
});

function sourceOf(dir: string): Manifest {
  const manifest = sources.get(dir);
  if (manifest === undefined) throw new Error(`no package ${dir}`);
  return manifest;
}

function versionOf(name: string): string {
  const manifest = [...sources.values()].find((m) => m.name === name);
  if (manifest === undefined) throw new Error(`no workspace package ${name}`);
  return manifest.version;
}

function dependencies(
  manifest: Manifest,
  field: (typeof DEPENDENCY_FIELDS)[number],
): Record<string, string> {
  return (manifest[field] ?? {}) as Record<string, string>;
}

async function readManifest(path: string): Promise<Manifest> {
  return JSON.parse(await readFile(path, "utf8")) as Manifest;
}

/**
 * Packs packages/<dir> into `destination` and reads the tarball back.
 * Lifecycle scripts are skipped: the build already ran, and reforged-test's
 * `prepare` would rebuild the harness while other test projects read it.
 * Under `pnpm test` the pnpm that runs the script is reused through node;
 * otherwise `pnpm` is looked up by the shell (pnpm.cmd on Windows).
 */
async function pack(dir: string, destination: string): Promise<Packed> {
  const args = [
    "pack",
    "--config.ignore-scripts=true",
    "--pack-destination",
    destination,
  ];
  const options = { cwd: join(workspaceRoot, "packages", dir) };
  const execPath = process.env.npm_execpath;
  if (execPath !== undefined && /pnpm\.c?js$/.test(execPath)) {
    await promisify(execFile)(process.execPath, [execPath, ...args], options);
  } else {
    await promisify(exec)(
      `pnpm ${args.map((arg) => `"${arg}"`).join(" ")}`,
      options,
    );
  }
  const tarballs = (await readdir(destination)).filter((file) =>
    file.endsWith(".tgz"),
  );
  if (tarballs.length !== 1) {
    throw new Error(
      `expected one tarball in ${destination}: ${tarballs.join()}`,
    );
  }
  const entries = untar(await readFile(join(destination, tarballs[0] ?? "")));
  const read = (path: string) => {
    const content = entries.get(path);
    if (content === undefined) throw new Error(`${dir}: no ${path} in tarball`);
    return content.toString("utf8");
  };
  const manifestText = read("package.json");
  return {
    files: [...entries.keys()].sort(),
    manifest: JSON.parse(manifestText) as Manifest,
    manifestText,
    read,
  };
}

/** The files of a gzipped npm tarball, by path without the `package/` prefix. */
function untar(tarball: Buffer): Map<string, Buffer> {
  const archive = gunzipSync(tarball);
  const field = (header: Buffer, start: number, length: number) =>
    header.toString("utf8", start, start + length).replace(/\0.*$/s, "");
  const entries = new Map<string, Buffer>();
  for (let offset = 0; offset + 512 <= archive.length;) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const prefix = field(header, 345, 155);
    const name = (prefix === "" ? "" : prefix + "/") + field(header, 0, 100);
    const size = parseInt(field(header, 124, 12).trim() || "0", 8);
    const type = field(header, 156, 1);
    offset += 512;
    if (type === "0" || type === "") {
      entries.set(
        name.replace(/^package\//, ""),
        archive.subarray(offset, offset + size),
      );
    } else if (type !== "5") {
      throw new Error(`unexpected tar entry type '${type}' for ${name}`);
    }
    offset += Math.ceil(size / 512) * 512;
  }
  return entries;
}
