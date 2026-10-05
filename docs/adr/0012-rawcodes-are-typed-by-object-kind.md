---
status: accepted
date: 2026-10-05
---

# Rawcodes are typed by Object kind

A Rawcode was a plain `number` in the Typings and the library, so a unit's Rawcode was accepted where an ability's was, and the mistake surfaced only in game, if at all. From 1.0.0 a Rawcode is typed by its Object kind: `Rawcode<"unit">`, `Rawcode<"unit" | "upgrade">` for a parameter that takes either (`techid`), `Rawcode` alone for any kind (`GetObjectName`). A plain `number` is rejected wherever a Rawcode is expected, and the kind flows from the Natives that return one (`GetUnitTypeId`, `GetSpellAbilityId`) to the ones that take one. The change breaks every caller that passes a `number`, so it fits only before 1.0.0.

The type is a brand over `number` (`number & { readonly [kind]: K }`), declared as an ambient global by the Typings next to `lua-runtime.d.ts`, with `ObjectKind` and `UnknownRawcode`. `FourCC(id: string)` returns `UnknownRawcode`, a Rawcode of unknown kind that every Rawcode parameter accepts: a literal the build knows nothing about still compiles, so code from w3ts that writes `FourCC("hfoo")` keeps working, and generated data about Built-in objects and Custom objects narrows a known literal to its kind later. A Rawcode widens to `number` for arithmetic and for the four-character codes that are not Rawcodes (weather effects, terrain types), which stay `number`. A computed `number` becomes a Rawcode with `as Rawcode<"unit">`: there is no helper function, since one could not check that the object exists and would cost a Lua call.

The Patch files carry no kind, so the generator takes it from a table of parameter names (`unitId`, `abilCode`…) and, for ambiguous names (`objectid`) and every return, from a `kind` field of the Overlay (`ObjectKind` or `"any"`), not from free TypeScript text. A parameter that looks like a Rawcode and that neither classifies is a generator diagnostic, so a new Patch cannot ship one untyped. This extends ADR 0001: the Overlay now also carries the Object kind of a Native's parameters and returns.

## Considered options

- Opt-in types: the names ship in 1.0.0 as aliases of `number`, and a consumer turns the brands on through module augmentation; the default flips in 2.0. Nothing breaks, but there are two modes to document and test, hovers show conditional types, and the default that catches mistakes waits for a major.
- No distinct types: constants with TSDoc and a lint rule only. Adding the types after 1.0.0 then costs a major, or falls back to the opt-in mode.
- `FourCC` returning `Rawcode` of any kind for an unknown literal: every literal without generated data, including all code from w3ts, would fail to compile.
- A named alias per kind (`UnitRawcode`): seven more names for what `Rawcode<"unit">` already says in a hover.

## Consequences

- Heroes are units; a skin's Rawcode has the Object kind of the Native that takes it (a unit's or an item's).
- The library mirrors the Typings in every API that takes or returns a Rawcode, with no overload that accepts `number`; an API that takes `string | number` takes `string | Rawcode<…>`.
- The migration page lists the change, with the `as` cast for computed Rawcodes.

Decision record: https://github.com/phmilk/reforged-ts/issues/463
