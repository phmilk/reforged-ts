/**
 * Seam 1's Map projects and requests: a Map project in a temporary folder,
 * its map folder a copy of `reforged-map`'s World Editor fixture
 * `editor-objects.w3m`, `reforged-builtins` and `typescript` linked into it
 * as a Map project installs them; a synthetic install of the game
 * (`support/game.ts`); the Studio started on them with no World Editor
 * window; and requests sent as a host sends them, the `Host` and `Origin`
 * headers its own unless a test says otherwise.
 */
import fs from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import {
  startStudio,
  type Studio,
  type StudioOptions,
} from "../../src/index.js";
import { writeStorage } from "./casc.js";
import { GAME_FILES } from "./game.js";

const require = createRequire(import.meta.url);

/**
 * The folder of an installed package: this package's own, else one
 * `reforged-map` installs, as the Studio reaches `reforged-builtins`
 * through its peer.
 */
function packageFolder(name: string): string {
  const own = (): string =>
    path.dirname(require.resolve(`${name}/package.json`));
  try {
    return own();
  } catch {
    const map = createRequire(require.resolve("reforged-map/package.json"));
    return path.dirname(map.resolve(`${name}/package.json`));
  }
}

/** The fixture map folder the Map projects copy: a Custom object and a modified Built-in object of each kind, and `B000` shared by a buff and a destructable. */
export const FIXTURE = path.join(
  packageFolder("reforged-map"),
  "test",
  "fixtures",
  "editor-objects.w3m",
);

const temporary: string[] = [];

/** A new temporary folder, removed by {@link removeTemporary}. */
export function makeTempDir(name = "studio"): string {
  const dir = fs.mkdtempSync(
    path.join(os.tmpdir(), `reforged-studio-${name}-`),
  );
  temporary.push(dir);
  return dir;
}

/** Removes the temporary folders of {@link makeTempDir}. */
export function removeTemporary(): void {
  for (const dir of temporary.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** A Map project of the tests: its root and its map folder. */
export interface Project {
  readonly root: string;
  readonly mapFolder: string;
}

/** Links `node_modules/<name>` of `root` to this package's installation of it, as a junction (#754). */
function link(root: string, name: string): void {
  const linkPath = path.join(root, "node_modules", name);
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync(fs.realpathSync(packageFolder(name)), linkPath, "junction");
}

/** Writes files under a Map project's root, by relative path, their folders made. */
export function write(
  project: Project,
  files: Readonly<Record<string, string>>,
): void {
  for (const [name, contents] of Object.entries(files)) {
    const file = path.join(project.root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
  }
}

/** A Map project in a temporary folder: the fixture as `maps/test.w3m`, `files` under its root. */
export function mapProject(
  files: Readonly<Record<string, string>> = {},
): Project {
  const root = makeTempDir("project");
  const mapFolder = path.join(root, "maps", "test.w3m");
  fs.cpSync(FIXTURE, mapFolder, { recursive: true });
  fs.writeFileSync(path.join(root, "package.json"), '{ "private": true }\n');
  link(root, "reforged-builtins");
  link(root, "typescript");
  const project = { root, mapFolder };
  write(project, files);
  return project;
}

/** The game's executable of a synthetic install, which the Studio finds the install from. */
export async function syntheticGame(): Promise<string> {
  const { installDir } = await writeStorage({ files: { ...GAME_FILES } });
  temporary.push(installDir);
  return path.join(installDir, "_retail_", "x86_64", "Warcraft III.exe");
}

/** The Studios a test started, closed by {@link closeStudios}. */
const started: Studio[] = [];

/** Starts the Studio on a Map project, on any free port and with no World Editor window, unless `options` says otherwise. */
export async function start(
  project: Project,
  options: Partial<StudioOptions> = {},
): Promise<Studio> {
  const studio = await startStudio({
    projectRoot: project.root,
    mapFolder: project.mapFolder,
    gameExecutable: await syntheticGame(),
    port: 0,
    open: false,
    worldEditorCheck: { readWindowTitles: () => [] },
    ...options,
  });
  started.push(studio);
  return studio;
}

/** Closes the Studios {@link start} started. */
export async function closeStudios(): Promise<void> {
  await Promise.all(started.splice(0).map((studio) => studio.close()));
}

/** An answer of the Studio: its status, its headers and its body, parsed when JSON. */
export interface Answer {
  readonly status: number;
  readonly headers: http.IncomingHttpHeaders;
  readonly text: string;
  /** The parsed body; undefined when it is not JSON. */
  readonly body: unknown;
}

/** The port of a Studio's URL. */
export const portOf = (studio: Studio): number =>
  Number(new URL(studio.url).port);

/** What a request sends beyond its path. */
export interface RequestOptions {
  readonly method?: string;
  /** A JSON body. */
  readonly json?: unknown;
  /** Headers, over the Studio's own `Host` and, for a write, `Origin`. */
  readonly headers?: Readonly<Record<string, string>>;
  /** The address to connect to; 127.0.0.1 by default. */
  readonly address?: string;
}

/** Sends a request to a Studio, as its own page does unless `options` says otherwise. */
export function request(
  studio: Studio,
  pathname: string,
  options: RequestOptions = {},
): Promise<Answer> {
  const method =
    options.method ?? (options.json === undefined ? "GET" : "POST");
  const port = portOf(studio);
  const body =
    options.json === undefined ? undefined : JSON.stringify(options.json);
  const headers: Record<string, string> = {
    host: `localhost:${String(port)}`,
    ...(method !== "GET" && { origin: `http://localhost:${String(port)}` }),
    ...(body !== undefined && { "content-type": "application/json" }),
    ...options.headers,
  };
  return new Promise((resolve, reject) => {
    const sent = http.request(
      {
        host: options.address ?? "127.0.0.1",
        port,
        path: pathname,
        method,
        headers,
        setHost: false,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let parsed: unknown;
          try {
            parsed = JSON.parse(text);
          } catch {
            parsed = undefined;
          }
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            text,
            body: parsed,
          });
        });
      },
    );
    sent.on("error", reject);
    sent.end(body);
  });
}

