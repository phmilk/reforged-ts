/**
 * Seam 1, the Studio's runtime file (#833): `.reforged-studio.json` at the
 * Map project's root, written once the server listens and removed on a
 * clean stop, which a second Studio on the same map folder reads to open
 * the first one's URL instead of starting, and which the hover of
 * `reforged-map`'s plugin reads for its link.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { STUDIO_RUNTIME_FILE, type StudioRuntimeFile } from "reforged-map";
import {
  closeStudios,
  mapProject,
  removeTemporary,
  request,
  start,
  type Project,
} from "./support/studio.js";

afterEach(closeStudios);
afterAll(removeTemporary);

/** The runtime file of a Map project. */
const runtimeFile = (project: Project): string =>
  path.join(project.root, STUDIO_RUNTIME_FILE);

/** The runtime file's record, parsed; undefined when there is none. */
function readRuntimeFile(project: Project): StudioRuntimeFile | undefined {
  const file = runtimeFile(project);
  if (!fs.existsSync(file)) return undefined;
  return JSON.parse(fs.readFileSync(file, "utf8")) as StudioRuntimeFile;
}

/** A second map folder of a Map project, a copy of its first. */
function secondMapFolder(project: Project): string {
  const other = path.join(project.root, "maps", "other.w3m");
  fs.cpSync(project.mapFolder, other, { recursive: true });
  return other;
}

/** The pid of a process that has ended. */
function deadPid(): number {
  return spawnSync(process.execPath, ["-e", ""]).pid;
}

describe("the Studio's runtime file", () => {
  it("is written at the Map project's root once the server listens", async () => {
    const project = mapProject();
    const before = Date.now();
    const studio = await start(project);

    const record = readRuntimeFile(project);
    expect(record).toEqual({
      format: 1,
      url: studio.url,
      pid: process.pid,
      mapFolder: path.resolve(project.mapFolder),
      startedAt: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      ) as unknown,
    });
    expect(path.isAbsolute(record?.mapFolder ?? "")).toBe(true);
    expect(Date.parse(record?.startedAt ?? "")).toBeGreaterThanOrEqual(
      before - 1000,
    );
    expect((await request(studio, "/api/session")).status).toBe(200);
  });

  it("is removed when the Studio closes", async () => {
    const project = mapProject();
    const studio = await start(project);

    await studio.close();

    expect(fs.existsSync(runtimeFile(project))).toBe(false);
  });

  it("makes a second Studio on the same map folder give the first one's URL without starting", async () => {
    const project = mapProject();
    const first = await start(project);
    const record = readRuntimeFile(project);

    const second = await start(project, { port: 0 });

    expect(second.url).toBe(first.url);
    expect(second.started).toBe(false);
    expect(first.started).toBe(true);
    expect(readRuntimeFile(project)).toEqual(record);

    await second.close();
    expect(readRuntimeFile(project)).toEqual(record);
    expect((await request(first, "/api/session")).status).toBe(200);

    await first.close();
    expect(fs.existsSync(runtimeFile(project))).toBe(false);
  });

  it("is replaced by a Studio on another map folder of the Map project, which the first one's close leaves", async () => {
    const project = mapProject();
    const first = await start(project);
    const other = secondMapFolder(project);

    const second = await start(project, { mapFolder: other });

    expect(second.started).toBe(true);
    expect(second.url).not.toBe(first.url);
    expect(readRuntimeFile(project)).toMatchObject({
      url: second.url,
      mapFolder: path.resolve(other),
    });

    await first.close();
    expect(readRuntimeFile(project)).toMatchObject({ url: second.url });
  });

  it("is replaced when the Studio that wrote it ended without removing it", async () => {
    const project = mapProject();
    fs.writeFileSync(
      runtimeFile(project),
      JSON.stringify({
        format: 1,
        url: "http://localhost:1",
        pid: deadPid(),
        mapFolder: path.resolve(project.mapFolder),
        startedAt: new Date().toISOString(),
      }),
    );

    const studio = await start(project);

    expect(studio.started).toBe(true);
    expect(readRuntimeFile(project)).toMatchObject({
      url: studio.url,
      pid: process.pid,
    });
  });

  it.each([
    ["it cannot be read", "{ not json"],
    [
      "it is not of the format",
      JSON.stringify({
        format: 1,
        url: "http://localhost:1",
        pid: process.pid,
      }),
    ],
  ])("is replaced when %s", async (_, contents) => {
    const project = mapProject();
    fs.writeFileSync(runtimeFile(project), contents);

    const studio = await start(project);

    expect(studio.started).toBe(true);
    expect(readRuntimeFile(project)).toMatchObject({ url: studio.url });
  });
});
