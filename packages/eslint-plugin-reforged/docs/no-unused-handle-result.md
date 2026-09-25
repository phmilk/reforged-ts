# no-unused-handle-result

Reports an expression statement that discards a creation (`Unit.create(...)`, `CreateTimer()`, `AddSpecialEffect(...)`) or a `Filter(...)`/`Condition(...)` boolexpr. An error in the recommended config; keep the reference and destroy the object when it is no longer needed.

## Why

Pitfalls L1 and D8 of the catalogue (#15). Lua's collector frees Lua values, not engine objects: "you don't need to actively remove Lua objects. In fact you can't, because there are no destroy-methods for any type of data in native Lua" ([A comprehensive guide to mapping in Lua](https://www.hiveworkshop.com/threads/a-comprehensive-guide-to-mapping-in-lua.341880/), "The Garbage Collector"). Engine objects need their destroy Native: `boolexpr`, `conditionfunc` and `filterfunc` "must be explicitly destroyed with `DestroyBoolExpr`/`DestroyCondition`/`DestroyFilter` to prevent leaks", and locations "must be removed with `RemoveLocation`" ([jassdoc](https://github.com/lep/jassdoc)). A dropped result can never be destroyed, so it leaks for the rest of the game; "Huge amount of memory leaks" is itself listed as a desync cause ([Known causes of desync](https://www.hiveworkshop.com/threads/known-causes-of-desync.317486/)).

A creation is a Wrapper static whose name starts with `create`, or a Native listed in the plugin's `data/creation-natives.json` that returns a Handle type (see [`no-handles-at-module-top-level`](no-handles-at-module-top-level.md)). `Timer.after` and the other statics not named `create*` own what they make and are never reported, nor are lookups (`GetTriggerUnit()`) and the registration Natives (`TriggerRegisterTimerEvent`, `TriggerAddAction`).

## Incorrect

```ts
import { Init, MapPlayer, Unit } from "reforged-ts";

Init.onGlobals(() => {
  AddSpecialEffect(
    "Abilities\\Spells\\Human\\ThunderClap\\ThunderClapCaster.mdl",
    0,
    0,
  ); // leaks the effect
  Filter(() => true); // leaks the filterfunc
  Unit.create(MapPlayer.fromIndex(0)!, FourCC("hfoo"), 0, 0); // nothing refers to the unit
});
```

## Correct

```ts
import { Effect, Init, MapPlayer, Timer, Unit } from "reforged-ts";

Init.onGlobals(() => {
  const effect = Effect.create(
    "Abilities\\Spells\\Human\\ThunderClap\\ThunderClapCaster.mdl",
    0,
    0,
  );
  effect.destroy(); // plays its death animation, then frees it
  const footman = Unit.create(MapPlayer.fromIndex(0)!, FourCC("hfoo"), 0, 0);
  Timer.after(30, () => footman.kill()); // Timer.after owns its timer
});
```

## Options

None.

## Suggestions and fixes

None: adding a `destroy()` would change what the code does, and the right place to destroy is the author's call.

## When not to use it

When the object is reached again another way, such as a unit found through its group or a region, silence that one line and say why. To discard on purpose without an escape, write `void CreateUnit(...)`: the rule does not report a `void` expression.

```ts
// eslint-disable-next-line reforged/no-unused-handle-result -- the unit is found again through its group
CreateUnit(Player(0)!, FourCC("hfoo"), 0, 0, 0);
```
