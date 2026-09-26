---
"reforged-test": minor
---

Slot-state and sync-event stubs, so a test can run a Map project's host scan and sync registration on the harness.

- **`players.lua`** gains `GetPlayerSlotState` and `GetPlayerController`: slots 0 and 1 are playing users, every other slot is empty with no controller. This is state the stubs hold, named in the README, not a game rule.
- **The baseline** gains the constants they answer with, `PLAYER_SLOT_STATE_EMPTY`, `PLAYER_SLOT_STATE_PLAYING`, `PLAYER_SLOT_STATE_LEFT`, `MAP_CONTROL_USER`, `MAP_CONTROL_COMPUTER`, `MAP_CONTROL_RESCUABLE`, `MAP_CONTROL_NEUTRAL`, `MAP_CONTROL_CREEP` and `MAP_CONTROL_NONE`, defined before any library module loads as opaque values compared by identity. `__stub_constant(kind, name)` builds one without taking a handle id, and `__stub_record` renders a constant by its name.
- **`triggers.lua`** gains `BlzTriggerRegisterPlayerSyncEvent`, recorded with the trigger, the player, the prefix and the flag and returning an event handle. The trigger keeps nothing of it beyond the call-log line; sync events never fire on the harness.
