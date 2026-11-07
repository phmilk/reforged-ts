/**
 * Seam 1, the watch of the map folder: `watchFiles` on files of a
 * temporary folder, its polls driven by fake timers. A World Editor save
 * writes several files one after another; the watch reports them once the
 * save settles, so that the banner it raises does not come back after the
 * author merged the first file (#875).
 */
import fs from "node:fs";
import path from "node:path";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { POLL_INTERVAL, watchFiles, type Watch } from "../src/server/watch.js";
import { makeTempDir, removeTemporary } from "./support/studio.js";

afterAll(removeTemporary);

let watch: Watch | undefined;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  watch?.stop();
  watch = undefined;
  vi.useRealTimers();
});

/** Two files of a new folder, and what the watch reports of them. */
function watched(): {
  readonly files: readonly [string, string];
  readonly reports: (readonly string[])[];
} {
  const folder = makeTempDir("watch");
  const files = [
    path.join(folder, "war3map.w3u"),
    path.join(folder, "war3map.wts"),
  ] as const;
  // Each write changes the size: the clock of a file's modification time
  // may not move between two writes this close.
  for (const file of files) fs.writeFileSync(file, "0");
  const reports: (readonly string[])[] = [];
  watch = watchFiles(
    () => files,
    (changed) => {
      reports.push(changed.map((file) => path.basename(file)));
      return true;
    },
  );
  return { files, reports };
}

describe("the watch of the map folder", () => {
  it("reports the files a save wrote once the save settles, in one report", () => {
    const { files, reports } = watched();

    fs.writeFileSync(files[0], "11");
    vi.advanceTimersByTime(POLL_INTERVAL);
    // A save writes its next file before the folder settles.
    fs.writeFileSync(files[1], "11");
    vi.advanceTimersByTime(POLL_INTERVAL);
    expect(reports).toEqual([]);

    vi.advanceTimersByTime(POLL_INTERVAL);
    expect(reports).toEqual([["war3map.w3u", "war3map.wts"]]);

    vi.advanceTimersByTime(POLL_INTERVAL * 3);
    expect(reports).toHaveLength(1);
  });

  it("reports a file that changed and stayed so at the next poll", () => {
    const { files, reports } = watched();

    fs.writeFileSync(files[1], "11");
    vi.advanceTimersByTime(POLL_INTERVAL * 2);

    expect(reports).toEqual([["war3map.wts"]]);
  });

  it("does not report a change the Studio took with resync", () => {
    const { files, reports } = watched();

    fs.writeFileSync(files[0], "11");
    watch?.resync();
    vi.advanceTimersByTime(POLL_INTERVAL * 3);

    expect(reports).toEqual([]);
  });
});
