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
   * raises an error, which fails the Probe run. A numeric key is written
   * as `tostring` gives it: `{ 0: "a" }` records the key `0`.
   */
  record(kind: string, fields: Readonly<Record<string, FieldValue>>): void;

  /**
   * Adds the line `<seq> PENDING label=<label>` before a risky step, so a
   * crash in that step names it: `probe:read` reports the last `PENDING`
   * of an incomplete run. The label is encoded like a record's value. It
   * reaches the disk with the next checkpoint, as every line does.
   */
  pending(label: string): void;

  /**
   * Puts every line so far on disk: rewrites the Result file in full with
   * them, then a last line `<seq> CHECKPOINT`, and shows a progress message
   * on screen. A crash after it loses only what comes after it. The
   * `CHECKPOINT` line ends this rewrite only: the next line added takes its
   * seq.
   */
  checkpoint(): void;

  /**
   * Keeps the Probe run going after `run` returns: `END` then waits for
   * `finish()`, which a timer or an event the Probe set up calls once its
   * work is done. An error `run` throws still ends the run at once, as a
   * failed one, and so does one thrown from `after`'s callback; an error
   * thrown from a timer or an event the Probe started itself is not caught,
   * and the run never ends.
   */
  hold(): void;

  /**
   * Ends the Probe run: adds `END status=ok`, writes the Result file and
   * shows the end message with the number of records. The run ends when it
   * is called, `hold()` or not; once it has ended, `finish()` does nothing
   * and `record`, `pending` and `checkpoint` raise an error.
   */
  finish(): void;

  /**
   * Calls `callback` once, `seconds` after now, from a timer of its own,
   * under `xpcall`, as the runner calls `run`: an error it throws adds
   * `ERROR message=<message>`, then `END status=failed`, and shows the
   * failure, unless the run has ended, when only the screen shows it. It
   * works after the end too, for a step that must come after `END`.
   */
  after(seconds: number, callback: () => void): void;

  /**
   * Shows `text` on screen for `seconds`, as the runner's own messages are:
   * what the human must know or do during a step. It writes nothing to the
   * Result file, and works after the end too.
   */
  show(text: string, seconds: number): void;
}
