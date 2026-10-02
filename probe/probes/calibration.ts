// The calibration Probe: checks C1 to C8 of #298
// (docs/research/preload-file-writing.md, section 8 of the research branch),
// ported from its Lua snippet. It measures the Preload limits the Result
// file's format was frozen on (#299): each check writes its own test files
// with the raw Preload Natives, apart from the Result file, so the runner's
// encoding and splitting hide nothing of what is measured. The agent reads
// the outcome in two places: `probe:read calibration` for the records below,
// and the test files themselves, under CustomMapData\reforged-ts\calibration\.
//
// What the Result file records:
// - `write`: after each write of a test file, its name, the number of
//   `Preload` calls, whether it called PreloadGenClear and PreloadGenStart,
//   and `os.clock` just after its PreloadGenEnd.
// - `C1`: per string of preload-chars.txt, its `preload`, the ordinal of
//   its `Preload` call in the write (not its line in the file: the game's
//   wrapper comes first, and a string the game drops shifts the lines after
//   it), and its length, 200 to 300 bytes. The agent reads which are whole,
//   cut or missing.
// - `C2`: per backslash string of preload-chars.txt, its `preload`, its
//   length, its backslashes and its length once they are doubled.
// - `C6`: per control character string of preload-chars.txt, its
//   `preload`, its length and the character's name.
// - `C4`: per write of preload-rewrite.txt, its ordinal and its text.
// - `C3`: the lines of preload-many.txt, their length, and the `os.clock`
//   seconds the write took.
// - `C5`: each write of preload-crash.txt, its first at once, its second 30
//   seconds later.
// - `C7`: `os.clock` just before the run's first checkpoint, the game's
//   first PreloadGenStart, and how much `os.clock` advanced over the
//   30-second timer.
// - `C8`: the delay of `EndGame(false)` after END.
//
// C7 reads the `PreloadEnd` value of preload-crash.txt's second write, which
// called PreloadGenClear but no PreloadGenStart, against the `clock` of the
// `write` records: the second write's clock less the first checkpoint's
// if the game's timer never restarts, less the first write's if it runs
// from the last PreloadGenStart, 0.0 if it restarts at PreloadGenClear. The
// other files' `PreloadEnd` values check the answer. ISO C makes `os.clock`
// processor time, which the game's C library may give as wall time or not:
// the advance over the 30-second timer tells which, about 30 for wall time,
// and the agent reads the clocks as seconds only then.
//
// The order is the snippet's. preload-chars.txt comes first: a string over
// the limit may cut or crash its write. The three writes of C4 follow each
// other with no checkpoint between them, and nothing writes between
// preload-crash.txt's two writes: a checkpoint is a Preload write too, and
// would clear the buffer C4 reads or restart the timer C7 reads. Each step
// from C1 to C7 adds its PENDING line before it runs, and a checkpoint puts
// it on disk, so a crash in the step reads as `crashed` with its label: C3
// and C5 are the risky ones, and C1, whose write a string over the limit may
// crash. A record of a test file write comes after the write. For C5, the
// human kills the game during the 30 seconds the screen announces; the run
// then reads as `crashed` at C5,C7, and preload-crash.txt holds checkpoint 1
// and no END. A run that does C5 cannot do C8.
//
// C8 is the last step, after END by design, so no PENDING line can name it:
// once the runner has written `END status=ok`, a 3-second timer calls
// `EndGame(false)`, and the human reports where the client went. Nothing
// records past END, so what EndGame does reaches no file: the agent checks
// the Result file and the test files are intact. The harness test stubs
// EndGame. The Probe's timers are the runner's (`p.after`), so an error in a
// later step fails the run instead of leaving it to read as a crash.

import type { ProbeContext } from "../game/probe";

/** The folder of the test files, under CustomMapData. */
const TEST_FOLDER = "reforged-ts\\calibration\\";

/** The test file of C1, C2 and C6. */
const CHARS_FILE = "preload-chars.txt";

/** The test file of C4. */
const REWRITE_FILE = "preload-rewrite.txt";

/** The test file of C3. */
const MANY_FILE = "preload-many.txt";

