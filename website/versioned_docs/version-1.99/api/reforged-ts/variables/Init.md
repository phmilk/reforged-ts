# Variable: Init

> `const` **Init**: [`InitStages`](../interfaces/InitStages.md)

Defined in: [init/index.ts:109](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/init/index.ts#L109)

The Init stages: where a Map project registers its initialization, each
stage right after one of the Blizzard functions the editor's `main` calls.

## Example

```ts
// A Map project's initialization, one stage at a time: the Handles are
// created once the globals exist, the trigger once the editor's own are
// made, and the round starts once the game has started.
import { Init, Timer, Trigger } from "reforged-ts";

let round: Timer | undefined;

Init.onGlobals(() => {
  round = Timer.create();
}, "round timer");

Init.onTriggers(() => {
  if (round === undefined) {
    return;
  }
  const trigger = Trigger.create();
  trigger.registerTimerExpire(round);
  trigger.addAction(() => {
    print("The round is over");
  });
}, "round end");

Init.onGameStart(() => {
  print(Init.hasRun("globals")); // true
  print(Init.current); // gameStart
  round?.start(60, false, () => undefined);
});
```
