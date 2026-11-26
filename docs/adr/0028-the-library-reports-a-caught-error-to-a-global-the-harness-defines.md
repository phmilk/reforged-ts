---
status: accepted
date: 2026-11-26
---

# The library reports a Caught error to a global the harness defines

A Caught error, an error the library caught from a Map project's callback, is printed and the game goes on: that is what keeps one broken handler from silently killing a game thread (ADR 0003, ADR 0007). In a test it also keeps the test green, so a broken callback passes. `reforged-test` must hear of each Caught error to fail the test that left it unexpected, without the library changing what it does in the game.

The library's three places that catch one (an Init queue, a protected callback, Dev mode's `MapPlayer.runLocal`) report through one internal function. Beside the line it prints today, unchanged, that function calls the global `__reforged_caught_error(origin, message)` when one is defined, on every failure, the repeats a protected callback only counts included. The game defines no such global, so nothing changes there; the Typings do not declare it, so a Map project does not see it. `reforged-test` defines it in every Test game, and its README documents it as the contract between the two packages. Warnings do not go through it.

## Considered options

- A marker in the printed line, which the harness would recognise in `print`'s output. The line is for the author and its wording would become a protocol; the origin and the message would have to be parsed back out of it; and a repeat the library only counts prints nothing, so the harness would miss it.
- A dependency between the two packages, one importing the other to register a listener. `reforged-ts` only peers on `reforged-test` for its own tests, a published library would then load test code or the harness would load a second copy of the library, and either way the Lua bundle of a map test would carry the coupling. A global needs neither package to know the other's modules.

## Consequences

- The global's name and its two arguments are a contract: renaming it, or changing what `origin` and `message` hold, is a breaking change for `reforged-test`.
- A new place in the library that catches a Map project's error must go through the same report function, or the harness does not hear of it.
- The library reads the global raw, so a `_G` metatable a map installed (an undeclared-global warner) never sees the lookup; the harness assigns the global on `_G` itself, since one served only through a metatable is not seen.
- The hook runs outside the `pcall` that caught the error: a hook that throws escapes into the callback's thread, which a harness's hook, the only definer, does not do.
- With Dev mode off a protected callback is not caught, so its error escapes as in the game and the hook is not called; an Init queue's failure is caught in either mode.

Decision record: https://github.com/phmilk/reforged-ts/issues/970
