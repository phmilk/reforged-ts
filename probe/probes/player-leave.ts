// What a handler reads when a player leaves, for `game.leave` of
// `reforged-test/map` (#984, #1040). Built with `--players 2` and run by two
// clients, the second of which leaves while the run is held:
//
// 1. `EVENT_PLAYER_LEAVE`, one Trigger per player: `GetTriggerPlayer`,
//    `GetTriggerEventId`, and `GetPlayerSlotState` and `GetPlayerController`
//    of each player on the handler's first line; the same read again after
//    the handler's work, at a zero timer, and 1, 2.5 and 5 seconds later.
// 2. `EVENT_PLAYER_DEFEAT` and `EVENT_PLAYER_VICTORY`, one Trigger per
//    player and event: whether either fires, and its order against the
//    leave, by the counter `order` all handlers share.
// 3. The leaver's selection: a Footman of each player, made at its start;
//    `IsUnitSelected` of each for each player and `GroupEnumUnitsSelected`
//    of each player, at each read; and every `EVENT_PLAYER_UNIT_SELECTED`
//    and `EVENT_PLAYER_UNIT_DESELECTED` of each player. The human on the
//    leaving client selects before leaving: the Probe selects nothing.
//
// The runner turns `MeleeInitVictoryDefeat` into a no-op (#348), so this
// measures the bare game, without melee victory and defeat. No record reads
// an async Native, and `t` is the elapsed time of a timer started in `run`,
// game time, so both clients' records agree up to the leave. The run waits
// up to `HOLD_LIMIT` seconds for a leave, recording `no-leave-seen` if none
// comes; after the first leave it reads for 5 seconds, then ends.
//
// A human runs it several times on one map, one way of leaving each, so a
// player names the run in chat, `teste <name>`, before the leave: the
// chat string is synced, so every client takes the same label, records
// `LABEL name=<name>` and from then on writes
// `player-leave-<name>.txt` (`p.rename`), every record so far included.
// The first label taken wins. A run without one writes `player-leave.txt`,
// which also holds the start of every labelled run, up to its label. The
// messages on screen are in Portuguese, for the humans who run it.

import type { ProbeContext } from "../game/probe";

/** How long the run waits for a leave, in seconds of game time. */
const HOLD_LIMIT = 600;

/** What a chat message that names the run starts with, in any case. */
const LABEL_PREFIX = "teste ";

/** The longest label, in characters. */
const LABEL_LIMIT = 32;

/** How long the message at the start, which asks for a label, stays on screen. */
const ASK_SECONDS = 120;

/** How long the answer to a `teste` message stays on screen. */
const ANSWER_SECONDS = 30;

/**
 * The label of a chat message's name: in lower case, each character
 * outside `a` to `z`, `0` to `9` and `-` turned into `-` (the bytes of a
 * UTF-8 character into one), the spaces around it dropped, cut at
 * `LABEL_LIMIT` characters; empty when the name is. Bytes only, no
 * pattern and no percent sign: Lua's `string.lower` changes ASCII alone.
 */
function labelOf(name: string): string {
  const lower = string.lower(name);
  let first = 1;
  let last = lower.length;
  while (first <= last && string.byte(lower, first) === 32) first++;
  while (last >= first && string.byte(lower, last) === 32) last--;
  let label = "";
  for (let index = first; index <= last; index++) {
    const byte = string.byte(lower, index);
    // A UTF-8 continuation byte: its character is already one `-`.
    if (byte >= 128 && byte < 192) continue;
    const kept =
      (byte >= 97 && byte <= 122) || (byte >= 48 && byte <= 57) || byte === 45;
    label += kept ? string.char(byte) : "-";
    if (label.length >= LABEL_LIMIT) break;
  }
  return label;
}

/** The seconds between two reads while the run waits, within the stall timeout. */
const TICK = 10;

/** When the reads after the first leave come, in seconds after it; the last ends the run. */
const AFTER_LEAVE: readonly number[] = [0, 1, 2.5, 5];

