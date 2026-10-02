import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { buildProbe } from "../src/build.js";
import { main } from "../src/cli/build.js";
import { AuthorError } from "../src/errors.js";
import {
  PACKAGE_FOLDER,
  PROBE_FOLDERS,
  type ProbeFolders,
} from "../src/folders.js";
import { stateFile } from "../src/state.js";

/** The fixture Probes folders this file made, removed after its tests. */
const createdProbesFolders: string[] = [];

afterAll(async () => {
  await Promise.all(
    createdProbesFolders.map((dir) =>
      rm(dir, { recursive: true, force: true }),
    ),
  );
});

/** The package's Probes and map folder, built into a temporary folder. */
async function tempFolders(
  overrides: Partial<ProbeFolders> = {},
): Promise<ProbeFolders> {
  const dir = await mkdtemp(join(tmpdir(), "probe-build-"));
  return {
    ...PROBE_FOLDERS,
    output: join(dir, "output"),
    state: join(dir, "state"),
    ...overrides,
  };
}

/**
 * A Probes folder holding one Probe, `<name>.ts`, of this source. It is made
 * in the package's ignored `.probe/` folder, not the system's temporary one,
 * which can be on another Windows drive than the workspace (the CI runner's
 * is), where no relative path reaches the Probe.
 */
async function probesFolder(name: string, source: string): Promise<string> {
  const parent = join(PACKAGE_FOLDER, ".probe", "test-probes");
  await mkdir(parent, { recursive: true });
  const dir = await mkdtemp(join(parent, "probes-"));
  createdProbesFolders.push(dir);
  await writeFile(join(dir, `${name}.ts`), source);
  return dir;
}

function captureOutput() {
  const output = { stdout: "", stderr: "" };
  return {
    output,
    streams: {
      stdout: (text: string) => (output.stdout += text),
      stderr: (text: string) => (output.stderr += text),
    },
  };
}

