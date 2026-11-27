/**
 * The player slots a staged map declares, which a Probe run may raise
 * (`--players`) without changing the committed map folder (#1043), so a
 * Probe can be run with two clients (#1040). The step writes them in two
 * staged files: the player and force tables of `war3map.w3i`, which the
 * lobby reads, and the `config` of `war3map.lua`, which the game runs.
 * The tables are located as wc3libs' reader of the format locates them
 * (`W3I.java`, `read_0x27`), in format 39 alone, the World Editor of 3.0's
 * and the Template's, and read to the file's end: what follows them is
 * kept byte for byte.
 */
import { AuthorError } from "./errors.js";

/** The command-line option, without its `--`. */
export const PLAYERS_OPTION = "players";

/** The option as `parseArgs` takes it. */
export const PLAYERS_ARGS = {
  [PLAYERS_OPTION]: { type: "string" },
} as const;

/**
 * The numbers of player slots the step stages: two, the case of #1040, the
 * second one's start mirrored from the first's.
 */
export const SUPPORTED_PLAYERS: readonly number[] = [2];

/** The players of the option `parseArgs` read with `PLAYERS_ARGS`; undefined for the map's own. */
export function playersOf(
  values: Readonly<Record<string, unknown>>,
): number | undefined {
  const value = values[PLAYERS_OPTION];
  return parsePlayers(typeof value === "string" ? value : undefined);
}

/** The players of the command line's option: one of `SUPPORTED_PLAYERS`, or undefined for the map's own. */
export function parsePlayers(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const players = SUPPORTED_PLAYERS.find((n) => String(n) === value);
  if (players === undefined) {
    throw new AuthorError(
      `--${PLAYERS_OPTION} is "${value}": it takes ${SUPPORTED_PLAYERS.join(", ")}, the map's one slot and one more, the case of #1040.`,
    );
  }
  return players;
}

/** What a build's line adds for its players: nothing when it keeps the map's own. */
export function playersMessage(players: number | undefined): string {
  return players === undefined ? "" : ` with ${String(players)} player slots`;
}

/**
 * The key of the players in a Result file's `BEGIN` line, which the runner
 * writes only when the build set them.
 */
export const PLAYERS_BEGIN_KEY = "players";

/**
 * The players `value` holds, a `BEGIN` line's field or a state file's:
 * undefined for none, or for a number the runner does not stage, so the
 * line of an older runner, or an older state file, gives none.
 */
export function playersFrom(value: unknown): number | undefined {
  return SUPPORTED_PLAYERS.find((n) => n === value || String(n) === value);
}

/** The line `probe:read` prints for the players a run's build staged; undefined when it kept the map's own. */
export function playersLine(players: number | undefined): string | undefined {
  return players === undefined
    ? undefined
    : `Players: ${String(players)} user slots, staged by the build; the map folder's own has 1`;
}

/** One player record of `war3map.w3i`, as the runner reads it. */
export interface PlayerSlot {
  /** The player's number, 0 for Player 1. */
  player: number;
  /** Whether the slot is a user's (controller 1), not a computer's or a neutral one. */
  user: boolean;
  /** The start location's coordinates. */
  x: number;
  y: number;
  /** The index of the first force whose mask holds the player; undefined for none. */
  force: number | undefined;
}

/** The format the runner reads, the World Editor of 3.0's. */
const FORMAT = 39;
/** The controller of a user slot. */
const USER = 1;

/** The player slots a `war3map.w3i` declares, in the order of its records. */
export function readPlayers(w3i: Uint8Array): PlayerSlot[] {
  const { players, forces } = locate(w3i);
  return players.map((record) => ({
    player: record.player,
    user: record.controller === USER,
    x: record.x,
    y: record.y,
    force: forceOf(forces, record.player),
  }));
}

/**
 * A copy of `w3i` declaring `players` user slots, one of
 * `SUPPORTED_PLAYERS`: the first record copied for the second, with its
 * number, the name `Player 2` and a start of its own, both in the force;
 * every byte before and after the tables unchanged. The map's own tables
 * are read first, and the step writes only over what it knows: one
 * record, Player 1's, a user slot, and one force.
 */
