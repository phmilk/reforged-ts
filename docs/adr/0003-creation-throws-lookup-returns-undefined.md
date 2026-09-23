---
status: accepted
date: 2026-09-23
---

# Creation throws, lookup returns undefined; the Handle registry upgrades to the more specific Wrapper

Today's factories are split: five return non-null and about twenty-four return `X | undefined`, and `error()` fires only in deprecated constructors, so callers cannot tell from a name which factories need `?.`. We adopt one rule: a static `create` is typed non-null and calls `error()` when the Native returns nothing (the request was invalid: bad rawcode, missing FDF), while every lookup (`fromHandle`, `fromEvent`, `fromKilling`, `getItemInSlot`) returns `undefined` when the game has nothing to give. Constructors become protected and only store the Handle; one generic `Handle.fromHandle` replaces thirty copies and the `initHandle` global-state trick; the registry is class-aware and replaces a less specific cached Wrapper (`Widget`) with the requested one (`Unit`) instead of returning the wrong class.

## Considered options

- Everything `| undefined` (matches the Typings, cheapest): pushes a check onto every creation call site for failures that are programmer errors.
- Throwing on class mismatch in the registry: punishes event code that reached the Handle through `Widget.fromEvent()` for an internal caching detail.
- Keeping the deprecated constructors: keeps the `initHandle` trick and the double creation path alive.

## Consequences

- A thrown `error()` inside a WC3 Lua thread kills that thread silently unless the code runs under `pcall`; the Init stages run every callback under `pcall` and print failures, and the guard ticket owns the dev-mode reporting for the rest.
- Removing the constructors and unifying the error mode are breaking changes for w3ts 3.x consumers; the migration guide lists them.
- Old references to an upgraded Wrapper stay valid but are no longer the canonical object for `===`.

Decision record: https://github.com/phmilk/reforged-ts/issues/13 (prototype: branch `prototype/api-ergonomics`)