describe("buildProbe", () => {
  it("stages a folder whose war3map.lua is the editor script, one newline and the bundle, byte for byte", async () => {
    const folders = await tempFolders();
    const result = buildProbe("hello", folders);

    const staged = await readFile(join(result.stagingFolder, "war3map.lua"));
    const editorScript = await readFile(join(folders.map, "war3map.lua"));
    const bundle = await readFile(result.bundleFile);
    expect(bundle.byteLength).toBeGreaterThan(0);
    expect(staged).toEqual(
      Buffer.concat([editorScript, Buffer.from("\n"), bundle]),
    );
  });

  it("stages every other file of the map folder unchanged", async () => {
    const folders = await tempFolders();
    const result = buildProbe("hello", folders);

    const files = (await readdir(folders.map)).filter(
      (file) => file !== "war3map.lua",
    );
    expect((await readdir(result.stagingFolder)).sort()).toEqual(
      [...files, "war3map.lua"].sort(),
    );
    for (const file of files) {
      expect(await readFile(join(result.stagingFolder, file))).toEqual(
        await readFile(join(folders.map, file)),
      );
    }
  });

  it("bakes the runId into the bundle and stores it in the Probe's state file", async () => {
    const folders = await tempFolders();
    const result = buildProbe("hello", folders);

    const bundle = await readFile(result.bundleFile, "utf8");
    expect(bundle).toContain(`"${result.runId}"`);
    expect(bundle).toContain(`"hello"`);
    expect(
      JSON.parse(await readFile(stateFile(folders.state, "hello"), "utf8")),
    ).toEqual({ probe: "hello", runId: result.runId });
  });

  // The runner's in-game source keeps the rule of game-side Lua that may be
  // pasted into the World Editor, which crashes on saving a script holding a
  // percent sign. Neither a Probe nor the bundle is checked: the World
  // Editor never saves them (probe:build composes the bundle into the staged
  // map script, which the game loads with -loadfile), and the
  // typescript-to-lua library functions the bundle holds use percent signs.
  it("compiles the runner from in-game sources without a percent sign", async () => {
    const game = join(PACKAGE_FOLDER, "game");
    const sources = (await readdir(game)).filter((name) =>
      name.endsWith(".ts"),
    );
    expect(sources).toContain("encoding.ts");
    for (const name of sources) {
      expect(await readFile(join(game, name), "utf8"), name).not.toContain("%");
    }
  });

  it("gives each build a new runId", async () => {
    const folders = await tempFolders();
    const first = buildProbe("hello", folders);
    const second = buildProbe("hello", folders);

    expect(second.runId).not.toBe(first.runId);
    expect(
      JSON.parse(await readFile(stateFile(folders.state, "hello"), "utf8")),
    ).toEqual({ probe: "hello", runId: second.runId });
  });

  it("bakes the runId it is given", async () => {
    const folders = await tempFolders();
    const result = buildProbe("hello", folders, "given-run");

    expect(result.runId).toBe("given-run");
    expect(await readFile(result.bundleFile, "utf8")).toContain(`"given-run"`);
  });

  it("bakes the Patch of the Typings' manifest into the bundle", async () => {
    const dir = await mkdtemp(join(tmpdir(), "probe-manifest-"));
    const manifest = join(dir, "manifest.json");
    await writeFile(manifest, JSON.stringify({ patch: "3.0.0.11111" }));
    const result = buildProbe("hello", await tempFolders({ manifest }));

    expect(result.patch).toBe("3.0.0.11111");
    expect(await readFile(result.bundleFile, "utf8")).toContain(
      `"3.0.0.11111"`,
    );
  });

  it.each([
    ["no patch", "{}"],
    ["a patch that is no Build", JSON.stringify({ patch: 'a"b' })],
  ])(
    "refuses a manifest with %s, with a one-line author error, before touching the output folder",
    async (_, text) => {
      const dir = await mkdtemp(join(tmpdir(), "probe-manifest-"));
      const manifest = join(dir, "manifest.json");
      await writeFile(manifest, text);
      const folders = await tempFolders({ manifest });
      expect(() => buildProbe("hello", folders)).toThrow(
        new AuthorError(`${manifest} names no Patch, such as 3.0.0.24268.`),
      );
      await expect(readdir(folders.output)).rejects.toThrow();
    },
  );

  it.each([
    ["Hello"],
    ["hello_world"],
    ["hello-"],
    ["-hello"],
    ["hello--world"],
    ["../hello"],
    ["hello.ts"],
    ["héllo"],
    [""],
  ])(
    "refuses the name %j, which is not kebab-case ASCII, with a one-line author error",
    async (name) => {
      const folders = await tempFolders();
      expect(() => buildProbe(name, folders)).toThrow(AuthorError);
      expect(() => buildProbe(name, folders)).toThrow(/^[^\n]*kebab-case/);
    },
  );

  it("refuses a name with no Probe file, with a one-line author error", async () => {
    const folders = await tempFolders();
    expect(() => buildProbe("no-such-probe", folders)).toThrow(AuthorError);
    expect(() => buildProbe("no-such-probe", folders)).toThrow(
      /^No Probe no-such-probe: [^\n]*no-such-probe\.ts[^\n]*$/,
    );
  });

  it("reports a type error in the Probe with a one-line author error", async () => {
    const probes = await probesFolder(
      "broken",
      'export function run(): void {\n  const count: number = "one";\n  print(count);\n}\n',
    );
    const folders = await tempFolders({ probes });

    let error: unknown;
    try {
      buildProbe("broken", folders);
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(AuthorError);
    const { message } = error as AuthorError;
    expect(message).not.toContain("\n");
    expect(message).toMatch(
      /broken\.ts\(2,9\): error TS2322: Type 'string' is not assignable to type 'number'\./,
    );
  });
});

describe("probe:build", () => {
  it("builds the Probe it names and prints where it staged it", async () => {
    const folders = await tempFolders();
    const { output, streams } = captureOutput();

    expect(main(["hello"], streams, { folders })).toBe(0);
    expect(output.stderr).toBe("");
    const { runId } = JSON.parse(
      await readFile(stateFile(folders.state, "hello"), "utf8"),
    ) as { runId: string };
    expect(output.stdout).toBe(
      `Built Probe hello, run ${runId}: ${join(folders.output, "hello", "staging", "probe.w3m")}\n`,
    );
  });

  it("builds every Probe when it names none", async () => {
    const probes = await probesFolder(
      "second",
      "export function run(): void {}\n",
    );
    await writeFile(
      join(probes, "first.ts"),
      "export function run(): void {}\n",
    );
    // Not Probes: a folder and a file that is not TypeScript.
    await mkdir(join(probes, "support"));
    await writeFile(join(probes, "notes.md"), "# Notes\n");
    const folders = await tempFolders({ probes });
    const { output, streams } = captureOutput();

    expect(main([], streams, { folders })).toBe(0);
    expect(output.stdout).toMatch(
      /^Built Probe first, run \S+: .+\nBuilt Probe second, run \S+: .+\n$/,
    );
  });

  it("prints an author error on one line, with exit code 1", async () => {
    const folders = await tempFolders();
    const { output, streams } = captureOutput();

    expect(main(["Bad_Name"], streams, { folders })).toBe(1);
    expect(output.stdout).toBe("");
    expect(output.stderr).toMatch(
      /^probe:build failed: [^\n]*kebab-case[^\n]*\n$/,
    );
  });
});
