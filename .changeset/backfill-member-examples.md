---
"reforged-ts": patch
---

Every `@async` member, Event descriptor and lifecycle member now shows a compiled example in its hover and on the docs site ([#279](https://github.com/phmilk/reforged-ts/issues/279)). A documentation change, with no behavior change in the game:

- An `@async` member's example feeds its local value to visuals only, such as the local camera, a frame or a text tag, never to game state.
- An Event descriptor's example shows its payload, the fields that can be `undefined`, and the Subscription `on()` returns.
- A `destroy()` example shows when to call it and what becomes of the references to a destroyed Wrapper. `Sound.killWhenDone` and `Subscription.destroy` show theirs too.