/** One event of the Studio's event stream: its name and its parsed data. */
export interface StudioEvent {
  readonly event: string;
  readonly data: unknown;
}

/** The Studio's event stream, read as a host reads it. */
export interface EventStream {
  /** Waits for the next event of a name, at most `timeout` milliseconds. */
  next(event: string, timeout?: number): Promise<StudioEvent>;
  /** Every event received so far. */
  readonly received: readonly StudioEvent[];
  close(): void;
}

/** Opens the Studio's event stream, as its page does. */
export function events(studio: Studio): Promise<EventStream> {
  const port = portOf(studio);
  return new Promise((resolve, reject) => {
    const received: StudioEvent[] = [];
    const waiting: { event: string; done: (event: StudioEvent) => void }[] = [];
    let seen = 0;
    const deliver = () => {
      for (const waiter of [...waiting]) {
        const found = received
          .slice(seen)
          .find((event) => event.event === waiter.event);
        if (found !== undefined) {
          seen = received.indexOf(found) + 1;
          waiting.splice(waiting.indexOf(waiter), 1);
          waiter.done(found);
        }
      }
    };
    const sent = http.get(
      {
        host: "127.0.0.1",
        port,
        path: "/api/events",
        headers: { host: `localhost:${String(port)}` },
        setHost: false,
      },
      (response) => {
        let buffer = "";
        response.setEncoding("utf8");
        response.on("data", (chunk: string) => {
          buffer += chunk;
          let end: number;
          while ((end = buffer.indexOf("\n\n")) !== -1) {
            const block = buffer.slice(0, end);
            buffer = buffer.slice(end + 2);
            const lines = block.split("\n");
            const event = lines
              .find((line) => line.startsWith("event: "))
              ?.slice("event: ".length);
            const data = lines
              .find((line) => line.startsWith("data: "))
              ?.slice("data: ".length);
            if (event !== undefined && data !== undefined) {
              received.push({ event, data: JSON.parse(data) as unknown });
            }
          }
          deliver();
        });
        resolve({
          received,
          next(event, timeout = 5000) {
            return new Promise((done, fail) => {
              const timer = setTimeout(() => {
                fail(
                  new Error(`No ${event} event within ${String(timeout)} ms.`),
                );
              }, timeout);
              waiting.push({
                event,
                done: (found) => {
                  clearTimeout(timer);
                  done(found);
                },
              });
              deliver();
            });
          },
          close() {
            sent.destroy();
          },
        });
      },
    );
    sent.on("error", reject);
  });
}
