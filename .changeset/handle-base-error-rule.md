---
"reforged-ts": major
---

One Handle base for every Wrapper, one error rule, and no constructors.

**Creation throws, lookup returns `undefined`.** Every member whose Native allocates a new Handle (every `create*`, and `Rectangle.fromPoint`, `Rectangle.getWorldBounds`, `Force.fromPlayer`, `FogModifier.fromRect`, `unit.getPoint()`, `unit.addItemById()`, `cameraSetup.destPoint`, `Camera.eyePoint`, `Camera.targetPoint`) is typed non-null and throws `reforged-ts: failed to create <Wrapper> (<detail>)` at the calling line when the game returns nothing. Every lookup (`fromHandle`, `fromEvent`, `fromEnum`, `fromFilter`, `fromIndex`, `getItemInSlot`, `getParent`, ...) is typed `X | undefined`. `unit.getOwner()` and `MapPlayer.fromLocal()` are typed non-null and throw should the game ever break their invariant.

**Removed** (each listed with its replacement in `migration/renames.json`):

- the deprecated constructor of every Wrapper (`new Unit(...)` is `Unit.create(...)`; `Frame`'s and `Effect`'s overloads map to their `create*` variants by argument shape); constructors are protected and only store the Handle;
- the accessors `Frame.parent`, `Unit.owner` and `Unit.point` (use the get/set pairs);
- `Group.getEnumUnit` and `Group.getFilterUnit` (use `Unit.fromEnum` and `Unit.fromFilter`);
- `MapPlayer.create` (use `MapPlayer.fromIndex`);
- `Handle.getObject` and `Handle.initFromHandle`: `Handle` is abstract, a Wrapper subclass inherits `fromHandle` and the protected creation helper `expect`.

**Behaviour changes** (detailed in `migration/behaviour-changes.md`):

- `Timer.create`, `Trigger.create`, `Point.create`, `Rectangle.create` and `Region.create` now throw instead of wrapping nothing;
- `MultiboardItem.fromHandle` and `WeatherEffect.fromHandle` return `undefined` for `undefined`, like every other lookup;
- a frame the game did not find (handle id 0) is `undefined` from every `Frame` lookup, and `Frame.create*` throws for a missing frame definition;
- a lookup through a more specific class replaces the cached Wrapper (`Unit.fromHandle` after `Widget.fromEvent` gives a `Unit`, the one Wrapper for that Handle from then on);
- `MapPlayer` and every other Wrapper can be extended by a Map project;
- `MapPlayer.fromLocal()` no longer prints, and `Force.fromPlayer` no longer calls Blizzard.j.
