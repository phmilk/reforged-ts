# no-legacy-w3ts-names

Reports a w3ts 3.x name that reforged-ts renamed or removed: an import from `w3ts`, an imported export, a member or static access on a library class, and a `new` of a library class; and the w3ts use of a member that kept its name but not its signature. An error in the recommended config; the message gives the replacement and why the name changed. One-to-one renames are fixed automatically.

## Why

reforged-ts 1 continues w3ts 3.x under a new package name, and its first major removes or renames public symbols: the deprecated constructors (`new Unit(...)` is `Unit.create(...)`), members that moved (`group.getEnumUnit()` is `Unit.fromEnum()`), accessors split into a get/set pair, and the old Hook code. A map migrating from w3ts no longer compiles against these names. The library lists every one of them, with its replacement and a one-sentence note, in its rename map, `migration/renames.json`. This rule reads that file from the Map project's own installation of `reforged-ts`, so the renames reported are those of the version the map compiles against.

Members and constructors are matched through the type checker: the object must be the library class, an instance of it or of a subclass, as w3ts and reforged-ts both declare it. A project class with a member of the same name is not reported. The map writes `Class.member` for static and instance members alike; the rule accepts both forms.

Some entries of the map keep their name and change what the member takes or gives: `GameCache.store` takes the `Unit` Wrapper where w3ts took the raw `unit` handle, and `GameCache.restoreUnit` returns the `Unit` and throws where it returned `undefined`. The name alone says nothing about such a call, so the rule reports one only where the type checker shows the w3ts use, with the entry's note:

- an argument the new parameter does not take, such as `hero.handle` where the `Unit` is taken;
- a result used where the new type does not fit, such as `Unit.fromHandle(cache.restoreUnit(...))` or `const u: unit = cache.restoreUnit(...)`;
- a result checked for a missing value when its type where it is checked cannot be missing, directly or through the `const` that holds it. Such a check never catches the failure the member now throws. A check is `=== undefined`, `== null`, `typeof x === "undefined"`, `??` or `?.`; on an object result, a truthiness test too (`!x`, `x && y`, `x || y`, a condition). A number or a string is also falsy at `0` or `""`, so its truthiness test is not a missing-value check and is not reported. A cast to a type that can be missing, such as `(cache.restoreUnit(...) as Unit | undefined) ?? spare`, makes the check deliberate and is not reported.

A call written for the new signature is never reported. An entry whose w3ts use still compiles and still works, such as `Camera.pan(x, y, undefined)` now that the last parameter is optional, or `Frame.setTextAlignment`, which now returns the Frame, reports nothing.

If the Map project has no `reforged-ts` installed, the plugin prints one warning at load and the rule reports nothing. A rename map that is present but malformed stops the lint at load, naming the field.

## Incorrect

```ts
import { GameCache, Group, MapPlayer, Unit } from "w3ts"; // the old package name

const hero = new Unit(MapPlayer.fromIndex(0)!, FourCC("Hpal"), 0, 0, 270); // new Unit(...)
const group = Group.create();
group.enumUnitsInRange(0, 0, 500, () => {
  const unit = group.getFilterUnit(); // a member that moved to Unit
  return true;
});
print(hero.owner.name); // an accessor split into a get/set pair

const cache = GameCache.create("Campaign.w3v");
cache.store("chapter1", "hero", hero.handle); // the raw handle where the Unit is taken
const restored = cache.restoreUnit("chapter1", "hero", hero.owner, 0, 0, 270);
if (restored !== undefined) {
  // never false: restoreUnit throws when no unit is stored
}
```

## Correct

```ts
import { GameCache, Group, MapPlayer, Unit } from "reforged-ts";

const hero = Unit.create(MapPlayer.fromIndex(0)!, FourCC("Hpal"), 0, 0, 270);
const group = Group.create();
group.enumUnitsInRange(0, 0, 500, () => {
  const unit = Unit.fromFilter();
  return true;
});
print(hero.getOwner().name);

const cache = GameCache.create("Campaign.w3v");
cache.store("chapter1", "hero", hero);
if (cache.hasUnit("chapter1", "hero")) {
  const restored = cache.restoreUnit(
    "chapter1",
    "hero",
    hero.getOwner(),
    0,
    0,
    270,
  );
}
```

## Options

None.

## Suggestions and fixes

When the map marks an entry one to one (the replacement takes the same arguments), the rule fixes it, applied on save or with `eslint --fix`:

- `import … from "w3ts"` (and `export … from`, `import("w3ts")`) reads `"reforged-ts"`;
- `new Unit(...)` becomes `Unit.create(...)` with the same arguments;
- a same-signature member rename, such as `MapPlayer.create(0)` to `MapPlayer.fromIndex(0)`. When the replacement is on another class (`group.getEnumUnit()` to `Unit.fromEnum()`), the whole callee is replaced and the class is added to the file's imports if it is missing;
- a renamed export keeps its local name: `import { old }` becomes `import { replacement as old }`.

Any other rename is a suggestion, applied on click. An entry that lists several replacements gives one suggestion per replacement: `new Effect(...)` offers `Effect.create(...)` and `Effect.createAttachment(...)`, which take different arguments. An accessor offers its getter on a read (`unit.owner` to `unit.getOwner()`) and its setter on an assignment (`unit.owner = p` to `unit.setOwner(p)`). A removed symbol has no replacement, so neither a fix nor a suggestion; its note says what to do instead. Neither has the use of a member that kept its name: its note says what the new use is.

## When not to use it

When the project still compiles against w3ts 3.x on purpose, turn the rule off in its config. For one line kept on an old name during a migration, say why:

```ts
// eslint-disable-next-line reforged/no-legacy-w3ts-names -- migrated with the Timer code in the next change
const player = MapPlayer.create(0);
```