/** The test file of C5 and C7. */
const CRASH_FILE = "preload-crash.txt";

/** The lengths C1 writes, around the reported limit of 259 bytes. */
const C1_LENGTHS = [200, 238, 255, 259, 260, 300];

/** The lines C3 writes, and the length of each. */
const C3_LINES = 5000;
const C3_LINE_BYTES = 100;

/** The seconds between preload-crash.txt's two writes, for C5 and C7. */
const C5_SECONDS = 30;

/** The seconds between END and `EndGame(false)`, for C8. */
const C8_SECONDS = 3;

/** How long the messages of C5 and C8 stay on screen, in seconds. */
const MESSAGE_SECONDS = 60;

/**
 * Writes `lines` to the test file `name`, with the raw Preload Natives:
 * `PreloadGenClear` when `clear`, `PreloadGenStart` when `start`, one
 * `Preload` per line, then `PreloadGenEnd`. Then records the `write`, with
 * `os.clock` just after its PreloadGenEnd, which it returns.
 */
function writeTestFile(
  p: ProbeContext,
  name: string,
  lines: readonly string[],
  clear: boolean,
  start: boolean,
): number {
  if (clear) PreloadGenClear();
  if (start) PreloadGenStart();
  for (const line of lines) {
    Preload(line);
  }
  PreloadGenEnd(TEST_FOLDER + name);
  const clock = os.clock();
  p.record("write", {
    file: name,
    preloads: lines.length,
    clear,
    start,
    clock,
  });
  return clock;
}

/**
 * A string of exactly `length` bytes: `<tag> len=<length> `, then `x`s,
 * then `Z`, so a cut line shows where it was cut.
 */
function sized(tag: string, length: number): string {
  const head = `${tag} len=${String(length)} `;
  return `${head}${string.rep("x", length - head.length - 1)}Z`;
}

/**
 * C1, the length limit: one string of each length in `C1_LENGTHS`, added
 * to `strings`, the strings of preload-chars.txt.
 */
function lengthLimit(p: ProbeContext, strings: string[]): void {
  for (const length of C1_LENGTHS) {
    strings.push(sized("C1", length));
    p.record("C1", { file: CHARS_FILE, preload: strings.length, length });
  }
}

/**
 * C2, backslashes and the limit: strings of 132 and 133 bytes that become
 * 258 and 260 once their backslashes are doubled, and one of 199 bytes with
 * 40 backslashes, 239 doubled. Whether the limit applies before or after
 * the doubling.
 */
function backslashes(p: ProbeContext, strings: string[]): void {
  const cases: [string, number][] = [
    [`C2 a ${string.rep("\\", 126)}Z`, 126],
    [`C2 b ${string.rep("\\", 127)}Z`, 127],
    [`C2 bs40 ${string.rep("\\", 40)}${string.rep("y", 150)}Z`, 40],
  ];
  for (const [text, count] of cases) {
    strings.push(text);
    p.record("C2", {
      file: CHARS_FILE,
      preload: strings.length,
      length: text.length,
      backslashes: count,
      doubled: text.length + count,
    });
  }
}

/**
 * C6, control characters: a CR, a CR LF, a NUL in the middle, a tab and a
 * percent sign, each in its own string between `[` and `] end`.
 */
function controlCharacters(p: ProbeContext, strings: string[]): void {
  const characters: [string, string][] = [
    ["cr", string.char(13)],
    ["crlf", string.char(13, 10)],
    ["nul", string.char(0)],
    ["tab", string.char(9)],
    ["pct", string.char(37)],
  ];
  for (const [name, character] of characters) {
    const text = `C6 ${name} [${character}] end`;
    strings.push(text);
    p.record("C6", {
      file: CHARS_FILE,
      preload: strings.length,
      length: text.length,
      character: name,
    });
  }
}

/**
 * C4, rewrites and the buffer: three writes of preload-rewrite.txt, the
 * first two after `PreloadGenClear`, the third without. The file holds
 * checkpoint 3 alone if `PreloadGenEnd` or `PreloadGenStart` clears the
 * buffer, checkpoints 2 and 3 if nothing does. A record calls no Preload
 * Native, so the writes still follow each other.
 */