export function run(p: ProbeContext): void {
  p.hold();

  function slot(index: number): player {
    const found = Player(index);
    if (found === undefined) error("Player returned nothing", 0);
    return found;
  }
  const first = slot(0);
  const second = slot(1);
  const players: readonly player[] = [first, second];

  /** The game clock both clients share. */
  const clock = CreateTimer();
  TimerStart(clock, 100000, false, () => undefined);
  function now(): number {
    return math.floor(TimerGetElapsed(clock) * 100) / 100;
  }

  let order = 0;
  let leaves = 0;
  let done = false;

  function playerOf(who: player | undefined): string {
    return who === undefined ? "nil" : tostring(GetPlayerId(who));
  }

  const slotStates: readonly (readonly [playerslotstate, string])[] = [
    [PLAYER_SLOT_STATE_EMPTY, "EMPTY"],
    [PLAYER_SLOT_STATE_PLAYING, "PLAYING"],
    [PLAYER_SLOT_STATE_LEFT, "LEFT"],
  ];
  function slotOf(who: player): string {
    const state = GetPlayerSlotState(who);
    for (const [known, name] of slotStates) {
      if (state === known) return name;
    }
    return `id ${tostring(GetHandleId(state))}`;
  }
  const controls: readonly (readonly [mapcontrol, string])[] = [
    [MAP_CONTROL_USER, "USER"],
    [MAP_CONTROL_COMPUTER, "COMPUTER"],
    [MAP_CONTROL_RESCUABLE, "RESCUABLE"],
    [MAP_CONTROL_NEUTRAL, "NEUTRAL"],
    [MAP_CONTROL_CREEP, "CREEP"],
    [MAP_CONTROL_NONE, "NONE"],
  ];
  function controllerOf(who: player): string {
    const control = GetPlayerController(who);
    for (const [known, name] of controls) {
      if (control === known) return name;
    }
    return `id ${tostring(GetHandleId(control))}`;
  }

  const eventNames = new Map<number, string>([
    [GetHandleId(EVENT_PLAYER_LEAVE), "EVENT_PLAYER_LEAVE"],
    [GetHandleId(EVENT_PLAYER_DEFEAT), "EVENT_PLAYER_DEFEAT"],
    [GetHandleId(EVENT_PLAYER_VICTORY), "EVENT_PLAYER_VICTORY"],
    [GetHandleId(EVENT_PLAYER_UNIT_SELECTED), "EVENT_PLAYER_UNIT_SELECTED"],
    [GetHandleId(EVENT_PLAYER_UNIT_DESELECTED), "EVENT_PLAYER_UNIT_DESELECTED"],
  ]);
  function eventOf(event: eventid | undefined): string {
    if (event === undefined) return "nil";
    const id = GetHandleId(event);
    return eventNames.get(id) ?? `id ${tostring(id)}`;
  }

  // A Footman of each player, at its start location.
  const footmen = new Map<unit, string>();
  const footmanList: unit[] = [];
  for (const owner of players) {
    const start = GetPlayerStartLocation(owner);
    const made = CreateUnit(
      owner,
      FourCC("hfoo"),
      GetStartLocationX(start),
      GetStartLocationY(start),
      270,
    );
    if (made === undefined) error("CreateUnit returned nothing", 0);
    footmen.set(made, `footman${playerOf(owner)}`);
    footmanList.push(made);
  }
  function nameOf(which: unit | undefined): string {
    if (which === undefined) return "nil";
    const known = footmen.get(which);
    if (known !== undefined) return known;
    return `other:p${playerOf(GetOwningPlayer(which))}:${tostring(GetUnitTypeId(which))}`;
  }

  /** The count and the units `GroupEnumUnitsSelected` gives a player, in a new group. */
  function selection(who: player): string {
    const into = CreateGroup();
    GroupEnumUnitsSelected(into, who, undefined);
    const found: string[] = [];
    for (let index = 0; index < BlzGroupGetSize(into); index++) {
      found.push(nameOf(BlzGroupUnitAt(into, index)));
    }
    DestroyGroup(into);
    const units = found.length === 0 ? "none" : found.join(",");
    return `${tostring(found.length)}:${units}`;
  }

  /** The Footmen `IsUnitSelected` answers true for, for a player. */
  function selectedFootmen(who: player): string {
    const found: string[] = [];
    for (const which of footmanList) {
      if (IsUnitSelected(which, who)) found.push(nameOf(which));
    }
    return found.length === 0 ? "none" : found.join(",");
  }

  /** A read of both players' slot, controller and selection. */
  function read(label: string): void {
    p.record("READ", {
      label,
      t: now(),
      leaves,
      order,
      slot0: slotOf(first),
      slot1: slotOf(second),
      controller0: controllerOf(first),
      controller1: controllerOf(second),
      isSelected0: selectedFootmen(first),
      isSelected1: selectedFootmen(second),
      enum0: selection(first),
      enum1: selection(second),
    });
  }

  function end(step: string): void {
    if (done) return;
    done = true;
    p.record("MARK", { step, t: now(), leaves, order });
    p.finish();
  }

  /** The reads after the first leave, from the one at `index`, then the end. */
  function afterLeave(index: number, since: number): void {
    const at = AFTER_LEAVE[index];
    p.after(at - since, () => {
      if (done) return;
      read(`after-leave+${tostring(at)}s`);
      p.checkpoint();
      if (index + 1 < AFTER_LEAVE.length) {
        afterLeave(index + 1, at);
      } else {
        end("done");
      }
    });
  }

  function watchLeave(who: player): void {
    const name = `leave-of-p${playerOf(who)}`;
    const self = CreateTrigger();
    TriggerRegisterPlayerEvent(self, who, EVENT_PLAYER_LEAVE);
    TriggerAddAction(self, () => {
      // The handler's first lines: nothing runs before these reads.
      const slot0 = slotOf(first);
      const slot1 = slotOf(second);
      const controller0 = controllerOf(first);
      const controller1 = controllerOf(second);
      if (done) return;
      order++;
      leaves++;
      p.record("LEAVE", {
        order,
        t: now(),
        leaves,
        trigger: name,
        triggerPlayer: playerOf(GetTriggerPlayer()),
        event: eventOf(GetTriggerEventId()),
        slot0,
        slot1,
        controller0,
        controller1,
      });
      read("in-handler-after-work");
      p.checkpoint();
      if (leaves === 1) afterLeave(0, 0);
    });
  }

  function watchOutcome(who: player, event: playerevent, kind: string): void {
    const name = `${kind}-of-p${playerOf(who)}`;
    const self = CreateTrigger();
    TriggerRegisterPlayerEvent(self, who, event);
    TriggerAddAction(self, () => {
      if (done) return;
      order++;
      const subject = GetTriggerPlayer();
      p.record("OUTCOME", {
        order,
        t: now(),
        leaves,
        trigger: name,
        triggerPlayer: playerOf(subject),
        event: eventOf(GetTriggerEventId()),
        slot: subject === undefined ? "nil" : slotOf(subject),
      });
      p.checkpoint();
    });
  }

  function watchSelection(
    who: player,
    event: playerunitevent,
    kind: string,
  ): void {
    const name = `${kind}-of-p${playerOf(who)}`;
    const self = CreateTrigger();
    TriggerRegisterPlayerUnitEvent(self, who, event, undefined);
    TriggerAddAction(self, () => {
      if (done) return;
      order++;
      p.record("SELECTION", {
        order,
        t: now(),
        leaves,
        trigger: name,
        triggerPlayer: playerOf(GetTriggerPlayer()),
        unit: nameOf(GetTriggerUnit()),
        event: eventOf(GetTriggerEventId()),
      });
      p.checkpoint();
    });
  }

  /** The run's label, once a player named the run in chat. */
  let label: string | undefined;

  /**
   * Takes the label of each `teste <name>` message of `who`, the first
   * one only: renames the Result file, records `LABEL` and checkpoints, so
   * the new file holds every record so far.
   */
  function watchLabel(who: player): void {
    const self = CreateTrigger();
    TriggerRegisterPlayerChatEvent(self, who, LABEL_PREFIX, false);
    TriggerAddAction(self, () => {
      // The registration matches the prefix anywhere in the message.
      const message = GetEventPlayerChatString() ?? "";
      const head = string.sub(message, 1, LABEL_PREFIX.length);
      if (string.lower(head) !== LABEL_PREFIX) return;
      if (label !== undefined) {
        p.show(
          `O nome deste teste já é ${label}: mensagem ignorada.`,
          ANSWER_SECONDS,
        );
        return;
      }
      if (done) {
        p.show("O teste já terminou: o nome não foi aplicado.", ANSWER_SECONDS);
        return;
      }
      const name = labelOf(string.sub(message, LABEL_PREFIX.length + 1));
      if (name === "") {
        p.show(
          "Nome vazio recusado: digite teste <nome>, com letras, números ou -.",
          ANSWER_SECONDS,
        );
        return;
      }
      label = name;
      p.rename(name);
      p.record("LABEL", {
        name,
        player: playerOf(GetTriggerPlayer()),
        t: now(),
      });
      p.checkpoint();
      p.show(
        `Teste nomeado: ${name}. O resultado vai para player-leave-${name}.txt.`,
        ANSWER_SECONDS,
      );
    });
  }

  for (const who of players) watchLabel(who);
  for (const who of players) watchLeave(who);
  for (const who of players) {
    watchOutcome(who, EVENT_PLAYER_DEFEAT, "defeat");
    watchOutcome(who, EVENT_PLAYER_VICTORY, "victory");
  }
  for (const who of players) {
    watchSelection(who, EVENT_PLAYER_UNIT_SELECTED, "selected");
    watchSelection(who, EVENT_PLAYER_UNIT_DESELECTED, "deselected");
  }

  p.record("MARK", {
    step: "ready",
    melee:
      "MeleeInitVictoryDefeat is a no-op here (#348): the bare game, no melee victory or defeat",
    holdLimit: HOLD_LIMIT,
  });
  read("start");
  p.checkpoint();
  p.show(
    "Para nomear este teste, digite no chat: teste <nome> (letras, números ou -). Sem nome, o resultado vai para player-leave.txt.",
    ASK_SECONDS,
  );

  let waited = 0;
  function tick(): void {
    if (done || leaves > 0) return;
    waited += TICK;
    if (waited >= HOLD_LIMIT) {
      read("hold-limit");
      end("no-leave-seen");
      return;
    }
    read(`wait+${tostring(waited)}s`);
    p.checkpoint();
    p.after(TICK, tick);
  }
  p.after(TICK, tick);
}
