# no-unsafe-natives

Reports a call to a Native on the plugin's ban list: the ones that kill the thread, leak or desync (`TriggerSleepAction`, `PolledWait`, `DestroyEffectAfterTimeBJ`, the BJ timer helpers, `SelectGroupForPlayerBJ`, `SmartCameraPanBJ`). An error in the recommended config; the message gives the reason and the replacement.

## Why

Pitfalls C2, S1 and D9 of the catalogue (#15):

- **C2, sleeping Natives in the wrong context.** `TriggerSleepAction` "works only in a trigger action execution context, not in trigger conditions nor for example in timer functions or `ForGroup` functions ... If this is called in the wrong context, it crashes the thread" ([jassdoc](https://github.com/lep/jassdoc), `@bug`). `PolledWait` waits through it. In 3.0.0, `DestroyEffectAfterTimeBJ` stores its arguments in `bj_destroyEffectAsyncEffect/Time` and calls `ExecuteFunc("DestroyEffectAsyncBJ")`, which sleeps with `TriggerSleepAction` before destroying the effect (Blizzard.j of Patch 3.0.0.24268; [Warcraft III 3.0 Bugs & issues](https://www.hiveworkshop.com/threads/warcraft-iii-3-0-bugs-issues.374131/), post #36). Replacing `TriggerSleepAction` loops with timers fixed LAN drops in a converted map ([map desyncs](https://www.hiveworkshop.com/threads/lua-desync-map-desyncs.357871/)).
- **S1, BJ globals reused between calls.** `CreateTimerBJ`, `StartTimerBJ` and `GetLastCreatedTimerBJ` share `bj_lastStartedTimer`, which Blizzard.j creates in the Lua root and every call overwrites ([A comprehensive guide to mapping in Lua](https://www.hiveworkshop.com/threads/a-comprehensive-guide-to-mapping-in-lua.341880/)); `StartTimerBJ` is also listed in [Known causes of desync](https://www.hiveworkshop.com/threads/known-causes-of-desync.317486/).
- **D9, async-by-design engine behaviour.** `SelectGroupForPlayerBJ` runs `ForGroup` inside a `GetLocalPlayer` branch, a "systematic desync" on 1.32 and later; `SmartCameraPanBJ` is listed as a desync cause, reported fixed in 1.31 ([Known causes of desync](https://www.hiveworkshop.com/threads/known-causes-of-desync.317486/)).

The ban list is `data/unsafe-natives.json` in the package: one entry per Native with its reason and replacement, grown by pull request.

## Incorrect

```ts
import { Timer } from "reforged-ts";

Timer.after(1, () => {
  TriggerSleepAction(2); // kills this thread without an error
  print("never printed");
});

const timer = CreateTimerBJ(false, 5); // no callback, shared global
```

## Correct

```ts
import { Timer } from "reforged-ts";

Timer.after(1, () => {
  Timer.after(2, () => {
    print("printed three seconds after start");
  });
});

const timer = Timer.create();
timer.start(5, false, () => {
  print("expired");
});
```

## Options

`allow` (array of Native names, default `[]`): ban-list entries this project allows everywhere.

```js
{ rules: { "reforged/no-unsafe-natives": ["error", { allow: ["TriggerSleepAction"] }] } }
```

## Suggestions and fixes

None: each replacement moves code into a callback, which changes when it runs.

## When not to use it

When a call runs where the ban's reason does not apply, such as `TriggerSleepAction` in a trigger action. Silence that one line and say why:

```ts
// eslint-disable-next-line reforged/no-unsafe-natives -- runs in a trigger action, where the sleep is safe
TriggerSleepAction(1);
```
