/**
 * The watch of the map folder: the modification times of a list of files,
 * polled at most once a second with `stat`, which opens no file, so that
 * the Studio never holds a handle a World Editor save would trip on (ADR
 * 0015, first amendment). No `fs.watch`: it holds the folder open.
 */
import fs from "node:fs";

/** The shortest interval between two polls, in milliseconds: one second. */
export const POLL_INTERVAL = 1000;

/** Each file's modification time, change time and size, or `-` when it is missing. */
function stamps(files: readonly string[]): Map<string, string> {
  return new Map(
    files.map((file) => {
      const stat = fs.statSync(file, { throwIfNoEntry: false });
      return [
        file,
        stat === undefined
          ? "-"
          : `${String(stat.mtimeMs)} ${String(stat.ctimeMs)} ${String(stat.size)}`,
      ];
    }),
  );
}

/** A running watch, which {@link watchFiles} returns. */
export interface Watch {
  /** Stops polling. */
  stop(): void;
  /**
   * Takes the files' stamps as they are now, so that the next poll does
   * not report a change the Studio made and read itself, such as its own
   * save.
   */
  resync(): void;
}

/**
 * Polls the files `list` gives, listed again at each poll, once every
 * {@link POLL_INTERVAL}; calls `changed` with the files whose stamp
 * changed, appeared or disappeared since the last poll that `changed`
 * accepted. When `changed` returns false (the change could not be read yet,
 * such as a map folder a World Editor save is replacing), the next poll
 * reports the change again.
 *
 * @param list - The files to watch, absolute.
 * @param changed - Told the files that changed; returns whether it took the change.
 * @returns The watch, to stop it.
 */
export function watchFiles(
  list: () => readonly string[],
  changed: (files: readonly string[]) => boolean,
): Watch {
  let known = stamps(list());
  const timer = setInterval(() => {
    const now = stamps(list());
    const files = [...new Set([...known.keys(), ...now.keys()])].filter(
      (file) => known.get(file) !== now.get(file),
    );
    if (files.length > 0 && changed(files)) known = now;
  }, POLL_INTERVAL);
  timer.unref();
  return {
    stop() {
      clearInterval(timer);
    },
    resync() {
      known = stamps(list());
    },
  };
}