function rewrites(p: ProbeContext): void {
  const writes: [string, boolean][] = [
    ["checkpoint 1", true],
    ["checkpoint 2", true],
    ["checkpoint 3, no clear", false],
  ];
  for (const [index, [text, clear]] of writes.entries()) {
    writeTestFile(p, REWRITE_FILE, [text], clear, true);
    p.record("C4", { file: REWRITE_FILE, write: index + 1, text });
  }
}

/**
 * C3, many lines: one write of preload-many.txt, 5,000 lines of 100 bytes
 * then `C3 done`, and the `os.clock` seconds it took.
 */
function manyLines(p: ProbeContext): void {
  const lines: string[] = [];
  for (let index = 1; index <= C3_LINES; index++) {
    const number = String(index);
    const head = `C3 line ${string.rep("0", 5 - number.length)}${number} `;
    lines.push(`${head}${string.rep("w", C3_LINE_BYTES - head.length - 1)}Z`);
  }
  lines.push("C3 done");
  const started = os.clock();
  const ended = writeTestFile(p, MANY_FILE, lines, true, true);
  p.record("C3", {
    file: MANY_FILE,
    lines: lines.length,
    length: C3_LINE_BYTES,
    seconds: ended - started,
  });
}

/**
 * C5 and C7, then C8: preload-crash.txt gets checkpoint 1 at once, then,
 * `C5_SECONDS` later and with no `PreloadGenStart` of its own, checkpoint 1,
 * checkpoint 2 and END. The run then ends, and `EndGame(false)` follows
 * `C8_SECONDS` after its END. `firstStart` is `os.clock` just before the
 * run's first checkpoint.
 */
function crashThenEndGame(p: ProbeContext, firstStart: number): void {
  // The PENDING line reaches the disk before the first write, the only
  // Preload write until the second: a checkpoint between them would call
  // PreloadGenStart, and C7 would read its timer instead. So the records of
  // the first write reach the disk only with the second.
  p.pending("C5,C7");
  p.checkpoint();
  writeTestFile(p, CRASH_FILE, ["checkpoint 1"], true, true);
  p.record("C5", { file: CRASH_FILE, write: 1 });
  p.show(
    `Probe calibration, C5: checkpoint 1 written; END in ${String(C5_SECONDS)} s. To test a crash, kill Warcraft III.exe now.`,
    MESSAGE_SECONDS,
  );
  const timerStarted = os.clock();
  p.after(C5_SECONDS, () => {
    const idle = os.clock() - timerStarted;
    writeTestFile(
      p,
      CRASH_FILE,
      ["checkpoint 1", "checkpoint 2", "END"],
      true,
      false,
    );
    p.record("C5", { file: CRASH_FILE, write: 2 });
    p.record("C7", {
      file: CRASH_FILE,
      firstStart,
      idle,
      timer: C5_SECONDS,
    });
    endGameAfterEnd(p);
  });
}

/**
 * C8, EndGame: records the step, ends the run, so the runner writes END,
 * then calls `EndGame(false)` `C8_SECONDS` later. The last step of the
 * Probe, after END by design: nothing it does reaches a file.
 */
function endGameAfterEnd(p: ProbeContext): void {
  p.record("C8", { seconds: C8_SECONDS, showScores: false });
  p.finish();
  p.show(
    `Probe calibration, C8: EndGame(false) in ${String(C8_SECONDS)} s. Say where the client went.`,
    MESSAGE_SECONDS,
  );
  p.after(C8_SECONDS, () => {
    EndGame(false);
  });
}

export function run(p: ProbeContext): void {
  p.hold();

  p.pending("C1,C2,C6");
  const firstStart = os.clock();
  p.checkpoint();
  const strings: string[] = [];
  lengthLimit(p, strings);
  backslashes(p, strings);
  controlCharacters(p, strings);
  strings.push("C1 C2 C6 done");
  writeTestFile(p, CHARS_FILE, strings, true, true);

  p.pending("C4");
  p.checkpoint();
  rewrites(p);

  p.pending("C3");
  p.checkpoint();
  manyLines(p);

  crashThenEndGame(p, firstStart);
}
