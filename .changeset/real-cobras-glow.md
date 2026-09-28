---
"reforged-ts": minor
"reforged-test": minor
---

The Trigger remove members take what the add members were given: `trigger.removeAction(fn)` removes the actions `trigger.addAction(fn)` added, and `trigger.removeCondition(fnOrBoolexpr)` the conditions `addCondition` added, destroying the `Condition` the Trigger made for a function (never a `boolexpr` you passed). `removeActions()`, `removeConditions()` and `destroy()` also destroy those `Condition`s, which used to leak. A raw `triggeraction` or `triggercondition` still goes straight to the Native, and every remove member now returns the Trigger. The test harness stubs `DestroyCondition`, and a stub handle's `tostring` now begins with its kind and a colon, as in the game.
