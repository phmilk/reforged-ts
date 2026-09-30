// `@probe/current` while the package type-checks: any Probe. `probe:build`
// maps it to the Probe it builds, whose `run` must match this one.

import type { ProbeContext } from "./probe";

/** Runs the Probe: what the runner calls from its timer, under `xpcall`. */
export declare function run(p: ProbeContext): void;