export function writePlayers(w3i: Uint8Array, players: number): Uint8Array {
  if (players !== 2) {
    throw new AuthorError(
      `The runner stages ${SUPPORTED_PLAYERS.join(", ")} players, not ${String(players)}.`,
    );
  }
  const tables = locate(w3i);
  if (tables.players.length !== 1) {
    throw new AuthorError(
      `war3map.w3i declares ${String(tables.players.length)} player records: the runner adds players to a map of one, the Template's.`,
    );
  }
  const [first] = tables.players;
  if (first.player !== 0 || first.controller !== USER) {
    throw new AuthorError(
      `war3map.w3i declares player ${String(first.player)} with the controller ${String(first.controller)}: the runner adds players to a map whose one record is Player 1, a user slot.`,
    );
  }
  if (tables.forces.length !== 1) {
    throw new AuthorError(
      `war3map.w3i declares ${String(tables.forces.length)} forces: the runner adds players to a map of one force, the Template's.`,
    );
  }
  const [force] = tables.forces;

  const records = [
    w3i.subarray(first.start, first.end),
    copyRecord(w3i, first, 1, mirroredStart(tables, first)),
  ];
  const forceTable = copyOf(w3i, tables.forcesStart, tables.tablesEnd);
  const maskOffset = force.maskOffset - tables.forcesStart;
  const mask = (force.mask | ((1 << players) - 1)) >>> 0;
  new DataView(forceTable.buffer).setUint32(maskOffset, mask, true);

  const count = new Uint8Array(4);
  new DataView(count.buffer).setInt32(0, players, true);
  return concat([
    w3i.subarray(0, tables.tablesStart),
    count,
    ...records,
    forceTable,
    w3i.subarray(tables.tablesEnd),
  ]);
}

/**
 * A copy of the editor script `script` configuring the user slots
 * `slots`, as `readPlayers` reads them from the staged `war3map.w3i`: its
 * `config` gets `SetPlayers`, a `DefineStartLocation` and a
 * `SetPlayerSlotAvailable(…, MAP_CONTROL_USER)` for each, and
 * `InitCustomPlayerSlots` and `InitCustomTeams` Player 1's lines again for
 * each new player; every other line unchanged. The script is read first,
 * and the step writes only over what it knows: a `config` of Player 1
 * alone, at the start the file declares.
 */
export function writePlayersScript(
  script: Uint8Array,
  slots: readonly PlayerSlot[],
): Uint8Array {
  const text = Buffer.from(script).toString("latin1");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(eol);
  const [first, ...added] = slots;
  if (slots.length === 0 || first.player !== 0) {
    throw new Error("The slots to script start with Player 1.");
  }
  const refuse = (line: string, why: string) =>
    new AuthorError(
      `war3map.lua holds \`${line}\` ${why}: the runner adds players to a script of Player 1 alone, the Template's.`,
    );
  const copies = (line: string) =>
    added.map(({ player }) =>
      line
        .replaceAll("Player(0)", `Player(${String(player)})`)
        .replace(
          `SetPlayerStartLocation(Player(${String(player)}), 0)`,
          `SetPlayerStartLocation(Player(${String(player)}), ${String(player)})`,
        )
        .replace(
          "ConvertPlayerColor(0)",
          `ConvertPlayerColor(${String(player)})`,
        ),
    );

  const out: string[] = [];
  const seen = { players: 0, start: 0, available: 0 };
  let inside: "slots" | "teams" | "config" | undefined;
  /** Player 1's lines of the function `inside`, copied before its `end`. */
  let ownLines: string[] = [];
  for (const line of lines) {
    if (inside === undefined) {
      out.push(line);
      inside = FUNCTIONS.get(line);
      ownLines = [];
      continue;
    }
    if (line === "end") {
      if (inside !== "config") {
        for (const own of ownLines) out.push(...copies(own));
      }
      out.push(line);
      inside = undefined;
      continue;
    }
    const named = /\bPlayer\((\d+)\)/.exec(line);
    if (named !== null && named[1] !== "0") {
      throw refuse(line, "for another player than Player 1");
    }
    out.push(line);
    if (inside !== "config") {
      if (named !== null) ownLines.push(line);
      continue;
    }
    const players = /^SetPlayers\((\d+)\)$/.exec(line);
    if (players !== null) {
      seen.players++;
      if (players[1] !== "1") throw refuse(line, "for another number than 1");
      out[out.length - 1] = `SetPlayers(${String(slots.length)})`;
    }
    const start = /^DefineStartLocation\((\d+), (\S+), (\S+)\)$/.exec(line);
    if (start !== null) {
      seen.start++;
      if (
        start[1] !== "0" ||
        Number(start[2]) !== first.x ||
        Number(start[3]) !== first.y
      ) {
        throw refuse(
          line,
          `where war3map.w3i declares Player 1's start at (${coordinate(first.x)}, ${coordinate(first.y)})`,
        );
      }
      for (const { player, x, y } of added) {
        out.push(
          `DefineStartLocation(${String(player)}, ${coordinate(x)}, ${coordinate(y)})`,
        );
      }
    }
    if (line === AVAILABLE) {
      seen.available++;
      out.push(...copies(line));
    }
  }
  for (const [what, count] of [
    ["SetPlayers(1)", seen.players],
    ["DefineStartLocation(0, …)", seen.start],
    [AVAILABLE, seen.available],
  ] as const) {
    if (count !== 1) {
      throw new AuthorError(
        `The config of war3map.lua holds ${String(count)} lines \`${what}\`, not one: the runner adds players to a script of Player 1 alone, the Template's.`,
      );
    }
  }
  return Buffer.from(out.join(eol), "latin1");
}

