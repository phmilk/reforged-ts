/** @noSelfInFile */

// The per-test Native override: a test replaces one Native global for the
// length of one callback, without touching the stub files, and gets the stub
// back afterwards, also when the callback throws. A test that needs a Native
// to return nil, or a handle it controls, wraps the calls under test:
//
//   const unit = withNative("GetTriggerUnit", () => undefined, () =>
//     Unit.fromEvent(),
//   );
//
// The replacement is a stub like the shipped ones: each call is recorded in
// the call log (`Name(arg, arg)`) before the replacement runs, so the call
// assertions of the test still hold.

/** A global the Typings declare as a function: a Native. */
type NativeName = {
  [K in keyof typeof globalThis]: (typeof globalThis)[K] extends (
    ...args: never[]
  ) => unknown
    ? K
    : never;
}[keyof typeof globalThis];

type NativeOf<N extends NativeName> = (typeof globalThis)[N] extends (
  ...args: infer A
) => infer R
  ? { args: A; returns: R }
  : never;

/**
 * Runs `body` with the Native `name` replaced by `replacement`, restores the
 * Native it replaced (the stub, or nil when none was defined) and returns what
 * `body` returned. The replacement may return nil even where the Typings say
 * the Native never does: that is what the game does when it fails.
 */
export function withNative<N extends NativeName, R>(
  name: N,
  replacement: (
    ...args: NativeOf<N>["args"]
  ) => NativeOf<N>["returns"] | undefined,
  body: () => R,
): R {
  const globals = _G as unknown as Record<string, unknown>;
  const previous = globals[name];
  globals[name] = (...args: NativeOf<N>["args"]) => {
    __stub_record(name, ...args);
    return replacement(...args);
  };
  try {
    return body();
  } finally {
    globals[name] = previous;
  }
}
