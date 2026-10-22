/**
 * A minimal Template, shaped like phmilk/reforged-ts-template: its
 * `package.json` with a `template:detach` script, a README with a title, an
 * `AGENTS.md` with "Template maintenance" and "Your project", the manifest
 * of its maintenance files, a map folder, and a detach script that removes
 * what the manifest lists as the Template's own does. The tests write it as
 * a folder or a tarball, and run its detach script for a fake `pnpm`.
 */
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";
import { commandLine, type Command, type Runner } from "../../src/process.js";

/** The paths the manifest lists, removed by `template:detach`. */
export const MAINTENANCE_PATHS = [
  "docs/agents/issue-tracker.md",
  "scripts/detach.mjs",
  "template-maintenance.json",
];

/** A path longer than a ustar name field, which the archive gives in a pax header. */
export const LONG_PATH = `src/${"nested/".repeat(16)}deep.ts`;

const DETACH_SCRIPT = `// Removes the Template maintenance, as the Template's scripts/detach.ts does.
import fs from "node:fs";
const { paths } = JSON.parse(fs.readFileSync("template-maintenance.json", "utf8"));
const manifest = JSON.parse(fs.readFileSync("package.json", "utf8"));
delete manifest.scripts["template:detach"];
fs.writeFileSync("package.json", JSON.stringify(manifest, null, 2) + "\\n");
const agents = fs.readFileSync("AGENTS.md", "utf8");
fs.writeFileSync("AGENTS.md", agents.replace(/\\n## Template maintenance\\n[^]*?(?=\\n## )/, ""));
for (const path of paths) fs.rmSync(path, { recursive: true, force: true });
console.log("Removed the Template maintenance.");
`;

/** The fixture's files, by `/`-separated path. */
export const TEMPLATE_FILES: Readonly<Record<string, string | Uint8Array>> = {
  "package.json": `${JSON.stringify(
    {
      name: "reforged-ts-template",
      version: "0.0.0",
      private: true,
      description: "Warcraft III 3.0.0 map project.",
      type: "module",
      engines: { node: ">=24" },
      scripts: {
        build: "node scripts/build.mjs",
        "template:detach": "node scripts/detach.mjs",
      },
    },
    null,
    2,
  )}\n`,
  "README.md":
    "# reforged-ts-template\n\nA Map project template.\n\n## Links\n\n- The library.\n",
  "AGENTS.md":
    "# Map project\n\n## Overview\n\nA map.\n\n## Template maintenance\n\nThe Template's own files.\n\n## Your project\n\nThis section belongs to the map's author.\n",
  "template-maintenance.json": `${JSON.stringify({ paths: MAINTENANCE_PATHS }, null, 2)}\n`,
  "docs/agents/issue-tracker.md": "# Issue tracker\n",
  "scripts/detach.mjs": DETACH_SCRIPT,
  "scripts/build.mjs": 'console.log("build");\n',
  "maps/fixture.w3m/war3map.w3i": new Uint8Array([0, 1, 2, 0xff, 0x0d, 0x0a]),
  [LONG_PATH]: "export {};\n",
};

/** A new empty folder under the system's temporary folder. */
export function tempDir(name: string): Promise<string> {
  return mkdtemp(join(tmpdir(), `create-reforged-map-${name}-`));
}

/** Writes `files` into `folder`. */
export async function writeFiles(
  folder: string,
  files: Readonly<Record<string, string | Uint8Array>>,
): Promise<void> {
  for (const [path, content] of Object.entries(files)) {
    const target = join(folder, ...path.split("/"));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
  }
}

