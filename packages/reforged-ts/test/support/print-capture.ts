/** @noSelfInFile */

// Print capture: the harness has none, so a test that asserts on what the
// library printed (the failure line of an Init stage callback) replaces the
// Lua global `print` for the length of one callback and gets the previous
// `print` back afterwards, also when the callback throws.

import { globals } from "./editor-script";

/**
 * Runs `body` with `print` collecting its lines instead of writing them, and
 * returns the lines: one per call, its arguments joined by a tab as Lua's
 * `print` joins them.
 */
export function withPrint(body: () => void): string[] {
  const lines: string[] = [];
  const previous = globals.print;
  globals.print = (...args: unknown[]) => {
    lines.push(args.map((arg) => tostring(arg)).join("\t"));
  };
  try {
    body();
  } finally {
    globals.print = previous;
  }
  return lines;
}
