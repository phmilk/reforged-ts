---
"reforged-ts": major
---

A chainable `Trigger` over Wrappers, the `Trackable` Wrapper, Timer handlers that receive their Timer, and Event descriptors with owned Subscriptions.

**The `Trigger` Wrapper.** It stays one to one with the Natives whose first parameter is a trigger, and every input is a Wrapper: `registerTimerExpire(timer: Timer)`, `registerFrameEvent(frame, event)`, `registerTrackableHit(trackable: Trackable)` and `registerTrackableTrack(trackable: Trackable)` join the registrations that already took `Unit`, `MapPlayer`, `Region`, `Dialog`, `DialogButton` and `Widget`. Every registration, `addAction` and `addCondition` return the Trigger, so a Trigger is one chained expression. `addCondition` takes a `boolexpr` or a plain function, and the five filtered registrations take a `boolexpr`, a plain function or nothing. `isRunning()` and `interrupt()` cover `BlzTriggerIsRunning` and `BlzTriggerInterrupt`. `registerAnyUnitEvent` and `registerPlayerMouseEvent` go through Natives instead of Blizzard.j, the latter with the new `MouseEventKind` (`Down`, `Up`, `Move`): the library makes no Blizzard.j call.

**The `Trackable` Wrapper.** `Trackable.create(modelPath, x, y, facing)` throws when the game creates nothing, `Trackable.fromEvent()` is the hit or tracked trackable, and `Trackable.fromHandle` is the base's. The game cannot destroy a trackable, so the class has no `destroy`.

**Timers.** The `start` handler receives the Timer that was started, so a periodic handler pauses or destroys itself without `Timer.fromExpired()`. `Timer.after(timeout, handler)` runs a handler once on a Timer it creates and destroys; `Timer.every(interval, handler)` starts a periodic Timer and returns it to the caller, who owns it.

**Event descriptors and `on()`.** `on(descriptor, handler, when?)` creates one Trigger, lets the descriptor register its event on it, runs `when`, if given, as the trigger's condition and the handler as its action, each with the event's typed payload, and returns a `Subscription` whose `destroy()` destroys that Trigger only. A payload field the event guarantees is typed non-null and raises `reforged-ts: missing <field> in the <event> payload` should the game give nothing; a field the game may leave empty is typed `| undefined`. The first release ships:

- `UnitEvents`: `death`, `attacked`, `damaged` and `damaging` (flagged as damage events), `spellChannel`, `spellCast`, `spellEffect`, `spellFinish`, `spellEndcast`, `orderIssued`, `orderPoint`, `orderTarget`, `orderUnit`, `pickupItem`, `dropItem`, `useItem`, `sellItem`, `pawnItem`, the 3.0.0 `equip` and `unequip`, `trainFinish`, `constructFinish`, `researchFinish`, `upgradeFinish`, `heroLevel`, `heroSkill`, `changeOwner`, `summon`, `selected`, `deselected` and `loaded`, registered for every player's units, each with an `Of(unit)` twin for one Unit (`deathOf(hero)`) except `orderUnit`, whose event the Patch has no unit event for;
- `PlayerEvents`: `chat`, `leave`, `keyDown`, `keyUp`, `mouseDown`, `mouseUp`, `mouseMove`, `syncData`, `allianceChanged`, `victory` and `defeat`;
- `TimerEvents.expired(timer)`, `DialogEvents.click(dialog)` and `buttonClick(button)`, `FrameEvents.of(frame, event)`, `RegionEvents.enter(region, filter?)` and `leave(region, filter?)`, and `TrackableEvents.hit(trackable)` and `track(trackable)`.

Every other event stays reachable through `Trigger`; the package README lists the ones that are not descriptors yet and why.

**Event lookups.** Every response Native a descriptor reads for a Wrapper is also a static lookup on it, `undefined` when the game has nothing: `Unit.fromKilling`, `fromAttacker`, `fromDamageSource`, `fromDamageTarget`, `fromSpellTarget`, `fromOrdered`, `fromOrderTarget`, `fromTrained`, `fromConstructed`, `fromLeveling`, `fromChanging`, `fromSummoning`, `fromSummoned`, `fromTransport`, `fromLoaded`, `fromEntering` and `fromLeaving`; `Item.fromSpellTarget`, `fromSold`, `fromEquipped` and `fromUnequipped`; `Destructable.fromSpellTarget`.

**Removed** (each listed with its replacement in `migration/renames.json`): `Trigger.registerTimerExpireEvent`, `Trigger.triggerRegisterFrameEvent`, `Trigger.registerTrackableHitEvent` and `Trigger.registerTrackableTrackEvent`, and the numeric argument of `Trigger.registerPlayerMouseEvent`.

**Behaviour changes** (detailed in `migration/behaviour-changes.md`):

- the Timer handler receives its Timer, and `Timer.destroy` returns nothing;
- registration, `addAction` and `addCondition` return the Trigger instead of the `event`, `triggeraction` and `triggercondition` handles;
- filter parameters are optional, and `addCondition` takes a plain function without `Condition`;
- `registerAnyUnitEvent` and `registerPlayerMouseEvent` no longer call Blizzard.j;
- `Frame.getEventText()` returns the frame event's text, typed `string | undefined`, instead of its number.