/** The functions of the editor script the step writes in, by their first line. */
const FUNCTIONS: ReadonlyMap<string, "slots" | "teams" | "config"> = new Map([
  ["function InitCustomPlayerSlots()", "slots"],
  ["function InitCustomTeams()", "teams"],
  ["function config()", "config"],
]);

/** The line of `config` that opens Player 1's slot to a user. */
const AVAILABLE = "SetPlayerSlotAvailable(Player(0), MAP_CONTROL_USER)";

/** A coordinate as the World Editor writes it in the script: `-1408.0`. */
function coordinate(value: number): string {
  return Number.isInteger(value) ? value.toFixed(1) : String(value);
}

/**
 * The start of a new player: the second's mirrors the first's through the
 * centre of the camera bounds, so the two stand apart on any map.
 */
function mirroredStart(
  tables: Tables,
  first: PlayerRecord,
): [x: number, y: number] {
  const { centreX, centreY } = tables;
  return [2 * centreX - first.x, 2 * centreY - first.y];
}

/** `first`'s record with its number, name and start replaced. */
function copyRecord(
  w3i: Uint8Array,
  first: PlayerRecord,
  player: number,
  [x, y]: [number, number],
): Uint8Array {
  const name = new TextEncoder().encode(`Player ${String(player + 1)}\0`);
  const head = copyOf(w3i, first.start, first.nameStart);
  new DataView(head.buffer).setInt32(0, player, true);
  const tail = copyOf(w3i, first.nameEnd, first.end);
  const view = new DataView(tail.buffer);
  view.setFloat32(0, x, true);
  view.setFloat32(4, y, true);
  return concat([head, name, tail]);
}

/**
 * A copy of `bytes` from `start` to `end`, in a buffer of its own: `slice`
 * of a Buffer would share the caller's bytes.
 */
function copyOf(bytes: Uint8Array, start: number, end: number): Uint8Array {
  return new Uint8Array(bytes.subarray(start, end));
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(
    parts.reduce((length, part) => length + part.byteLength, 0),
  );
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}

function forceOf(
  forces: readonly ForceRecord[],
  player: number,
): number | undefined {
  const index = forces.findIndex(
    (force) => player < 32 && ((force.mask >>> player) & 1) === 1,
  );
  return index === -1 ? undefined : index;
}

interface PlayerRecord {
  /** The record's offset in the file. */
  start: number;
  /** The offset of its name, and of the byte past its name's null. */
  nameStart: number;
  nameEnd: number;
  /** The offset past the record. */
  end: number;
  player: number;
  controller: number;
  x: number;
  y: number;
}

interface ForceRecord {
  /** The offset of its player mask. */
  maskOffset: number;
  mask: number;
}

interface Tables {
  /** The centre of the camera bounds. */
  centreX: number;
  centreY: number;
  /** The offset of the player count, where the tables start. */
  tablesStart: number;
  players: PlayerRecord[];
  /** The offset of the force count. */
  forcesStart: number;
  forces: ForceRecord[];
  /** The offset past the force table: what follows is kept as it is. */
  tablesEnd: number;
}

/**
 * The player and force tables, read through every field of the file, from
 * its format to its last byte: a file that ends early or holds more is
 * not of the layout the runner reads.
 */
