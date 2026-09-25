/** @noSelfInFile */

// UnitEvents.loaded and UnitEvents.loadedOf(unit) through on(), and the
// lookups they read the loaded unit and the transport with: the suites of
// support/events.ts, which fire the Subscription's Trigger with a stubbed
// context and observe the call log and what the handler received.

import { MapPlayer, Unit, UnitEvents } from "../../src/index";
import { defined } from "../support/defined";
import {
  describeDescriptor,
  describeLookup,
  everySlot,
} from "../support/events";
import { handleRef } from "../support/handle-ref";

const owner = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const loaded = Unit.create(owner, FourCC("hfoo"), 0, 0);
const transport = Unit.create(owner, FourCC("hgry"), 0, 0);

describeDescriptor({
  name: "UnitEvents.loaded",
  descriptor: UnitEvents.loaded,
  registers: (trigger) =>
    everySlot(
      (player) =>
        `TriggerRegisterPlayerUnitEvent(${trigger}, ${player}, EVENT_PLAYER_UNIT_LOADED, nil)`,
    ),
  context: { GetLoadedUnit: loaded.handle, GetTransportUnit: transport.handle },
  payload: { unit: loaded, transport },
  required: [
    ["unit", "GetLoadedUnit"],
    ["transport", "GetTransportUnit"],
  ],
});

describeDescriptor({
  name: "UnitEvents.loadedOf",
  descriptor: UnitEvents.loadedOf(loaded),
  registers: (trigger) => [
    `TriggerRegisterUnitEvent(${trigger}, ${handleRef("unit", loaded.handle)}, EVENT_UNIT_LOADED)`,
  ],
  context: { GetTransportUnit: transport.handle },
  payload: { unit: loaded, transport },
  required: [["transport", "GetTransportUnit"]],
});

describeLookup({
  name: "Unit.fromLoaded",
  lookup: () => Unit.fromLoaded(),
  context: { GetLoadedUnit: loaded.handle },
  expected: loaded,
});

describeLookup({
  name: "Unit.fromTransport",
  lookup: () => Unit.fromTransport(),
  context: { GetTransportUnit: transport.handle },
  expected: transport,
});
