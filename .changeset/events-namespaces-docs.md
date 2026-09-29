---
"reforged-ts": patch
---

Document the events namespaces member by member. `UnitEvents`, `PlayerEvents`, `DialogEvents`, `FrameEvents`, `RegionEvents`, `TimerEvents` and `TrackableEvents` show on the docs site as namespaces, each member with its summary and `@native` tags, instead of a variable of a computed type. Each `UnitEvents` twin (`attackedOf(unit)`, `deathOf(unit)` and the others) now has a doc comment of its own, with its `@native TriggerRegisterUnitEvent`, in the editor hover as on the site, and the fields of every `UnitEvents` payload are documented. The members, their registrations and their payloads are unchanged.
