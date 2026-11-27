---
"reforged-test": minor
---

Four Game actions on the `game` that `startGame()` of `reforged-test/map` returns: `game.chat(player, text)`, `game.select(player, unit)`, `game.deselect(player, unit)` and `game.leave(player)`. Each takes a player and a unit as its Handle or anything with `.handle`, fires what the game fires, with every response the game gives, and returns nothing.

- `game.chat` runs every Trigger whose chat registration of that player matches the message, once per matching registration, in the order the registrations were made, as a Probe run measured the game ([What a chat message matches](https://github.com/phmilk/reforged-ts/blob/master/docs/research/chat-event-matching.md)): a filter matches when it is empty or, both in lower case, equals the message (exact) or is found in it, nothing trimmed. A handler reads the message as given, the registration's filter in lower case and, as `GetTriggerEventId`, the event of id 96, which is not `EVENT_PLAYER_CHAT`, as in the game.
- `game.select` and `game.deselect` write the player's selection and dispatch the player unit event of the player who selects, then the unit's event, as a Probe run measured the game ([What a selection fires and writes](https://github.com/phmilk/reforged-ts/blob/master/docs/research/selection-events.md)). `select` adds and clears nothing; a unit already selected, dead or removed, and a unit that is not selected for `deselect`, are errors.
- `game.leave` writes the slot as `PLAYER_SLOT_STATE_LEFT` and dispatches `EVENT_PLAYER_LEAVE`, with no defeat, no victory and the units kept.
- A player who is not playing, an empty slot or a player who left, is an error for the four.

The Shipped stubs gain what they need, on `reforged-test/lua` too: `TriggerRegisterPlayerChatEvent` remembers its filter, `GetPlayerSlotState` answers `PLAYER_SLOT_STATE_LEFT` for a player who left, and `SelectUnit`, `ClearSelection`, `IsUnitSelected` and `GroupEnumUnitsSelected` have a Stub: the two first write the local player's selection and fire nothing, where they threw as Natives without a Stub. The helpers `__stub_dispatch_chat`, `__stub_select_unit`, `__stub_deselect_unit`, `__stub_selected`, `__stub_leave_player` and `__stub_slot_state` are declared in `reforged-test/stubs`.
