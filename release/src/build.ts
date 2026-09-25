/**
 * The Build of a Patch (`3.0.0.24268`) as the release scripts read it: what
 * a valid one looks like, how Builds are ordered, and the Game version a
 * Build belongs to. The same rules as the Typings generator's
 * `packages/reforged-types/src/build.ts`, which is not part of the published
 * package and so is not imported.
 */
import { byCodePoint } from "./order.js";

const BUILD = /^\d+\.\d+\.\d+\.\d+$/;

/** A full four-component Build such as `3.0.0.24268`. */
export function isBuild(value: unknown): value is string {
  return typeof value === "string" && BUILD.test(value);
}

/** The Game version a Build belongs to: its first three components. */
export function gameVersion(build: string): string {
  return build.split(".").slice(0, 3).join(".");
}

/** Orders two Builds numerically, component by component. */
export function compareBuilds(a: string, b: string): number {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const difference = (left[i] ?? 0) - (right[i] ?? 0);
    if (difference !== 0 && !Number.isNaN(difference)) return difference;
  }
  return byCodePoint(a, b);
}
