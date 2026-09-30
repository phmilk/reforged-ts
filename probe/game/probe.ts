// What a Probe sees of the runner: the `p` its `run` receives. Types only, so
// a Probe imports them without a `require` in its bundle.

/** A value of a record's field, written as `tostring` gives it. */
export type FieldValue = string | number | boolean;

/**
 * The runner's writer, as a Probe's `run(p)` receives it. Its methods take
 * no `self`: a Probe calls `p.record(...)`, compiled as a plain call.
 * @noSelf
 */
export interface ProbeContext {
  /**
   * Adds one record to the Result file: the line
   * `<seq> <kind> <key>=<value> ...`, its fields sorted by key. A value
   * may be any string: the writer percent-encodes it and splits a long line
   * into continuation lines. The kind and the keys are written as they are,
   * so they stay in the safe alphabet: printable ASCII without space, `=`,
   * the percent sign, `"` or `\`, and not empty. Any other kind or key
   * raises an error, which fails the Probe run.
   */
  record(kind: string, fields: Readonly<Record<string, FieldValue>>): void;
}