function locate(w3i: Uint8Array): Tables {
  const view = new DataView(w3i.buffer, w3i.byteOffset, w3i.byteLength);
  let offset = 0;
  const skip = (bytes: number): number => {
    if (offset + bytes > w3i.byteLength) {
      throw new AuthorError(
        "war3map.w3i ends before its last table: the file is cut short.",
      );
    }
    const start = offset;
    offset += bytes;
    return start;
  };
  const int32 = () => view.getInt32(skip(4), true);
  const float32 = () => view.getFloat32(skip(4), true);
  const string = (): [start: number, end: number] => {
    const start = offset;
    const end = w3i.indexOf(0, offset);
    if (end === -1) skip(w3i.byteLength - offset + 1);
    offset = end + 1;
    return [start, offset];
  };
  const strings = (count: number) => {
    for (let i = 0; i < count; i++) string();
  };
  const count = (table: string) => {
    const value = int32();
    if (value < 0) {
      throw new AuthorError(
        `war3map.w3i declares ${String(value)} ${table}: the file is not of the layout the runner reads.`,
      );
    }
    return value;
  };

  const format = int32();
  if (format !== FORMAT) {
    throw new AuthorError(
      `war3map.w3i is of format ${String(format)}: the runner sets the players of format ${String(FORMAT)}, the World Editor of 3.0's. Save the map folder with it.`,
    );
  }
  // Saves, editor version, and the game version's four parts.
  skip(4 * 6);
  // Name, author, description, recommended players.
  strings(4);
  // Camera bounds, four corners of two floats each; their centre is theirs.
  let centreX = 0;
  let centreY = 0;
  for (let corner = 0; corner < 4; corner++) {
    centreX += float32() / 4;
    centreY += float32() / 4;
  }
  // Their complements (4 integers), playable width and height, the flags,
  // the main tileset (1 byte).
  skip(4 * 4 + 4 * 2 + 4 + 1);
  // The loading screen's number and crest race, then its model, text,
  // title and subtitle.
  skip(8);
  strings(4);
  // The Game Data Set, then the prologue's model, text, title and subtitle.
  skip(4);
  strings(4);
  // Fog type, start, end and density, its colour (4 bytes), then fog style,
  // over sky, linear start and end, maximum opacity and height, the weather.
  skip(4 * 4 + 4 + 4 * 6 + 4);
  // The sound environment, the light tileset (1 byte), the water colour (4
  // bytes), the script language, the supported modes, the Game Data
  // Version, the three camera zooms and the ten water fields.
  string();
  skip(1 + 4 + 4 + 4 + 4 + 4 * 3 + 4 * 10);

  const tablesStart = offset;
  const players: PlayerRecord[] = [];
  for (let i = count("player records"); i > 0; i--) {
    const start = offset;
    const player = int32();
    const controller = int32();
    // Race, HUD skin, fixed start.
    skip(4 * 3);
    const [nameStart, nameEnd] = string();
    const x = float32();
    const y = float32();
    // Ally low and high priorities, enemy low and high priorities.
    skip(4 * 4);
    players.push({
      start,
      nameStart,
      nameEnd,
      end: offset,
      player,
      controller,
      x,
      y,
    });
  }
  const forcesStart = offset;
  const forces: ForceRecord[] = [];
  for (let i = count("forces"); i > 0; i--) {
    // The force's flags, then its player mask and name.
    skip(4);
    const maskOffset = offset;
    const mask = view.getUint32(skip(4), true);
    string();
    forces.push({ maskOffset, mask });
  }
  const tablesEnd = offset;

  // Upgrade availabilities: players, id, level, availability.
  skip(count("upgrade availabilities") * 4 * 4);
  // Tech availabilities: players, id.
  skip(count("tech availabilities") * 4 * 2);
  // Random unit tables: number, name, position types, then per set its
  // chance and one id per position.
  for (let i = count("random unit tables"); i > 0; i--) {
    skip(4);
    string();
    const positions = count("positions");
    skip(positions * 4);
    skip(count("unit sets") * 4 * (1 + positions));
  }
  // Random item tables: number, name, then per set its items' chance and id.
  for (let i = count("random item tables"); i > 0; i--) {
    skip(4);
    string();
    for (let set = count("item sets"); set > 0; set--) {
      skip(count("items") * 4 * 2);
    }
  }
  if (offset !== w3i.byteLength) {
    throw new AuthorError(
      `war3map.w3i holds ${String(w3i.byteLength - offset)} bytes past its last table: the file is not of the layout the runner reads.`,
    );
  }
  return {
    centreX,
    centreY,
    tablesStart,
    players,
    forcesStart,
    forces,
    tablesEnd,
  };
}