/** Every file under `folder`, by `/`-separated path, sorted. */
export async function listFiles(folder: string): Promise<string[]> {
  const entries = await readdir(folder, {
    recursive: true,
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      join(entry.parentPath, entry.name)
        .slice(folder.length + 1)
        .replaceAll("\\", "/"),
    )
    .sort();
}

/**
 * The fixture as GitHub's tarball of a ref holds it: a pax global header,
 * then every entry under one top-level folder, a long path in a pax header
 * of its own. Written as `template.tar.gz` in a new folder; resolves with
 * its path.
 */
export async function templateArchive(
  files: Readonly<Record<string, string | Uint8Array>> = TEMPLATE_FILES,
  top = "reforged-ts-template-1",
): Promise<string> {
  const blocks: Uint8Array[] = [
    tarEntry("pax_global_header", "g", paxRecords({ comment: "fixture" })),
    tarEntry(`${top}/`, "5"),
  ];
  const folders = new Set<string>();
  for (const [path, content] of Object.entries(files)) {
    const segments = path.split("/");
    for (let i = 1; i < segments.length; i++) {
      const folder = segments.slice(0, i).join("/");
      if (folders.has(folder)) continue;
      folders.add(folder);
      blocks.push(tarEntry(`${top}/${folder}/`, "5"));
    }
    const name = `${top}/${path}`;
    if (name.length > 100) {
      blocks.push(tarEntry("PaxHeader", "x", paxRecords({ path: name })));
    }
    const bytes =
      typeof content === "string" ? new TextEncoder().encode(content) : content;
    blocks.push(tarEntry(name.slice(0, 100), "0", bytes));
  }
  blocks.push(new Uint8Array(1024));
  const path = join(await tempDir("archive"), "template.tar.gz");
  await writeFile(path, gzipSync(Buffer.concat(blocks)));
  return path;
}

/** One ustar entry: its header and its content padded to whole blocks. */
function tarEntry(
  name: string,
  type: string,
  content: Uint8Array = new Uint8Array(),
): Uint8Array {
  const header = Buffer.alloc(512);
  const put = (text: string, start: number, length: number) => {
    header.write(text.slice(0, length), start, length, "utf8");
  };
  const octal = (value: number, length: number) =>
    value.toString(8).padStart(length - 1, "0");
  put(name, 0, 100);
  put(octal(type === "5" ? 0o755 : 0o644, 8), 100, 8);
  put(octal(0, 8), 108, 8);
  put(octal(0, 8), 116, 8);
  put(octal(content.length, 12), 124, 12);
  put(octal(0, 12), 136, 12);
  put(type, 156, 1);
  put("ustar\u000000", 257, 8);
  header.fill(0x20, 148, 156);
  const sum = header.reduce((total, byte) => total + byte, 0);
  put(`${octal(sum, 7)}\u0000`, 148, 8);
  const padded = Buffer.alloc(Math.ceil(content.length / 512) * 512);
  padded.set(content);
  return Buffer.concat([header, padded]);
}

/** Pax records, `<length> <key>=<value>\n` each, the length counting itself. */
function paxRecords(records: Readonly<Record<string, string>>): Uint8Array {
  let text = "";
  for (const [key, value] of Object.entries(records)) {
    const body = ` ${key}=${value}\n`;
    let length = body.length + 1;
    while (String(length).length + body.length !== length) length++;
    text += `${String(length)}${body}`;
  }
  return new TextEncoder().encode(text);
}

/**
 * A `Runner` that records each command and answers with exit codes: 0, or
 * `exitCodes[commandLine]`; a program of `missing` cannot start. It runs the
 * fixture's detach script for `pnpm template:detach`, as pnpm would.
 */
export function recordingRunner(
  options: {
    exitCodes?: Readonly<Record<string, number>>;
    missing?: readonly string[];
  } = {},
) {
  const commands: Command[] = [];
  const run: Runner = (command) => {
    commands.push(command);
    if (options.missing?.includes(command.command) === true) {
      return Promise.reject(new Error(`spawn ${command.command} ENOENT`));
    }
    const code = options.exitCodes?.[commandLine(command)];
    if (code !== undefined) return Promise.resolve(code);
    if (commandLine(command) === "pnpm template:detach") {
      execFileSync(process.execPath, ["scripts/detach.mjs"], {
        cwd: command.cwd,
        stdio: "ignore",
      });
    }
    return Promise.resolve(0);
  };
  return { run, commands };
}

/** The commands as shell lines. */
export const lines = (commands: readonly Command[]): string[] =>
  commands.map(commandLine);
