// The player-leave Probe's bundle, as probe:build compiles it with the
// bridge fixtures' runId, run on the harness with the shipped stubs: the
// label a `teste <name>` chat message gives the run, and the Result file
// it renames. The tests share one Lua state and run in order.

import { describe, expect, it } from "reforged-test/lua";
import { loadBundle, startedTimer } from "./bundle";

/** The Result file of a run without a label, under CustomMapData. */
const UNLABELLED_FILE = "reforged-ts\\probes\\player-leave.txt";

/** The label of the message the tests type, reduced and cut at 32 characters. */
const LABEL = "menu-sa-da--abcdefghijklmnopqrst";

/** The Result file of the run the tests label. */
const LABELLED_FILE = `reforged-ts\\probes\\player-leave-${LABEL}.txt`;

/** The line the Probe shows at its start. */
const ASK =
  "Para nomear este teste, digite no chat: teste <nome> (letras, números ou -). Sem nome, o resultado vai para player-leave.txt.";

function slot(index: number): player {
  const found = Player(index);
  if (found === undefined) error("Player returned nothing", 0);
  return found;
}

/** The messages shown so far, from the `from`th on. */
function shown(from: number): string[] {
  return __stub_displayed()
    .slice(from)
    .map(({ text }) => text);
}

/** The lines of a Result file, or an empty list for one never written. */
function lines(file: string): string[] {
  return __stub_preload_file(file) ?? [];
}

/**
 * Gives the event constants the Probe keys by `GetHandleId` an id each:
 * the shipped stubs' constants carry none, and a Map refuses a nil key.
 */
function giveEventIds(): void {
  const events = [
    EVENT_PLAYER_LEAVE,
    EVENT_PLAYER_DEFEAT,
    EVENT_PLAYER_VICTORY,
    EVENT_PLAYER_UNIT_SELECTED,
    EVENT_PLAYER_UNIT_DESELECTED,
  ];
  events.forEach((event, index) => {
    (event as unknown as { __handleId: number }).__handleId = 9000 + index;
  });
}

/**
 * Stubs the start location Natives the Probe places its Footmen with, which
 * the shipped stubs leave out: each player starts at the location of its
 * slot's number, at (0, 0).
 */
function stubStartLocations(): void {
  __stub_define("GetPlayerStartLocation", (who: player) => {
    __stub_record("GetPlayerStartLocation", who);
    return GetPlayerId(who);
  });
  __stub_define("GetStartLocationX", (location: number) => {
    __stub_record("GetStartLocationX", location);
    return 0;
  });
  __stub_define("GetStartLocationY", (location: number) => {
    __stub_record("GetStartLocationY", location);
    return 0;
  });
}

let unlabelledAtLabel: string[] = [];

describe("the player-leave Probe's bundle", () => {
  it("asks for a label at its start, in Portuguese, and writes player-leave.txt", () => {
    giveEventIds();
    stubStartLocations();
    loadBundle("player-leave");
    __stub_fire_timer(startedTimer(0));
    expect(shown(0)).toContain(ASK);
    expect(lines(UNLABELLED_FILE)[0]).toMatch("BEGIN");
    expect(lines(UNLABELLED_FILE).at(-1)).toEqual(
      `${String(lines(UNLABELLED_FILE).length)} CHECKPOINT`,
    );
    expect(lines(UNLABELLED_FILE).some((line) => line.includes(" READ "))).toBe(
      true,
    );
  });

  it("refuses an empty name on screen, and takes no label", () => {
    const before = __stub_displayed().length;
    __stub_dispatch_chat(slot(0), "teste    ");
    expect(shown(before)).toEqual([
      "Nome vazio recusado: digite teste <nome>, com letras, números ou -.",
    ]);
  });

  it("ignores a message that holds the prefix past its start", () => {
    const before = __stub_displayed().length;
    __stub_dispatch_chat(slot(0), "um teste aqui");
    expect(shown(before)).toEqual([]);
  });

  it("takes the label of the first name, reduced to a-z, 0-9 and - and cut at 32 characters, and confirms it", () => {
    unlabelledAtLabel = lines(UNLABELLED_FILE);
    const before = __stub_displayed().length;
    __stub_dispatch_chat(
      slot(1),
      "Teste   Menu Saída! abcdefghijklmnopqrstuvwxyz0123  ",
    );
    expect(shown(before)).toContain(
      `Teste nomeado: ${LABEL}. O resultado vai para player-leave-${LABEL}.txt.`,
    );
  });

  it("writes every line so far, then LABEL name=<name>, to the labelled file", () => {
    const labelled = lines(LABELLED_FILE);
    const kept = unlabelledAtLabel.slice(0, -1);
    expect(labelled.slice(0, kept.length)).toEqual(kept);
    // LABEL takes the seq of the checkpoint that ended the last write.
    const seq = Number(unlabelledAtLabel.at(-1)?.split(" ")[0]);
    expect(labelled[kept.length]).toEqual(
      `${String(seq)} LABEL name=${LABEL} player=1 t=0.0`,
    );
    expect(labelled[kept.length + 1]).toEqual(`${String(seq + 1)} CHECKPOINT`);
  });

  it("leaves player-leave.txt as it was before the label", () => {
    expect(lines(UNLABELLED_FILE)).toEqual(unlabelledAtLabel);
  });

  it("answers a later label that the run has one, and ignores it", () => {
    const before = __stub_displayed().length;
    __stub_dispatch_chat(slot(0), "teste outro");
    expect(shown(before)).toEqual([
      `O nome deste teste já é ${LABEL}: mensagem ignorada.`,
    ]);
    expect(
      __stub_preload_file("reforged-ts\\probes\\player-leave-outro.txt"),
    ).toBeUndefined();
  });

  it("writes the leave to the labelled file", () => {
    __stub_leave_player(slot(1));
    const labelled = lines(LABELLED_FILE);
    expect(labelled.some((line) => line.includes(" LEAVE "))).toBe(true);
    expect(labelled.filter((line) => line.includes(" LABEL "))).toHaveLength(1);
    expect(lines(UNLABELLED_FILE)).toEqual(unlabelledAtLabel);
  });
});
