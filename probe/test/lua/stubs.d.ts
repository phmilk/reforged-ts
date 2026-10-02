// The reforged-test stub helpers the Lua tests of the Probes' bundles call:
// globals the shipped stubs define, none of them a Native.

/** The strings the last `PreloadGenEnd` of `filename` wrote, or nil. */
declare function __stub_preload_file(filename: string): string[] | undefined;

/** Runs the handler `TimerStart` stored for `whichTimer`, once. */
declare function __stub_fire_timer(whichTimer: timer): void;

/** The arguments of every call of the Native `name`, oldest first. */
declare function __stub_args(name: string): (unknown[] & { n: number })[];

/** Every message shown on screen, oldest first. */
declare function __stub_displayed(): { duration?: number; text: string }[];

/** Sets what `os.clock` answers from now on; returns what it answered before. */
declare function __stub_set_clock(seconds: number): number;
