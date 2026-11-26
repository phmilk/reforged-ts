// What the game matches a chat message against, for a Trigger registered
// with `TriggerRegisterPlayerChatEvent` (#952, for the chat stub and
// `game.chat` of #939): upper and lower case, an empty filter, what the two
// event responses answer, and how often a Trigger with two matching
// registrations fires. No Native sends a chat message, so the messages are
// typed into the game's window while the run is held: the Probe registers
// everything, checkpoints, and records every fire until the message `-done`
// or its time limit. Every FIRE record carries `order`, a counter over the
// whole run, so the order of the Triggers one message fires reads too.

import type { ProbeContext } from "../game/probe";

/** How long the run waits for `-done`, in seconds of game time. */
const TIME_LIMIT = 400;

/** The seconds between two checkpoints, well within the stall timeout. */
const TICK = 10;

export function run(p: ProbeContext): void {
  p.hold();

  const typist = Player(0)!;
  let order = 0;
  let done = false;

  /** A Trigger of the given name, with one chat registration per filter. */
  function listen(
    name: string,
    who: player,
    filters: readonly (readonly [string, boolean])[],
  ): void {
    const trigger = CreateTrigger();
    for (const [filter, exact] of filters) {
      TriggerRegisterPlayerChatEvent(trigger, who, filter, exact);
    }
    TriggerAddAction(trigger, () => {
      if (done) {
        return;
      }
      order++;
      p.record("FIRE", {
        order,
        trigger: name,
        message: GetEventPlayerChatString() ?? "<nil>",
        matched: GetEventPlayerChatStringMatched() ?? "<nil>",
        player: GetPlayerId(GetTriggerPlayer()!),
        eventId: GetHandleId(GetTriggerEventId()!),
        execCount: GetTriggerExecCount(trigger),
      });
    });
    p.record("LISTEN", {
      trigger: name,
      player: GetPlayerId(who),
      registrations: filters
        .map(([filter, exact]) => `[${filter}]${exact ? "exact" : "substring"}`)
        .join("+"),
    });
  }

  // Case, with `exactMatchOnly` true and false.
  listen("exact-lower", typist, [["-hello", true]]);
  listen("exact-upper", typist, [["-HELLO", true]]);
  listen("sub-lower", typist, [["-hello", false]]);
  listen("sub-upper", typist, [["-HELLO", false]]);

  // Where a substring may sit, and an exact filter of two words.
  listen("sub-middle", typist, [["ell", false]]);
  listen("sub-tail", typist, [["world", false]]);
  listen("exact-two-words", typist, [["-hello world", true]]);

  // An empty filter.
  listen("empty-exact", typist, [["", true]]);
  listen("empty-sub", typist, [["", false]]);

  // Another player's registration: the typist's messages are not theirs.
  listen("other-player", Player(1)!, [["", false]]);

  // Two registrations of one Trigger that match the same message.
  listen("double-same", typist, [
    ["-hello", false],
    ["-hello", false],
  ]);
  listen("double-different", typist, [
    ["-hello", false],
    ["ell", false],
  ]);
  listen("double-exact-and-sub", typist, [
    ["-hello", true],
    ["-hello", false],
  ]);
  listen("double-empty-and-sub", typist, [
    ["", false],
    ["ell", false],
  ]);

  // The order of the fires of one message: two Triggers registered in the
  // opposite order of their creation, then two whose registrations alternate.
  function bare(name: string): trigger {
    const trigger = CreateTrigger();
    TriggerAddAction(trigger, () => {
      if (done) {
        return;
      }
      order++;
      p.record("FIRE", {
        order,
        trigger: name,
        message: GetEventPlayerChatString() ?? "<nil>",
        matched: GetEventPlayerChatStringMatched() ?? "<nil>",
        player: GetPlayerId(GetTriggerPlayer()!),
        eventId: GetHandleId(GetTriggerEventId()!),
        execCount: GetTriggerExecCount(trigger),
      });
    });
    return trigger;
  }
  const createdFirst = bare("created-first-registered-second");
  const createdSecond = bare("created-second-registered-first");
  TriggerRegisterPlayerChatEvent(createdSecond, typist, "zz", false);
  TriggerRegisterPlayerChatEvent(createdFirst, typist, "zz", false);
  const alternateA = bare("alternate-a");
  const alternateB = bare("alternate-b");
  TriggerRegisterPlayerChatEvent(alternateA, typist, "qq", false);
  TriggerRegisterPlayerChatEvent(alternateB, typist, "qq", false);
  TriggerRegisterPlayerChatEvent(alternateA, typist, "q", false);
  p.record("MARK", {
    step: "event-id",
    chat: GetHandleId(EVENT_PLAYER_CHAT),
  });

  // Whether the Native that displays a chat message fires the event.
  p.record("MARK", { step: "before-BlzDisplayChatMessage" });
  BlzDisplayChatMessage(typist, 0, "-hello");
  p.record("MARK", { step: "after-BlzDisplayChatMessage" });

  const end = CreateTrigger();
  TriggerRegisterPlayerChatEvent(end, typist, "-done", true);
  TriggerAddAction(end, () => {
    if (done) {
      return;
    }
    done = true;
    p.record("MARK", { step: "done-typed" });
    p.finish();
  });

  let waited = 0;
  function tick(): void {
    if (done) {
      return;
    }
    waited += TICK;
    if (waited >= TIME_LIMIT) {
      done = true;
      p.record("MARK", { step: "time-limit" });
      p.finish();
      return;
    }
    p.record("TICK", { waited, fires: order });
    p.checkpoint();
    p.after(TICK, tick);
  }

  p.record("MARK", { step: "ready" });
  p.checkpoint();
  p.after(TICK, tick);
}
