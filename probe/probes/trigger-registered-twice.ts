// Whether a Trigger registered twice for the same event and subject runs
// twice on one event, for the Event dispatch of `reforged-test` (#981),
// which fires a Trigger once per matching registration.
//
// Each case registers the Trigger `twice`, then the Trigger `between` once,
// then `twice` again, all for one event and one subject, and fires the event
// once. It records the order the conditions and actions ran in, and what
// `GetTriggerEvalCount` and `GetTriggerExecCount` answer for `twice`.
//
// - The cases of a Native that fires its event inside the call
//   (`docs/research/unit-event-timing.md`) are read on the line after it:
//   `KillUnit` for the death events, `UnitDamageTarget` for the damage
//   events.
// - A timer event, a sync event and two player events are read later: the
//   three registrations of the timer event share one timeout, and the player
//   events are tried with `ForceUICancel` and `RemovePlayer`, which may fire
//   nothing.
// - The filter cases measure one registration each, with a filter that
//   answers `true`, one that answers `false` and none: how often the filter
//   ran, and whether its Trigger did. They were added because no filter ran
//   in the cases above.

import type { ProbeContext } from "../game/probe";

/** A case's two Triggers, and the log they write. */
interface Case {
  readonly label: string;
  readonly log: string[];
  readonly twice: trigger;
  readonly between: trigger;
  /** How often the filters of the registrations ran; 0 without a filter. */
  filters: number;
}

/**
 * What a case's filter answers, or none for a registration without one. A
 * list of these holds no `undefined`, which would end a Lua array.
 */
type Answer = "true" | "false" | "none";
const ANSWERS: readonly Answer[] = ["true", "false", "none"];

/** How many entries of `log` are `entry`. */
function count(log: readonly string[], entry: string): number {
  let found = 0;
  for (const line of log) {
    if (line === entry) found += 1;
  }
  return found;
}

