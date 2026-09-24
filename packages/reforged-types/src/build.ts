/**
 * The Build of a Patch (`3.0.0.24268`) and the commit a jass-history tag
 * resolves to: what a valid one looks like, how Builds are ordered, and the
 * Game version a Build belongs to. Every reader and writer of a Build or a
 * commit checks it here.
 */
import { byCodePoint } from "./order.js";

/** A Build, unanchored, to embed in a larger pattern. */
export const BUILD_PATTERN = String.raw`\d+\.\d+\.\d+\.\d+`;

const BUILD = new RegExp(`^${BUILD_PATTERN}$`);

const COMMIT = /^[0-9a-f]{40}$/;

/** A full four-component Build such as `3.0.0.24268`. */
export function isBuild(text: string): boolean {
  return BUILD.test(text);
}

/** A full 40-digit lowercase commit hash. */
export function isCommit(text: string): boolean {
  return COMMIT.test(text);
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

/** `Patch 3.0.0.24268`, `Patches 3.0.0.24268 and 3.1.0.25000`. */
export function patchList(builds: readonly string[]): string {
  return builds.length === 1
    ? `Patch ${builds[0]}`
    : `Patches ${builds.slice(0, -1).join(", ")} and ${builds[builds.length - 1]}`;
}
