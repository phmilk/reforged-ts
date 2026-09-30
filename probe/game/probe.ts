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
   * `<seq> <kind> <key>=<value> ...`, its fields sorted by key.
   */
  record(kind: string, fields: Readonly<Record<string, FieldValue>>): void;
}