export function run(p: ProbeContext): void {
  p.hold();

  /** A Trigger whose condition and action write `name` to `log`. */
  function watched(log: string[], name: string): trigger {
    const self = CreateTrigger();
    TriggerAddCondition(
      self,
      Condition(() => {
        log.push(`${name}:condition`);
        return true;
      }),
    );
    TriggerAddAction(self, () => {
      log.push(`${name}:action`);
    });
    return self;
  }

  /**
   * Registers `twice`, `between`, then `twice` again with `register`, which
   * receives the case so a filter can count its runs.
   */
  function registered(
    label: string,
    register: (whichTrigger: trigger, registering: Case) => void,
  ): Case {
    const log: string[] = [];
    const registering: Case = {
      label,
      log,
      twice: watched(log, "twice"),
      between: watched(log, "between"),
      filters: 0,
    };
    register(registering.twice, registering);
    register(registering.between, registering);
    register(registering.twice, registering);
    return registering;
  }

  /** Records what ran of a case, then destroys its Triggers. */
  function read(measured: Case): void {
    const { log } = measured;
    p.record("CASE", {
      label: measured.label,
      order: log.join(","),
      twiceConditions: count(log, "twice:condition"),
      twiceActions: count(log, "twice:action"),
      betweenConditions: count(log, "between:condition"),
      betweenActions: count(log, "between:action"),
      twiceEvalCount: GetTriggerEvalCount(measured.twice),
      twiceExecCount: GetTriggerExecCount(measured.twice),
      filters: measured.filters,
    });
    DestroyTrigger(measured.twice);
    DestroyTrigger(measured.between);
    p.checkpoint();
  }

  /** A case whose event `fire` fires inside its call. */
  function synchronous(
    label: string,
    register: (whichTrigger: trigger, registering: Case) => void,
    fire: () => void,
  ): void {
    p.pending(label);
    const measured = registered(label, register);
    fire();
    read(measured);
  }

  function slot(index: number): player {
    const found = Player(index);
    if (found === undefined) error("Player returned nothing", 0);
    return found;
  }
  const owner = slot(0);
  function footman(): unit {
    const created = CreateUnit(owner, FourCC("hfoo"), 0, 0, 0);
    if (created === undefined) error("CreateUnit returned nothing", 0);
    return created;
  }
  function damage(target: unit): void {
    UnitDamageTarget(
      attacker,
      target,
      10,
      true,
      false,
      ATTACK_TYPE_NORMAL,
      DAMAGE_TYPE_NORMAL,
      WEAPON_TYPE_WHOKNOWS,
    );
  }
  const attacker = footman();

  // The death events, fired by KillUnit.
  synchronous(
    "TriggerRegisterPlayerUnitEvent EVENT_PLAYER_UNIT_DEATH",
    (whichTrigger) => {
      TriggerRegisterPlayerUnitEvent(
        whichTrigger,
        owner,
        EVENT_PLAYER_UNIT_DEATH,
        undefined,
      );
    },
    () => {
      KillUnit(footman());
    },
  );
  synchronous(
    "TriggerRegisterPlayerUnitEvent EVENT_PLAYER_UNIT_DEATH, each with a filter",
    (whichTrigger, registering) => {
      TriggerRegisterPlayerUnitEvent(
        whichTrigger,
        owner,
        EVENT_PLAYER_UNIT_DEATH,
        Filter(() => {
          registering.filters += 1;
          return true;
        }),
      );
    },
    () => {
      KillUnit(footman());
    },
  );
  const dying = footman();
  synchronous(
    "TriggerRegisterUnitEvent EVENT_UNIT_DEATH",
    (whichTrigger) => {
      TriggerRegisterUnitEvent(whichTrigger, dying, EVENT_UNIT_DEATH);
    },
    () => {
      KillUnit(dying);
    },
  );
  const filtered = footman();
  synchronous(
    "TriggerRegisterFilterUnitEvent EVENT_UNIT_DEATH, each with a filter",
    (whichTrigger, registering) => {
      TriggerRegisterFilterUnitEvent(
        whichTrigger,
        filtered,
        EVENT_UNIT_DEATH,
        Filter(() => {
          registering.filters += 1;
          return true;
        }),
      );
    },
    () => {
      KillUnit(filtered);
    },
  );
  const widget = footman();
  synchronous(
    "TriggerRegisterDeathEvent",
    (whichTrigger) => {
      TriggerRegisterDeathEvent(whichTrigger, widget);
    },
    () => {
      KillUnit(widget);
    },
  );

  // The damage events, fired by UnitDamageTarget: 10 of a footman's 420 life.
  const damaged = footman();
  synchronous(
    "TriggerRegisterUnitEvent EVENT_UNIT_DAMAGED",
    (whichTrigger) => {
      TriggerRegisterUnitEvent(whichTrigger, damaged, EVENT_UNIT_DAMAGED);
    },
    () => {
      damage(damaged);
    },
  );
  synchronous(
    "TriggerRegisterPlayerUnitEvent EVENT_PLAYER_UNIT_DAMAGED",
    (whichTrigger) => {
      TriggerRegisterPlayerUnitEvent(
        whichTrigger,
        owner,
        EVENT_PLAYER_UNIT_DAMAGED,
        undefined,
      );
    },
    () => {
      damage(damaged);
    },
  );

  // The filters. The two filtered cases above ran no filter, and the one of
  // TriggerRegisterFilterUnitEvent fired nothing, so each kind of filter is
  // measured on one registration: whether it runs, what GetFilterUnit
  // answers in it, and whether its Trigger runs.
  let filterRuns = 0;
  function filterCase(
    label: string,
    answer: Answer,
    register: (whichTrigger: trigger, filter: boolexpr | undefined) => void,
    fire: (target: unit) => void,
  ): void {
    p.pending(label);
    const target = footman();
    let sawTarget = false;
    let conditions = 0;
    let actions = 0;
    const self = CreateTrigger();
    TriggerAddCondition(
      self,
      Condition(() => {
        conditions += 1;
        return true;
      }),
    );
    TriggerAddAction(self, () => {
      actions += 1;
    });
    const filter =
      answer === "none"
        ? undefined
        : Filter(() => {
            filterRuns += 1;
            sawTarget = GetFilterUnit() === target;
            return answer === "true";
          });
    const before = filterRuns;
    register(self, filter);
    fire(target);
    p.record("FILTER", {
      label,
      filter: answer,
      filterRuns: filterRuns - before,
      filterUnitIsTarget: sawTarget,
      conditions,
      actions,
    });
    DestroyTrigger(self);
    p.checkpoint();
  }
  const kill = (target: unit): void => {
    KillUnit(target);
  };
  for (const answer of ANSWERS) {
    filterCase(
      "TriggerRegisterPlayerUnitEvent EVENT_PLAYER_UNIT_DEATH",
      answer,
      (whichTrigger, filter) => {
        TriggerRegisterPlayerUnitEvent(
          whichTrigger,
          owner,
          EVENT_PLAYER_UNIT_DEATH,
          filter,
        );
      },
      kill,
    );
  }
  // The unit a filtered unit event watches is the case's own, known only
  // when it fires: the registration waits for it.
  for (const answer of ANSWERS) {
    for (const [name, event, fire] of [
      ["EVENT_UNIT_DEATH", EVENT_UNIT_DEATH, kill],
      ["EVENT_UNIT_DAMAGED", EVENT_UNIT_DAMAGED, damage],
    ] as const) {
      let pendingTrigger: trigger | undefined;
      let pendingFilter: boolexpr | undefined;
      filterCase(
        `TriggerRegisterFilterUnitEvent ${name}`,
        answer,
        (whichTrigger, filter) => {
          pendingTrigger = whichTrigger;
          pendingFilter = filter;
        },
        (target) => {
          if (pendingTrigger === undefined) error("no trigger to register", 0);
          TriggerRegisterFilterUnitEvent(
            pendingTrigger,
            target,
            event,
            pendingFilter,
          );
          fire(target);
        },
      );
    }
  }

  // A timer event: the three registrations expire at the same instant.
  const timerEvent = registered(
    "TriggerRegisterTimerEvent, one timeout",
    (whichTrigger) => {
      TriggerRegisterTimerEvent(whichTrigger, 1, false);
    },
  );

  // A sync event: one packet of the local player, the only one.
  const sync = registered(
    "BlzTriggerRegisterPlayerSyncEvent",
    (whichTrigger) => {
      BlzTriggerRegisterPlayerSyncEvent(whichTrigger, owner, "twice", false);
    },
  );
  const sent = BlzSendSyncData("twice", "data");
  p.record("STEP", { name: "BlzSendSyncData", returned: sent });
  p.checkpoint();

  p.after(2, () => {
    read(timerEvent);
    read(sync);

    // The player events: no Native is known to fire one, so two are tried,
    // and a case with no run measures nothing.
    p.pending("the player events");
    const endCinematic = registered(
      "TriggerRegisterPlayerEvent EVENT_PLAYER_END_CINEMATIC, ForceUICancel",
      (whichTrigger) => {
        TriggerRegisterPlayerEvent(
          whichTrigger,
          owner,
          EVENT_PLAYER_END_CINEMATIC,
        );
      },
    );
    const other = slot(1);
    const defeat = registered(
      "TriggerRegisterPlayerEvent EVENT_PLAYER_DEFEAT, RemovePlayer",
      (whichTrigger) => {
        TriggerRegisterPlayerEvent(whichTrigger, other, EVENT_PLAYER_DEFEAT);
      },
    );
    p.record("STEP", {
      name: "the other player",
      slotIsPlaying: GetPlayerSlotState(other) === PLAYER_SLOT_STATE_PLAYING,
      controllerIsComputer: GetPlayerController(other) === MAP_CONTROL_COMPUTER,
    });
    p.checkpoint();
    ForceUICancel();
    RemovePlayer(other, PLAYER_GAME_RESULT_DEFEAT);

    p.after(2, () => {
      read(endCinematic);
      read(defeat);
      // A filter that ran after its case was read would show here.
      p.record("STEP", { name: "the filters, at the end", filterRuns });
      p.finish();
    });
  });
}
