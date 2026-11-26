---
"reforged-test": minor
---

On `reforged-test/map`, `game.fire(event, context)` fires one event as the game would: every Trigger registered for it runs, in registration order, a disabled or destroyed Trigger skipped and a registration's filter evaluated, with `context` as the Firing context. The subject comes from the context by the event's family (the owner of `GetTriggerUnit`, `GetTriggerUnit`, `GetTriggerPlayer`, or none for a game event); a context without it is an error naming the Native. It is the way to fire any event no Game action covers, a spell among them. The entry point exports the type `FiringContext`. The triggers stub now remembers every registration that names its event, and `__stub_dispatch(event, subject, context)` of `reforged-test/stubs` makes the same Event dispatch on `reforged-test/lua`; `__stub_fire_trigger` is unchanged.
